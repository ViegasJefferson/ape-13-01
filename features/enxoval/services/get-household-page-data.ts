import type {
  HouseholdItem,
  HouseholdItemPriority,
  HouseholdListType,
  HouseholdPageData,
} from "@/features/enxoval/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberRow {
  role: string;
}

interface HouseholdItemRow {
  id: string;
  apartment_id: string;

  list_type: string;

  title: string;
  category: string;
  room: string | null;
  priority: string;

  desired_quantity: number | string;
  purchased_quantity: number | string;
  received_quantity: number | string;

  estimated_unit_amount: number | string;
  actual_total_amount: number | string;

  store_name: string | null;
  product_url: string | null;
  product_image_url: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

const validListTypes: HouseholdListType[] = [
  "trousseau",
  "housewarming",
];

const validPriorities: HouseholdItemPriority[] = [
  "low",
  "medium",
  "high",
];

function isListType(
  value: string,
): value is HouseholdListType {
  return validListTypes.includes(
    value as HouseholdListType,
  );
}

function isPriority(
  value: string,
): value is HouseholdItemPriority {
  return validPriorities.includes(
    value as HouseholdItemPriority,
  );
}

function roundCurrency(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

export async function getHouseholdPageData(): Promise<
  HouseholdPageData | null
> {
  const supabase = await createClient();

  const {
    data: apartmentData,
    error: apartmentError,
  } = await supabase
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

  const apartment =
    apartmentData as ApartmentRow;

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    throw new Error(
      "Não foi possível identificar o usuário atual.",
    );
  }

  const [
    memberResponse,
    itemsResponse,
  ] = await Promise.all([
    supabase
      .from("apartment_members")
      .select("role")
      .eq("apartment_id", apartment.id)
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("household_items")
      .select(
        `
          id,
          apartment_id,
          list_type,
          title,
          category,
          room,
          priority,
          desired_quantity,
          purchased_quantity,
          received_quantity,
          estimated_unit_amount,
          actual_total_amount,
          store_name,
          product_url,
          product_image_url,
          notes,
          created_at,
          updated_at
        `,
      )
      .eq("apartment_id", apartment.id)
      .order("priority", {
        ascending: false,
      })
      .order("category", {
        ascending: true,
      })
      .order("title", {
        ascending: true,
      }),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (itemsResponse.error) {
    throw new Error(
      `Não foi possível carregar o enxoval: ${itemsResponse.error.message}`,
    );
  }

  const member =
    memberResponse.data as MemberRow | null;

  const canEdit =
    member?.role === "owner" ||
    member?.role === "editor";

  const items: HouseholdItem[] = (
    (itemsResponse.data ??
      []) as HouseholdItemRow[]
  ).map((row) => {
    if (!isListType(row.list_type)) {
      throw new Error(
        `Tipo de lista inválido: ${row.list_type}.`,
      );
    }

    if (!isPriority(row.priority)) {
      throw new Error(
        `Prioridade inválida: ${row.priority}.`,
      );
    }

    return {
      id: row.id,
      apartmentId: row.apartment_id,

      listType: row.list_type,

      title: row.title,
      category: row.category,
      room: row.room,
      priority: row.priority,

      desiredQuantity: Number(
        row.desired_quantity,
      ),

      purchasedQuantity: Number(
        row.purchased_quantity,
      ),

      receivedQuantity: Number(
        row.received_quantity,
      ),

      estimatedUnitAmount: Number(
        row.estimated_unit_amount,
      ),

      actualTotalAmount: Number(
        row.actual_total_amount,
      ),

      storeName: row.store_name,
      productUrl: row.product_url,
      productImageUrl: row.product_image_url,
      notes: row.notes,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  let desiredUnits = 0;
  let fulfilledUnits = 0;

  let estimatedBudget = 0;
  let actualSpent = 0;
  let estimatedGiftValue = 0;
  let estimatedPendingCost = 0;

  let completedItems = 0;

  for (const item of items) {
    const acquiredQuantity =
      item.purchasedQuantity +
      item.receivedQuantity;

    const fulfilledQuantity = Math.min(
      item.desiredQuantity,
      acquiredQuantity,
    );

    const pendingQuantity = Math.max(
      item.desiredQuantity -
        acquiredQuantity,
      0,
    );

    desiredUnits += item.desiredQuantity;
    fulfilledUnits += fulfilledQuantity;

    estimatedBudget +=
      item.desiredQuantity *
      item.estimatedUnitAmount;

    actualSpent +=
      item.actualTotalAmount;

    estimatedGiftValue +=
      item.receivedQuantity *
      item.estimatedUnitAmount;

    estimatedPendingCost +=
      pendingQuantity *
      item.estimatedUnitAmount;

    if (
      acquiredQuantity >=
      item.desiredQuantity
    ) {
      completedItems += 1;
    }
  }

  const categories = Array.from(
    new Set(
      items
        .map((item) => item.category.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  const progressPercentage =
    desiredUnits === 0
      ? 0
      : Math.min(
          (fulfilledUnits / desiredUnits) *
            100,
          100,
        );

  return {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    canEdit,

    items,
    categories,

    totalItems: items.length,
    completedItems,

    desiredUnits,
    fulfilledUnits,

    estimatedBudget:
      roundCurrency(estimatedBudget),

    actualSpent:
      roundCurrency(actualSpent),

    estimatedGiftValue:
      roundCurrency(
        estimatedGiftValue,
      ),

    estimatedPendingCost:
      roundCurrency(
        estimatedPendingCost,
      ),

    progressPercentage,
  };
}