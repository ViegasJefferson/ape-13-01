import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { load } from "cheerio";

import type {
  ImportedProductData,
  ProductImportApiResponse,
} from "@/features/enxoval/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_REDIRECTS = 5;
const MAX_HTML_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 10_000;

type UnknownRecord =
  Record<string, unknown>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function hasSchemaType(
  value: UnknownRecord,
  expectedType: string,
) {
  const schemaType = value["@type"];

  if (typeof schemaType === "string") {
    return schemaType
      .toLowerCase()
      .endsWith(
        expectedType.toLowerCase(),
      );
  }

  if (Array.isArray(schemaType)) {
    return schemaType.some(
      (item) =>
        typeof item === "string" &&
        item
          .toLowerCase()
          .endsWith(
            expectedType.toLowerCase(),
          ),
    );
  }

  return false;
}

function collectProductNodes(
  value: unknown,
  products: UnknownRecord[],
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectProductNodes(
        item,
        products,
      );
    }

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (hasSchemaType(value, "Product")) {
    products.push(value);
  }

  for (const nestedValue of Object.values(
    value,
  )) {
    if (
      Array.isArray(nestedValue) ||
      isRecord(nestedValue)
    ) {
      collectProductNodes(
        nestedValue,
        products,
      );
    }
  }
}

function getEntityName(
  value: unknown,
): string | null {
  if (typeof value === "string") {
    return getString(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  return getString(value.name);
}

function getImageValue(
  value: unknown,
): string | null {
  if (typeof value === "string") {
    return getString(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const image =
        getImageValue(item);

      if (image) {
        return image;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    getString(value.secure_url) ??
    getString(value.secureUrl) ??
    getString(value.url) ??
    getString(value.contentUrl) ??
    getString(value.src)
  );
}

function parsePrice(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/[^\d,.-]/g, "");

  if (
    !cleaned ||
    cleaned.startsWith("-")
  ) {
    return null;
  }

  const lastComma =
    cleaned.lastIndexOf(",");

  const lastDot =
    cleaned.lastIndexOf(".");

  let normalized = cleaned;

  if (
    lastComma >= 0 &&
    lastDot >= 0
  ) {
    const decimalSeparator =
      lastComma > lastDot ? "," : ".";

    const thousandSeparator =
      decimalSeparator === "," ? "." : ",";

    normalized = cleaned
      .split(thousandSeparator)
      .join("");

    normalized =
      decimalSeparator === ","
        ? normalized.replace(",", ".")
        : normalized;
  } else if (lastComma >= 0) {
    const parts = cleaned.split(",");
    const decimalPart =
      parts[parts.length - 1];

    normalized =
      decimalPart.length >= 1 &&
      decimalPart.length <= 2
        ? `${parts
            .slice(0, -1)
            .join("")}.${decimalPart}`
        : parts.join("");
  } else if (lastDot >= 0) {
    const parts = cleaned.split(".");
    const decimalPart =
      parts[parts.length - 1];

    normalized =
      decimalPart.length >= 1 &&
      decimalPart.length <= 2
        ? `${parts
            .slice(0, -1)
            .join("")}.${decimalPart}`
        : parts.join("");
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) &&
    parsed >= 0
    ? parsed
    : null;
}

function getOfferObjects(
  value: unknown,
): UnknownRecord[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }

  if (isRecord(value)) {
    return [value];
  }

  return [];
}

function extractOfferDetails(
  product: UnknownRecord | undefined,
) {
  if (!product) {
    return {
      price: null as number | null,
      currency: null as string | null,
      sellerName: null as string | null,
    };
  }

  const offers = getOfferObjects(
    product.offers,
  );

  for (const offer of offers) {
    const price =
      parsePrice(offer.price) ??
      parsePrice(offer.lowPrice) ??
      parsePrice(offer.highPrice);

    const currency =
      getString(offer.priceCurrency)
        ?.toUpperCase() ?? null;

    const sellerName =
      getEntityName(offer.seller);

    if (price !== null) {
      return {
        price,
        currency,
        sellerName,
      };
    }

    const specifications =
      getOfferObjects(
        offer.priceSpecification,
      );

    for (const specification of specifications) {
      const specificationPrice =
        parsePrice(
          specification.price,
        );

      if (
        specificationPrice !== null
      ) {
        return {
          price:
            specificationPrice,

          currency:
            getString(
              specification.priceCurrency,
            )?.toUpperCase() ??
            currency,

          sellerName,
        };
      }
    }
  }

  return {
    price: null,
    currency: null,
    sellerName: null,
  };
}

function resolveHttpUrl(
  value: string | null,
  baseUrl: string,
): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(
      value,
      baseUrl,
    );

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

function isBlockedIpv4(
  address: string,
) {
  const parts = address
    .split(".")
    .map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255,
    )
  ) {
    return true;
  }

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 &&
      second >= 64 &&
      second <= 127) ||
    (first === 169 &&
      second === 254) ||
    (first === 172 &&
      second >= 16 &&
      second <= 31) ||
    (first === 192 &&
      second === 168) ||
    (first === 192 &&
      second === 0) ||
    (first === 192 &&
      second === 2) ||
    (first === 198 &&
      (second === 18 ||
        second === 19)) ||
    (first === 198 &&
      second === 51) ||
    (first === 203 &&
      second === 0) ||
    first >= 224
  );
}

