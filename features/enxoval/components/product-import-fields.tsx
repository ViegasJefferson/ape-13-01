"use client";

import { useState } from "react";
import { ImageIcon, LoaderCircle, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import type { ProductImportApiResponse } from "@/features/enxoval/types";

interface ProductImportFieldsProps {
  fieldIdSuffix: string;

  defaultTitle?: string;
  defaultStoreName?: string;
  defaultProductUrl?: string;

  defaultEstimatedUnitAmount?: number;

  defaultProductImageUrl?: string;
}

export function ProductImportFields({
  fieldIdSuffix,

  defaultTitle = "",
  defaultStoreName = "",
  defaultProductUrl = "",

  defaultEstimatedUnitAmount = 0,

  defaultProductImageUrl = "",
}: ProductImportFieldsProps) {
  const [title, setTitle] = useState(defaultTitle);

  const [storeName, setStoreName] = useState(defaultStoreName);

  const [productUrl, setProductUrl] = useState(defaultProductUrl);

  const [estimatedUnitAmount, setEstimatedUnitAmount] = useState(
    String(defaultEstimatedUnitAmount),
  );

  const [productImageUrl, setProductImageUrl] = useState(
    defaultProductImageUrl,
  );

  const [isImporting, setIsImporting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleImport() {
    const normalizedUrl = productUrl.trim();

    setFeedback(null);

    try {
      const parsed = new URL(normalizedUrl);

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("O link deve começar com http:// ou https://.");
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Informe um link de produto válido.",
      });

      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch("/api/produtos/importar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          url: normalizedUrl,
        }),
      });

      const result = (await response.json()) as ProductImportApiResponse;

      if (!response.ok || result.status === "error" || !result.product) {
        throw new Error(
          result.message || "Não foi possível importar o produto.",
        );
      }

      const product = result.product;

      const importedFields: string[] = [];

      if (product.title) {
        setTitle(product.title);

        importedFields.push("nome");
      }

      if (product.storeName) {
        setStoreName(product.storeName);

        importedFields.push("loja");
      }

      if (product.imageUrl) {
        setProductImageUrl(product.imageUrl);

        importedFields.push("imagem");
      }

      if (product.url && !product.url.includes("/gz/account-verification")) {
        setProductUrl(product.url);
      }

      if (
        product.price !== null &&
        (!product.currency || product.currency === "BRL")
      ) {
        setEstimatedUnitAmount(String(product.price));

        importedFields.push("preço");
      }

      const currencyWarning =
        product.price !== null && product.currency && product.currency !== "BRL"
          ? ` O preço encontrado está em ${product.currency} e não foi aplicado automaticamente.`
          : "";

      const unavailableFields: string[] =
  [];

if (!product.imageUrl) {
  unavailableFields.push("imagem");
}

if (product.price === null) {
  unavailableFields.push("preço");
}

const unavailableMessage =
  unavailableFields.length > 0
    ? ` Preencha manualmente: ${unavailableFields.join(
        " e ",
      )}.`
    : "";

setFeedback({
  type: "success",

  message:
    importedFields.length > 0
      ? `Importado: ${importedFields.join(
          ", ",
        )}.${unavailableMessage}${currencyWarning}`
      : `O produto foi identificado pelo link.${unavailableMessage}${currencyWarning}`,
});
    } catch (error) {
      setFeedback({
        type: "error",

        message:
          error instanceof Error
            ? error.message
            : "Não foi possível importar o produto.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`product-url-${fieldIdSuffix}`}>Link do produto</Label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={`product-url-${fieldIdSuffix}`}
            name="productUrl"
            type="url"
            value={productUrl}
            onChange={(event) => setProductUrl(event.target.value)}
            maxLength={1000}
            placeholder="https://loja.com.br/produto"
          />

          <Button
            type="button"
            variant="outline"
            disabled={isImporting || !productUrl.trim()}
            className="shrink-0"
            onClick={handleImport}
          >
            {isImporting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Buscando
              </>
            ) : (
              <>
                <Search className="size-4" />
                Buscar informações
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          O preenchimento automático depende das informações disponibilizadas
          pela loja.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={
            feedback.type === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2"
              : "rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
          }
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`product-image-${fieldIdSuffix}`}>Link da imagem</Label>

        <Input
          id={`product-image-${fieldIdSuffix}`}
          type="url"
          value={productImageUrl}
          onChange={(event) => setProductImageUrl(event.target.value)}
          maxLength={2000}
          placeholder="https://...imagem.jpg"
        />

        <p className="text-xs leading-5 text-slate-500">
          No produto, clique com o botão direito sobre a imagem e escolha
          “Copiar endereço da imagem”. Depois cole o endereço aqui.
        </p>
      </div>

      {productImageUrl && (
        <div className="sm:col-span-2">
          <div className="flex items-start gap-4 rounded-2xl border bg-slate-50 p-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImageUrl}
                alt="Imagem importada do produto"
                className="size-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="size-4 text-emerald-900" />

                <p className="font-medium">Imagem encontrada</p>
              </div>

              <p className="mt-2 break-all text-xs text-slate-500">
                {productImageUrl}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-red-700"
                onClick={() => setProductImageUrl("")}
              >
                <Trash2 className="size-4" />
                Remover imagem
              </Button>
            </div>
          </div>
        </div>
      )}

      <input type="hidden" name="productImageUrl" value={productImageUrl} />

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`title-${fieldIdSuffix}`}>Item</Label>

        <Input
          id={`title-${fieldIdSuffix}`}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={150}
          required
          placeholder="Ex.: Jogo de panelas"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`store-${fieldIdSuffix}`}>Loja</Label>

        <Input
          id={`store-${fieldIdSuffix}`}
          name="storeName"
          value={storeName}
          onChange={(event) => setStoreName(event.target.value)}
          maxLength={150}
          placeholder="Ex.: Magazine Luiza"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`estimated-${fieldIdSuffix}`}>
          Valor unitário estimado
        </Label>

        <Input
          id={`estimated-${fieldIdSuffix}`}
          name="estimatedUnitAmount"
          type="number"
          min="0"
          step="0.01"
          value={estimatedUnitAmount}
          onChange={(event) => setEstimatedUnitAmount(event.target.value)}
        />
      </div>
    </>
  );
}
