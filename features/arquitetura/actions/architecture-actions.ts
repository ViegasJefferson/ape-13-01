"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  ArchitectureActionResult,
  ArchitectureItemType,
  ArchitecturePriority,
  ArchitectureStatus,
  SaveArchitectureItemInput,
} from "@/features/arquitetura/types";

import {
  createClient,
} from "@/lib/supabase/server";

const itemTypes: ArchitectureItemType[] = [
  "deliverable",
  "version",
  "decision",
  "meeting",
  "task",
];

const statuses: ArchitectureStatus[] = [
  "planned",
  "in_progress",
  "review",
  "approved",
  "completed",
  "cancelled",
];

const priorities: ArchitecturePriority[] = [
  "low",
  "medium",
  "high",
];

export async function saveArchitectureItem(
  input: SaveArchitectureItemInput,
): Promise<ArchitectureActionResult> {
  const title =
    input.title.trim();

  const room =
    input.room?.trim() ||
    null;

  const versionLabel =
    input.versionLabel?.trim() ||
    null;

  const professionalName =
    input.professionalName?.trim() ||
    null;

  const description =
    input.description?.trim() ||
    null;

  const notes =
    input.notes?.trim() ||
    null;

  if (
    !title ||
    title.length > 150
  ) {
    return {
      status: "error",
      message:
        "Informe um título válido.",
    };
  }

  if (
    !itemTypes.includes(
      input.itemType,
    )
  ) {
    return {
      status: "error",
      message:
        "Tipo inválido.",
    };
  }

  if (
    !statuses.includes(
      input.status,
    )
  ) {
    return {
      status: "error",
      message:
        "Status inválido.",
    };
  }

  if (
    !priorities.includes(
      input.priority,
    )
  ) {
    return {
      status: "error",
      message:
        "Prioridade inválida.",
    };
  }

  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (
    claimsError ||
    !userId
  ) {
    return {
      status: "error",
      message:
        "Sua sessão expirou.",
    };
  }

  const isCompleted =
    input.status ===
    "completed";

  const payload = {
    apartment_id:
      input.apartmentId,

    title,

    room,

    item_type:
      input.itemType,

    status:
      input.status,

    priority:
      input.priority,

    version_label:
      versionLabel,

    professional_name:
      professionalName,

    target_date:
      input.targetDate ||
      null,

    completed_at:
      isCompleted
        ? new Date()
            .toISOString()
        : null,

    description,

    notes,
  };

  if (input.id) {
    const { error } =
      await supabase
        .from(
          "architecture_items",
        )
        .update(payload)
        .eq(
          "id",
          input.id,
        )
        .eq(
          "apartment_id",
          input.apartmentId,
        );

    if (error) {
      return {
        status: "error",
        message:
          error.message,
      };
    }
  } else {
    const { error } =
      await supabase
        .from(
          "architecture_items",
        )
        .insert({
          ...payload,
          created_by:
            userId,
        });

    if (error) {
      return {
        status: "error",
        message:
          error.message,
      };
    }
  }

  revalidatePath(
    "/arquitetura",
  );

  revalidatePath(
    "/galeria",
  );

  return {
    status: "success",

    message: input.id
      ? "Registro atualizado."
      : "Registro adicionado à Arquitetura.",
  };
}

export async function deleteArchitectureItem(
  itemId: string,
  apartmentId: string,
): Promise<ArchitectureActionResult> {
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
        "Sua sessão expirou.",
    };
  }

  const { error } =
    await supabase
      .from(
        "architecture_items",
      )
      .delete()
      .eq(
        "id",
        itemId,
      )
      .eq(
        "apartment_id",
        apartmentId,
      );

  if (error) {
    return {
      status: "error",
      message:
        error.message,
    };
  }

  revalidatePath(
    "/arquitetura",
  );

  revalidatePath(
    "/galeria",
  );

  return {
    status: "success",
    message:
      "Registro removido.",
  };
}