function isBlockedIpv6(
  address: string,
) {
  const normalized = address
    .toLowerCase()
    .split("%")[0];

  const ipv4Match = normalized.match(
    /(\d+\.\d+\.\d+\.\d+)$/,
  );

  if (
    ipv4Match &&
    isBlockedIpv4(ipv4Match[1])
  ) {
    return true;
  }

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized ===
      "0:0:0:0:0:0:0:0" ||
    normalized ===
      "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  const firstPartText =
    normalized.split(":")[0] || "0";

  const firstPart = Number.parseInt(
    firstPartText,
    16,
  );

  return (
    (firstPart & 0xfe00) ===
      0xfc00 ||
    (firstPart & 0xffc0) ===
      0xfe80 ||
    (firstPart & 0xff00) ===
      0xff00 ||
    normalized.startsWith(
      "2001:db8:",
    )
  );
}

function isBlockedIp(
  address: string,
) {
  const version = isIP(address);

  if (version === 4) {
    return isBlockedIpv4(address);
  }

  if (version === 6) {
    return isBlockedIpv6(address);
  }

  return true;
}

async function assertSafePublicUrl(
  rawUrl: string,
) {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      "O link informado é inválido.",
    );
  }

  if (
    parsed.protocol !== "http:" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "O link deve começar com http:// ou https://.",
    );
  }

  if (
    parsed.username ||
    parsed.password
  ) {
    throw new Error(
      "Links com usuário ou senha não são permitidos.",
    );
  }

  const hostname = parsed.hostname
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "")
    .toLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(
      ".localhost",
    ) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan")
  ) {
    throw new Error(
      "Esse endereço não é permitido.",
    );
  }

  const addresses =
    isIP(hostname) !== 0
      ? [{ address: hostname }]
      : await lookup(hostname, {
          all: true,
          verbatim: true,
        });

  if (
    addresses.length === 0 ||
    addresses.some((entry) =>
      isBlockedIp(entry.address),
    )
  ) {
    throw new Error(
      "O endereço informado não é público.",
    );
  }

  return parsed;
}

function isMercadoLivreHostname(
  hostname: string,
) {
  const normalizedHostname =
    hostname.toLowerCase();

  return (
    normalizedHostname ===
      "mercadolivre.com.br" ||
    normalizedHostname.endsWith(
      ".mercadolivre.com.br",
    ) ||
    normalizedHostname ===
      "mercadolibre.com" ||
    normalizedHostname.endsWith(
      ".mercadolibre.com",
    )
  );
}

function unwrapMercadoLivreVerificationUrl(
  rawUrl: string,
) {
  let currentUrl =
    rawUrl.trim();

  for (
    let attempt = 0;
    attempt < 3;
    attempt += 1
  ) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(
        currentUrl,
      );
    } catch {
      return currentUrl;
    }

    const isVerificationPage =
      isMercadoLivreHostname(
        parsedUrl.hostname,
      ) &&
      parsedUrl.pathname.includes(
        "/gz/account-verification",
      );

    if (!isVerificationPage) {
      return parsedUrl.href;
    }

    const originalUrl =
      parsedUrl.searchParams.get(
        "go",
      );

    if (!originalUrl) {
      return parsedUrl.href;
    }

    currentUrl =
      originalUrl;
  }

  return currentUrl;
}

function getMercadoLivreTitleFromUrl(
  productUrl: URL,
) {
  const pathBeforeProduct =
    productUrl.pathname.split(
      /\/p\//i,
    )[0];

  const slug =
    pathBeforeProduct
      .split("/")
      .filter(Boolean)
      .at(-1) ?? "";

  if (!slug) {
    return null;
  }

  const title = decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => {
      if (/^\d+$/.test(word)) {
        return word;
      }

      if (
        /\d/.test(word) ||
        word.length <= 2
      ) {
        return word.toUpperCase();
      }

      return (
        word.charAt(0).toUpperCase() +
        word.slice(1)
      );
    })
    .join(" ")
    .trim();

  return title || null;
}

