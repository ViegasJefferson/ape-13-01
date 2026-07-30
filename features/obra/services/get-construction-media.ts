import type { ConstructionMedia } from "@/features/obra/types";
import { createClient } from "@/lib/supabase/server";

const CONSTRUCTION_MEDIA_BUCKET =
  "construction-media";

interface StageRelationRow {
  id: string;
  name: string;
}

interface ConstructionMediaRow {
  id: string;
  apartment_id: string;
  stage_id: string | null;
  reference_month: string;
  media_type: "image" | "video";
  bucket_id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number | string;
  title: string | null;
  description: string | null;
  source_name: string | null;
  captured_at: string | null;
  created_at: string;

  stage:
    | StageRelationRow
    | StageRelationRow[]
    | null;
}

function getStage(
  relation:
    | StageRelationRow
    | StageRelationRow[]
    | null,
) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

export async function getConstructionMedia(
  apartmentId: string,
): Promise<ConstructionMedia[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("construction_media")
    .select(
      `
        id,
        apartment_id,
        stage_id,
        reference_month,
        media_type,
        bucket_id,
        storage_path,
        original_file_name,
        mime_type,
        size_bytes,
        title,
        description,
        source_name,
        captured_at,
        created_at,
        stage:construction_stages (
          id,
          name
        )
      `,
    )
    .eq("apartment_id", apartmentId)
    .order("reference_month", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar a galeria: ${error.message}`,
    );
  }

  const rows =
    (data ?? []) as ConstructionMediaRow[];

  if (rows.length === 0) {
    return [];
  }

  const paths = rows.map(
    (media) => media.storage_path,
  );

  const {
    data: signedFiles,
    error: signedUrlError,
  } = await supabase.storage
    .from(CONSTRUCTION_MEDIA_BUCKET)
    .createSignedUrls(paths, 3600);

  if (signedUrlError) {
    throw new Error(
      `Não foi possível gerar os links das imagens: ${signedUrlError.message}`,
    );
  }

  const signedUrlByPath = new Map(
    (signedFiles ?? []).map((file) => [
      file.path,
      file.signedUrl,
    ]),
  );

  return rows
    .map((row) => {
      const stage = getStage(row.stage);

      return {
        id: row.id,
        apartmentId: row.apartment_id,
        stageId: row.stage_id,
        stageName: stage?.name ?? null,
        referenceMonth: row.reference_month,
        mediaType: row.media_type,
        bucketId: row.bucket_id,
        storagePath: row.storage_path,
        originalFileName:
          row.original_file_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.size_bytes),
        title: row.title,
        description: row.description,
        sourceName: row.source_name,
        capturedAt: row.captured_at,
        createdAt: row.created_at,
        signedUrl:
          signedUrlByPath.get(
            row.storage_path,
          ) ?? "",
      } satisfies ConstructionMedia;
    })
    .filter((media) => media.signedUrl);
}