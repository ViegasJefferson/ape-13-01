"use server";

import { revalidatePath } from "next/cache";

import type {
  HouseholdActionResult,
  HouseholdItemPriority,
  HouseholdListType,
  SaveHouseholdItemInput,
} from "@/features/enxoval/types";
import { createClient } from "@/lib/supabase/server";

const validListTypes: HouseholdListType[] = [
  "trousseau",
  "housewarming",
];

const validPriorities: HouseholdItemPriority[] = [
  "low",
  "medium",
  "high",
];

function isValidListType(
  value: string,
): value is HouseholdListType {
  return validListTypes.includes(
    value as HouseholdListType,
  );
}

function isValidPriority(
  value: string,
): value is HouseholdItemPriority {
  return validPriorities.includes(
    value as HouseholdItemPriority,
  );
}

export async function saveHouseholdItem(
  input: SaveHouseholdItemInput,
): Promise<HouseholdActionResult> {
  const title = input.title.trim();
  const category = input.category.trim();

  const room =
    input.room?.trim() || null;

  const storeName =
    input.storeName?.trim() || null;

  const productUrl =
    input.productUrl?.trim() || null;

  const notes =
    input.notes?.trim() || null;

  const desiredQuantity = Number(
    input.desiredQuantity,
  );

  const purchasedQuantity = Number(
    input.purchasedQuantity,
  );

  const receivedQuantity = Number(
    input.receivedQuantity,
  );

  const estimatedUnitAmount = Number(
    input.estimatedUnitAmount,
  );

  const actualTotalAmount = Number(
    input.actualTotalAmount,
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
        "Informe um item com até 150 caracteres.",
    };
  }

  if (
    category.length === 0 ||
    category.length > 100
  ) {
    return {
      status: "error",
      message:
        "Informe uma categoria com até 100 caracteres.",
    };
  }

  if (!isValidListType(input.listType)) {
    return {
      status: "error",
      message:
        "O tipo da lista é inválido.",
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
    !Number.isInteger(
      desiredQuantity,
    ) ||
    desiredQuantity <= 0
  ) {
    return {
      status: "error",
      message:
        "A quantidade desejada deve ser maior que zero.",
    };
  }

  if (
    !Number.isInteger(
      purchasedQuantity,
    ) ||
    purchasedQuantity < 0
  ) {
    return {
      status: "error",
      message:
        "A quantidade comprada é inválida.",
    };
  }

  if (
    !Number.isInteger(
      receivedQuantity,
    ) ||
    receivedQuantity < 0
  ) {
    return {
      status: "error",
      message:
        "A quantidade recebida é inválida.",
    };
  }

  if (
    !Number.isFinite(
      estimatedUnitAmount,
    ) ||
    estimatedUnitAmount < 0
  ) {
    return {
      status: "error",
      message:
        "O valor estimado é inválido.",
    };
  }

  if (
    !Number.isFinite(
      actualTotalAmount,
    ) ||
    actualTotalAmount < 0
  ) {
    return {
      status: "error",
      message:
        "O valor efetivamente gasto é inválido.",
    };
  }

  if (
    productUrl &&
    !/^https?:\/\//i.test(productUrl)
  ) {
    return {
      status: "error",
      message:
        "O link do produto deve começar com http:// ou https://.",
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

  const payload = {
    apartment_id: input.apartmentId,

    list_type: input.listType,

    title,
    category,
    room,
    priority: input.priority,

    desired_quantity:
      desiredQuantity,

    purchased_quantity:
      purchasedQuantity,

    received_quantity:
      receivedQuantity,

    estimated_unit_amount:
      estimatedUnitAmount,

    actual_total_amount:
      actualTotalAmount,

    store_name: storeName,
    product_url: productUrl,
    notes,
  };

  if (input.id) {
    const { error } = await supabase
      .from("household_items")
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
      .from("household_items")
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

  revalidatePath("/enxoval");
  revalidatePath("/");

  return {
    status: "success",
    message: input.id
      ? "Item atualizado."
      : "Item adicionado à lista.",
  };
}

export async function deleteHouseholdItem(
  itemId: string,
  apartmentId: string,
): Promise<HouseholdActionResult> {
  if (!itemId || !apartmentId) {
    return {
      status: "error",
      message:
        "O item não foi informado.",
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
    .from("household_items")
    .delete()
    .eq("id", itemId)
    .eq("apartment_id", apartmentId);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/enxoval");
  revalidatePath("/");

  return {
    status: "success",
    message:
      "Item removido da lista.",
  };
}