function extractMercadoLivreIds(
  productUrl: URL,
) {
  const productIdMatch =
    productUrl.pathname.match(
      /\/p\/(MLB\d+)/i,
    );

  const filters =
    productUrl.searchParams.get(
      "pdp_filters",
    ) ?? "";

  const itemIdFromFilter =
    filters.match(
      /item_id\s*:\s*(MLB\d+)/i,
    );

  const itemIdFromUrl =
    decodeURIComponent(
      productUrl.href,
    ).match(
      /item_id\s*:\s*(MLB\d+)/i,
    );

  const oldListingMatch =
    productUrl.pathname.match(
      /\/MLB-?(\d{6,})/i,
    );

  return {
    productId:
      productIdMatch?.[1]
        ?.toUpperCase() ??
      null,

    itemId:
      itemIdFromFilter?.[1]
        ?.toUpperCase() ??
      itemIdFromUrl?.[1]
        ?.toUpperCase() ??
      (
        oldListingMatch?.[1]
          ? `MLB${oldListingMatch[1]}`
          : null
      ),
  };
}

async function fetchMercadoLivreJson(
  url: string,
): Promise<unknown | null> {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const accessToken =
    process.env
      .MERCADO_LIVRE_ACCESS_TOKEN
      ?.trim();

  const headers: Record<
    string,
    string
  > = {
    Accept: "application/json",
    "Accept-Language":
      "pt-BR,pt;q=0.9",
    "User-Agent":
      "Ape1301ProductImporter/1.0",
  };

  if (accessToken) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(
      url,
      {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers,
      },
    );

    if (!response.ok) {
      console.warn(
        "Mercado Livre API:",
        response.status,
        url,
      );

      return null;
    }

    return (
      await response.json()
    ) as unknown;
  } catch (error) {
    console.warn(
      "Falha ao consultar a API do Mercado Livre:",
      error,
    );

    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function getMercadoLivreOffers(
  value: unknown,
) {
  if (!isRecord(value)) {
    return [];
  }

  if (!Array.isArray(value.results)) {
    return [];
  }

  return value.results.filter(
    isRecord,
  );
}

function getMercadoLivreOfferPrice(
  offer: UnknownRecord | undefined,
) {
  if (!offer) {
    return null;
  }

  if (isRecord(offer.sale_price)) {
    const salePrice = parsePrice(
      offer.sale_price.amount,
    );

    if (salePrice !== null) {
      return salePrice;
    }
  }

  return parsePrice(offer.price);
}

async function importMercadoLivreProduct(
  rawUrl: string,
): Promise<ImportedProductData | null> {
  const originalUrl =
    unwrapMercadoLivreVerificationUrl(
      rawUrl,
    );

  const parsedUrl =
    await assertSafePublicUrl(
      originalUrl,
    );

  if (
    !isMercadoLivreHostname(
      parsedUrl.hostname,
    )
  ) {
    return null;
  }

  const {
    productId,
    itemId,
  } = extractMercadoLivreIds(
    parsedUrl,
  );

  /*
   * A consulta pelo item é a mais importante,
   * porque contém título, preço e imagens
   * do anúncio selecionado.
   */
  const itemData =
    itemId
      ? await fetchMercadoLivreJson(
          `https://api.mercadolibre.com/items/${itemId}`,
        )
      : null;

  const item =
    isRecord(itemData)
      ? itemData
      : null;

  /*
   * O produto de catálogo é usado como
   * complemento para nome e imagem.
   */
  const productData =
    productId
      ? await fetchMercadoLivreJson(
          `https://api.mercadolibre.com/products/${productId}`,
        )
      : null;

  const product =
    isRecord(productData)
      ? productData
      : null;

  const salePrice =
    isRecord(item?.sale_price)
      ? parsePrice(
          item.sale_price.amount,
        )
      : null;

  const price =
    salePrice ??
    parsePrice(item?.price) ??
    parsePrice(
      item?.base_price,
    ) ??
    parsePrice(product?.price);

  const title =
  getString(item?.title) ??
  getString(product?.name) ??
  getString(product?.title) ??
  getMercadoLivreTitleFromUrl(
    parsedUrl,
  );

  const rawImage =
    getImageValue(
      item?.pictures,
    ) ??
    getImageValue(
      item?.thumbnail,
    ) ??
    getImageValue(
      item?.secure_thumbnail,
    ) ??
    getImageValue(
      product?.pictures,
    ) ??
    getImageValue(
      product?.images,
    );

  const imageUrl =
    resolveHttpUrl(
      rawImage,
      parsedUrl.href,
    );

  const currency =
    getString(
      item?.currency_id,
    )?.toUpperCase() ??
    getString(
      product?.currency_id,
    )?.toUpperCase() ??
    (
      price !== null
        ? "BRL"
        : null
    );

  const foundUsefulData =
    Boolean(title) ||
    Boolean(imageUrl) ||
    price !== null;

  if (!foundUsefulData) {
    return null;
  }

  return {
    title,
    imageUrl,
    price,
    currency,
    storeName:
      "Mercado Livre",

    /*
     * Mantém o endereço original.
     * Nunca salva a página account-verification.
     */
    url: parsedUrl.href,
  };
}

async function readLimitedHtml(
  response: Response,
) {
  const reader =
    response.body?.getReader();

  if (!reader) {
    return "";
  }

  const decoder =
    new TextDecoder();

  let totalBytes = 0;
  let html = "";

  while (true) {
    const {
      done,
      value,
    } = await reader.read();

    if (done) {
      break;
    }

    totalBytes += value.byteLength;

    if (
      totalBytes >
      MAX_HTML_BYTES
    ) {
      await reader.cancel();

      throw new Error(
        "A página do produto é grande demais para ser importada.",
      );
    }

    html += decoder.decode(value, {
      stream: true,
    });
  }

  html += decoder.decode();

  return html;
}

async function fetchProductHtml(
  rawUrl: string,
) {
  let currentUrl =
    await assertSafePublicUrl(rawUrl);

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REDIRECTS;
    redirectCount += 1
  ) {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(
        currentUrl,
        {
          method: "GET",
          redirect: "manual",
          cache: "no-store",
          signal: controller.signal,

          headers: {
            Accept:
              "text/html,application/xhtml+xml",

            "Accept-Language":
              "pt-BR,pt;q=0.9,en;q=0.7",

            "User-Agent":
              "Mozilla/5.0 (compatible; Ape1301ProductImporter/1.0)",
          },
        },
      );

      if (
        [301, 302, 303, 307, 308].includes(
          response.status,
        )
      ) {
        const location =
          response.headers.get(
            "location",
          );

        if (!location) {
          throw new Error(
            "A loja retornou um redirecionamento inválido.",
          );
        }

        currentUrl =
          await assertSafePublicUrl(
            new URL(
              location,
              currentUrl,
            ).href,
          );

        continue;
      }

      if (!response.ok) {
        throw new Error(
          `A loja respondeu com o código ${response.status}.`,
        );
      }

      const contentType =
        response.headers
          .get("content-type")
          ?.toLowerCase() ?? "";

      if (
        contentType &&
        !contentType.includes(
          "text/html",
        ) &&
        !contentType.includes(
          "application/xhtml+xml",
        )
      ) {
        throw new Error(
          "O endereço informado não retornou uma página HTML.",
        );
      }

      const contentLength = Number(
        response.headers.get(
          "content-length",
        ),
      );

      if (
        Number.isFinite(
          contentLength,
        ) &&
        contentLength >
          MAX_HTML_BYTES
      ) {
        throw new Error(
          "A página do produto é grande demais para ser importada.",
        );
      }

      const html =
        await readLimitedHtml(
          response,
        );

      return {
        html,
        finalUrl: currentUrl.href,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error(
          "A loja demorou demais para responder.",
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(
    "A página realizou redirecionamentos demais.",
  );
}

function extractProductData(
  html: string,
  finalUrl: string,
): ImportedProductData {
  const $ = load(html);

  const productNodes:
    UnknownRecord[] = [];

  $(
    'script[type="application/ld+json"]',
  ).each((_, element) => {
    const content =
      $(element).html()?.trim();

    if (!content) {
      return;
    }

    try {
      const parsed: unknown =
        JSON.parse(content);

      collectProductNodes(
        parsed,
        productNodes,
      );
    } catch {
      // Algumas lojas possuem JSON-LD inválido.
    }
  });

  const product =
    productNodes.find(
      (node) =>
        Boolean(
          getString(node.name),
        ),
    ) ?? productNodes[0];

  function getMetaContent(
    selectors: string[],
  ) {
    for (const selector of selectors) {
      const content = $(
        selector,
      )
        .first()
        .attr("content")
        ?.trim();

      if (content) {
        return content;
      }
    }

    return null;
  }

  const offerDetails =
    extractOfferDetails(product);

  const title =
    getString(product?.name) ??
    getMetaContent([
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    ]) ??
    getString(
      $("title").first().text(),
    );

  const rawImage =
    getImageValue(product?.image) ??
    getMetaContent([
      'meta[property="og:image"]',
      'meta[property="og:image:url"]',
      'meta[name="twitter:image"]',
    ]);

  const metaPrice =
    parsePrice(
      getMetaContent([
        'meta[property="product:price:amount"]',
        'meta[itemprop="price"]',
        'meta[name="price"]',
      ]),
    );

  const metaCurrency =
    getMetaContent([
      'meta[property="product:price:currency"]',
      'meta[itemprop="priceCurrency"]',
    ])?.toUpperCase() ?? null;

  const storeName =
    offerDetails.sellerName ??
    getMetaContent([
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
    ]) ??
    new URL(finalUrl)
      .hostname
      .replace(/^www\./, "")
      .split(".")[0];

  return {
    title,
    imageUrl: resolveHttpUrl(
      rawImage,
      finalUrl,
    ),

    price:
      offerDetails.price ??
      metaPrice,

    currency:
      offerDetails.currency ??
      metaCurrency,

    storeName,
    url: finalUrl,
  };
}

function jsonResponse(
  body: ProductImportApiResponse,
  status = 200,
) {
  return Response.json(body, {
    status,
  });
}

export async function POST(
  request: Request,
) {
  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return jsonResponse(
      {
        status: "error",
        message:
          "Sua sessão expirou. Entre novamente.",
      },
      401,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        status: "error",
        message:
          "A requisição enviada é inválida.",
      },
      400,
    );
  }

  if (
    !isRecord(body) ||
    typeof body.url !== "string"
  ) {
    return jsonResponse(
      {
        status: "error",
        message:
          "Informe o link do produto.",
      },
      400,
    );
  }

  try {
  const normalizedUrl =
    unwrapMercadoLivreVerificationUrl(
      body.url.trim(),
    );

  const parsedInputUrl =
    await assertSafePublicUrl(
      normalizedUrl,
    );

  const isMercadoLivre =
    isMercadoLivreHostname(
      parsedInputUrl.hostname,
    );

  if (isMercadoLivre) {
    const mercadoLivreProduct =
      await importMercadoLivreProduct(
        normalizedUrl,
      );

    if (!mercadoLivreProduct) {
  const fallbackTitle =
    getMercadoLivreTitleFromUrl(
      parsedInputUrl,
    );

  return jsonResponse({
    status: "success",

    message:
      "O produto foi identificado pelo link. Imagem e preço devem ser informados manualmente.",

    product: {
      title: fallbackTitle,
      imageUrl: null,
      price: null,
      currency: "BRL",
      storeName: "Mercado Livre",
      url: normalizedUrl,
    },
  });
}

    let imageUrl =
      mercadoLivreProduct.imageUrl;

    if (imageUrl) {
      try {
        await assertSafePublicUrl(
          imageUrl,
        );
      } catch {
        imageUrl = null;
      }
    }

    return jsonResponse({
      status: "success",

      message:
        "Produto importado pelo anúncio do Mercado Livre.",

      product: {
        ...mercadoLivreProduct,
        imageUrl,
      },
    });
  }

  const {
    html,
    finalUrl,
  } = await fetchProductHtml(
    normalizedUrl,
  );

  const extractedProduct =
    extractProductData(
      html,
      finalUrl,
    );

    let imageUrl =
      extractedProduct.imageUrl;

    if (imageUrl) {
      try {
        await assertSafePublicUrl(
          imageUrl,
        );
      } catch {
        imageUrl = null;
      }
    }

    const product = {
      ...extractedProduct,
      imageUrl,
    };

    const foundUsefulData =
      Boolean(product.title) ||
      Boolean(product.imageUrl) ||
      product.price !== null;

    if (!foundUsefulData) {
      return jsonResponse(
        {
          status: "error",
          message:
            "A página foi acessada, mas a loja não disponibilizou nome, imagem ou preço em formato reconhecível.",
        },
        422,
      );
    }

    return jsonResponse({
      status: "success",
      message:
        "As informações disponíveis foram importadas.",
      product,
    });
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível importar o produto.",
      },
      422,
    );
  }
}