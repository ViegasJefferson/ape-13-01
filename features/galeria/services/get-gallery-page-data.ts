import type {
  GalleryItem,
  GalleryPageData,
  GallerySection,
  GallerySourceOption,
} from "@/features/galeria/types";

import { getDocumentsPageData } from "@/features/documentos/services/get-documents-page-data";

import { getConstructionMedia } from "@/features/obra/services/get-construction-media";

import { createClient } from "@/lib/supabase/server";

const GALLERY_BUCKET = "apartment-media";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberRow {
  role: string;
}

interface ApartmentMediaRow {
  id: string;

  apartment_id: string;

  section: string;

  title: string | null;
  description: string | null;

  room: string | null;

  tags: string[] | null;

  reference_date: string | null;

  source_type: string | null;
  source_id: string | null;

  bucket_id: string;
  storage_path: string;

  original_file_name: string;

  mime_type: string;

  size_bytes: number | string;

  created_at: string;
}

interface HouseholdImageRow {
  id: string;

  apartment_id: string;

  title: string;

  category: string;

  room: string | null;

  product_image_url: string | null;

  product_url: string | null;

  store_name: string | null;

  created_at: string;
}

interface RenovationGalleryRow {
  id: string;
  title: string;
  area: string | null;
  status: string;
}

const genericSections: GallerySection[] = [
  "architecture",
  "renovation",
  "inspiration",
  "other",
];

function isGenericSection(value: string): value is GallerySection {
  return genericSections.includes(value as GallerySection);
}

function removeFileExtension(value: string) {
  return value.replace(/\.[^/.]+$/, "");
}

function getSortDate(item: GalleryItem) {
  return item.referenceDate ?? item.createdAt;
}

