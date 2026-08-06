"use server";

import { revalidatePath } from "next/cache";

import type {
  RenovationActionResult,
  RenovationItemPriority,
  RenovationItemStatus,
  SaveRenovationItemInput,
} from "@/features/reforma/types";
import { createClient } from "@/lib/supabase/server";

const validStatuses: RenovationItemStatus[] = [
  "planned",
  "quoting",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
];

const validPriorities: RenovationItemPriority[] = [
  "low",
  "medium",
  "high",
];

function isValidStatus(
  value: string,
): value is RenovationItemStatus {
  return validStatuses.includes(
    value as RenovationItemStatus,
  );
}

function isValidPriority(
  value: string,
): value is RenovationItemPriority {
  return validPriorities.includes(
    value as RenovationItemPriority,
  );
}

export async function saveRenovationItem(
  input: SaveRenovationItemInput,
): Promise<RenovationActionResult> {
  const title = input.title.trim();
  const area = input.area?.trim() || null;
  const vendorName =
    input.vendorName?.trim() || null;
  const notes =
    input.notes?.trim() || null;

  const plannedAmount = Number(
    input.plannedAmount,
  );

  const actualAmount = Number(
    input.actualAmount,
  );

  if (!input.apartmentId) {
    return {
      status: "error",
      message:
        "O apartamento não foi informado.",
    };
  }

  if (
    title.length === 0 ||
    title.length > 150
  ) {
    return {
      status: "error",
      message:
        "Informe um título com até 150 caracteres.",
    };
  }

  if (!isValidStatus(input.status)) {
    return {
      status: "error",
      message:
        "A situação informada é inválida.",
    };
  }

  if (!isValidPriority(input.priority)) {
    return {
      status: "error",
      message:
        "A prioridade informada é inválida.",
    };
  }

  if (
    !Number.isFinite(plannedAmount) ||
    plannedAmount < 0
  ) {
    return {
      status: "error",
      message:
        "O orçamento previsto é inválido.",
    };
  }

  if (
    !Number.isFinite(actualAmount) ||
    actualAmount < 0
  ) {
    return {
      status: "error",
      message:
        "O valor realizado é inválido.",
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const completedAt =
    input.status === "completed"
      ? new Date()
          .toISOString()
          .slice(0, 10)
      : null;

  const payload = {
    apartment_id: input.apartmentId,
    title,
    area,

    status: input.status,
    priority: input.priority,

    planned_amount: plannedAmount,
    actual_amount: actualAmount,

    vendor_name: vendorName,
    target_date:
      input.targetDate || null,
    completed_at: completedAt,
    notes,
  };

  if (input.id) {
    const { error } = await supabase
      .from("renovation_items")
      .update(payload)
      .eq("id", input.id)
      .eq(
        "apartment_id",
        input.apartmentId,
      );

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  } else {
    const { error } = await supabase
      .from("renovation_items")
      .insert({
        ...payload,
        created_by: userId,
      });

    if (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  revalidatePath("/reforma");
  revalidatePath("/");

  return {
    status: "success",
    message: input.id
      ? "Item da reforma atualizado."
      : "Item adicionado ao planejamento.",
  };
}

export async function deleteRenovationItem(
  itemId: string,
  apartmentId: string,
): Promise<RenovationActionResult> {
  if (!itemId || !apartmentId) {
    return {
      status: "error",
      message:
        "O item da reforma não foi informado.",
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

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

  const { error } = await supabase
    .from("renovation_items")
    .delete()
    .eq("id", itemId)
    .eq("apartment_id", apartmentId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/reforma");
  revalidatePath("/");

  return {
    status: "success",
    message:
      "Item removido do planejamento.",
  };
}