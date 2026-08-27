"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  createClient,
} from "@/lib/supabase/server";

interface GalleryActionResult {
  status:
    | "success"
    | "error";

  message: string;
}

interface MediaRow {
  id: string;

  apartment_id: string;

  bucket_id: string;

  storage_path: string;
}

export async function deleteGalleryMedia(
  mediaId: string,
  apartmentId: string,
): Promise<GalleryActionResult> {
  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const {
    data,
    error: mediaError,
  } = await supabase
    .from(
      "apartment_media",
    )
    .select(
      `
        id,
        apartment_id,
        bucket_id,
        storage_path
      `,
    )
    .eq(
      "id",
      mediaId,
    )
    .eq(
      "apartment_id",
      apartmentId,
    )
    .maybeSingle();

  if (mediaError) {
    return {
      status: "error",
      message:
        mediaError.message,
    };
  }

  if (!data) {
    return {
      status: "error",
      message:
        "Imagem não encontrada.",
    };
  }

  const media =
    data as MediaRow;

  const {
    error: storageError,
  } =
    await supabase.storage
      .from(
        media.bucket_id,
      )
      .remove([
        media.storage_path,
      ]);

  if (storageError) {
    return {
      status: "error",
      message:
        `Não foi possível remover o arquivo: ${storageError.message}`,
    };
  }

  const {
    error: deleteError,
  } =
    await supabase
      .from(
        "apartment_media",
      )
      .delete()
      .eq(
        "id",
        media.id,
      )
      .eq(
        "apartment_id",
        apartmentId,
      );

  if (deleteError) {
    return {
      status: "error",
      message:
        deleteError.message,
    };
  }

  revalidatePath(
    "/galeria",
  );

  return {
    status: "success",
    message:
      "Imagem removida da galeria.",
  };
}