export async function getGalleryPageData(): Promise<GalleryPageData | null> {
  const supabase = await createClient();

  // =======================================================
  // APARTAMENTO
  // =======================================================

  const { data: apartmentData, error: apartmentError } = await supabase
    .from("apartments")
    .select("id, name")
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (apartmentError) {
    throw new Error(
      `Não foi possível carregar o apartamento: ${apartmentError.message}`,
    );
  }

  if (!apartmentData) {
    return null;
  }

  const apartment = apartmentData as ApartmentRow;

  // =======================================================
  // USUÁRIO / PERMISSÃO
  // =======================================================

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    throw new Error("Não foi possível identificar o usuário atual.");
  }

  const [
    memberResponse,
    apartmentMediaResponse,
    householdResponse,
    renovationResponse,
    constructionMedia,
    documentsData,
  ] = await Promise.all([
    supabase
      .from("apartment_members")
      .select("role")
      .eq("apartment_id", apartment.id)
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("apartment_media")
      .select(
        `
          id,
          apartment_id,
          section,
          title,
          description,
          room,
          tags,
          reference_date,
          source_type,
          source_id,
          bucket_id,
          storage_path,
          original_file_name,
          mime_type,
          size_bytes,
          created_at
        `,
      )
      .eq("apartment_id", apartment.id)
      .order("reference_date", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("household_items")
      .select(
        `
          id,
          apartment_id,
          title,
          category,
          room,
          product_image_url,
          product_url,
          store_name,
          created_at
        `,
      )
      .eq("apartment_id", apartment.id)
      .not("product_image_url", "is", null),

    supabase
      .from("renovation_items")
      .select(
        `
      id,
      title,
      area,
      status
    `,
      )
      .eq("apartment_id", apartment.id)
      .neq("status", "cancelled")
      .order("title", {
        ascending: true,
      }),

    getConstructionMedia(apartment.id),

    getDocumentsPageData(),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (apartmentMediaResponse.error) {
    throw new Error(
      `Não foi possível carregar as imagens da galeria: ${apartmentMediaResponse.error.message}`,
    );
  }

  if (householdResponse.error) {
    throw new Error(
      `Não foi possível carregar as imagens do enxoval: ${householdResponse.error.message}`,
    );
  }

  if (
  renovationResponse.error
  ) {
  throw new Error(
    `Não foi possível carregar os itens da reforma: ${renovationResponse.error.message}`,
  );
  }

  const member = memberResponse.data as MemberRow | null;

  const canEdit = member?.role === "owner" || member?.role === "editor";

  const renovationOptions:
  GallerySourceOption[] =
  (
    (
      renovationResponse.data ??
      []
    ) as RenovationGalleryRow[]
  ).map((item) => ({
    id: item.id,
    title: item.title,
    room: item.area,
  }));

  // =======================================================
  // GALERIA PRÓPRIA
  // =======================================================

  const apartmentMediaRows = (apartmentMediaResponse.data ??
    []) as ApartmentMediaRow[];

  const apartmentMediaPaths = apartmentMediaRows.map(
    (item) => item.storage_path,
  );

  const signedGalleryUrlByPath = new Map<string, string>();

  if (apartmentMediaPaths.length > 0) {
    const { data: signedFiles, error: signedError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .createSignedUrls(apartmentMediaPaths, 3600);

    if (signedError) {
      throw new Error(
        `Não foi possível gerar os links das imagens da galeria: ${signedError.message}`,
      );
    }

    for (const file of signedFiles ?? []) {
      if (file.path && file.signedUrl) {
        signedGalleryUrlByPath.set(file.path, file.signedUrl);
      }
    }
  }

  const genericItems: GalleryItem[] = apartmentMediaRows.flatMap(
    (row): GalleryItem[] => {
      if (!isGenericSection(row.section)) {
        return [];
      }

      const signedUrl = signedGalleryUrlByPath.get(row.storage_path);

      if (!signedUrl) {
        return [];
      }

      const linkedRenovation =
        row.source_type ===
          "renovation_item" &&
        Boolean(row.source_id);

      const renovationItem =
        linkedRenovation
          ? renovationOptions.find(
              (option) =>
                option.id ===
                row.source_id,
            )
          : undefined;

      const item: GalleryItem = {
        id: `gallery:${row.id}`,

        entityId: row.id,

        apartmentId: row.apartment_id,

        section: row.section,

        title: row.title?.trim() || removeFileExtension(row.original_file_name),

        description: row.description,

        room: row.room,

        tags: row.tags ?? [],

        imageUrl: signedUrl,

        referenceDate: row.reference_date,

        createdAt: row.created_at,

        sourceType: "apartment_media",

        sourceLabel:
          renovationItem
            ? renovationItem.title
            : "Galeria",

        sourceHref:
          renovationItem
            ? `/reforma#reforma-${renovationItem.id}`
            : null,

        sourceId:
          row.id,

        linkedSourceType:
          row.source_type,

        linkedSourceId:
          row.source_id,

        isExternal: false,

        canDeleteHere: canEdit,

        bucketId: row.bucket_id,

        storagePath: row.storage_path,
      };

      return [item];
    },
  );

  // =======================================================
  // OBRA
  // =======================================================

  const constructionItems: GalleryItem[] = constructionMedia
    .filter((media) => media.mediaType === "image")
    .map((media) => ({
      id: `construction:${media.id}`,

      entityId: media.id,

      apartmentId: media.apartmentId,

      section: "construction",

      title:
        media.title?.trim() ||
        media.stageName ||
        removeFileExtension(media.originalFileName),

      description: media.description,

      room: null,

      tags: media.stageName ? [media.stageName] : [],

      imageUrl: media.signedUrl,

      referenceDate: media.capturedAt ?? media.referenceMonth,

      createdAt: media.createdAt,

      sourceType: "construction_media",

      sourceLabel: "Obra do apartamento",

      sourceHref: "/obra",

      sourceId: media.id,

      linkedSourceType:
        "construction_media",

      linkedSourceId:
        media.id,

      isExternal: false,

      canDeleteHere: false,

      bucketId: media.bucketId,

      storagePath: media.storagePath,
    }));

  // =======================================================
  // ENXOVAL
  // =======================================================

  const householdRows = (householdResponse.data ?? []) as HouseholdImageRow[];

  const householdItems: GalleryItem[] = householdRows
    .filter((row) => Boolean(row.product_image_url))
    .map((row) => ({
      id: `household:${row.id}`,

      entityId: row.id,

      apartmentId: row.apartment_id,

      section: "household",

      title: row.title,

      description: row.store_name
        ? `Produto cadastrado em ${row.store_name}.`
        : "Produto cadastrado no chá e enxoval.",

      room: row.room,

      tags: [row.category].filter(Boolean),

      imageUrl: row.product_image_url as string,

      referenceDate: null,

      createdAt: row.created_at,

      sourceType: "household_item",

      sourceLabel: "Chá e enxoval",

      sourceHref: "/enxoval",

      sourceId: row.id,

      linkedSourceType:
        "household_item",

      linkedSourceId:
        row.id,

      isExternal: true,

      canDeleteHere: false,

      bucketId: null,

      storagePath: null,
    }));

  // =======================================================
  // DOCUMENTOS QUE SÃO IMAGENS
  // =======================================================

  const documentItems: GalleryItem[] = (documentsData?.documents ?? [])
    .filter((document) => document.mimeType.startsWith("image/"))
    .map((document) => ({
      id: `document:${document.id}`,

      entityId: document.id,

      apartmentId: document.apartmentId,

      section: "documents",

      title: document.title,

      description: document.description,

      room: null,

      tags: [document.documentType],

      imageUrl: document.signedUrl,

      referenceDate: document.referenceDate,

      createdAt: document.createdAt,

      sourceType: "apartment_document",

      sourceLabel: "Documentos",

      sourceHref: "/documentos",

      sourceId: document.id,

      linkedSourceType:
      "apartment_document",

      linkedSourceId:
        document.id,

      isExternal: false,

      canDeleteHere: false,

      bucketId: document.bucketId,

      storagePath: document.storagePath,
    }));

  // =======================================================
  // UNIFICA
  // =======================================================

  const items = [
    ...genericItems,
    ...constructionItems,
    ...householdItems,
    ...documentItems,
  ];

  items.sort((first, second) =>
    getSortDate(second).localeCompare(getSortDate(first)),
  );

  const rooms = Array.from(
    new Set(
      items
        .map((item) => item.room?.trim())
        .filter((room): room is string => Boolean(room)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  function countSection(section: GallerySection) {
    return items.filter((item) => item.section === section).length;
  }

  return {
    apartmentId: apartment.id,

    apartmentName: apartment.name,

    canEdit,

    items,

    rooms,

    renovationOptions,

    counts: {
      total: items.length,

      construction: countSection("construction"),

      architecture: countSection("architecture"),

      renovation: countSection("renovation"),

      household: countSection("household"),

      documents: countSection("documents"),

      inspiration: countSection("inspiration"),

      other: countSection("other"),
    },
  };
}
