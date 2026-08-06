import type {
  RenovationItem,
  RenovationItemPriority,
  RenovationItemStatus,
  RenovationPageData,
} from "@/features/reforma/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberRow {
  role: string;
}

interface RenovationItemRow {
  id: string;
  apartment_id: string;

  title: string;
  area: string | null;

  status: string;
  priority: string;

  planned_amount: number | string;
  actual_amount: number | string;

  vendor_name: string | null;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

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

function isRenovationStatus(
  value: string,
): value is RenovationItemStatus {
  return validStatuses.includes(
    value as RenovationItemStatus,
  );
}

function isRenovationPriority(
  value: string,
): value is RenovationItemPriority {
  return validPriorities.includes(
    value as RenovationItemPriority,
  );
}

function roundCurrency(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

export async function getRenovationPageData(): Promise<
  RenovationPageData | null
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

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    throw new Error(
      "Não foi possível identificar o usuário atual.",
    );
  }

  const userId =
    claimsData.claims.sub;

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
      .from("renovation_items")
      .select(
        `
          id,
          apartment_id,
          title,
          area,
          status,
          priority,
          planned_amount,
          actual_amount,
          vendor_name,
          target_date,
          completed_at,
          notes,
          created_at,
          updated_at
        `,
      )
      .eq("apartment_id", apartment.id)
      .order("target_date", {
        ascending: true,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (itemsResponse.error) {
    throw new Error(
      `Não foi possível carregar o planejamento da reforma: ${itemsResponse.error.message}`,
    );
  }

  const member =
    memberResponse.data as MemberRow | null;

  const canEdit =
    member?.role === "owner" ||
    member?.role === "editor";

  const items: RenovationItem[] = (
    (itemsResponse.data ??
      []) as RenovationItemRow[]
  ).map((row) => {
    if (!isRenovationStatus(row.status)) {
      throw new Error(
        `Situação inválida encontrada: ${row.status}.`,
      );
    }

    if (!isRenovationPriority(row.priority)) {
      throw new Error(
        `Prioridade inválida encontrada: ${row.priority}.`,
      );
    }

    return {
      id: row.id,
      apartmentId: row.apartment_id,

      title: row.title,
      area: row.area,

      status: row.status,
      priority: row.priority,

      plannedAmount: Number(
        row.planned_amount,
      ),

      actualAmount: Number(
        row.actual_amount,
      ),

      vendorName: row.vendor_name,
      targetDate: row.target_date,
      completedAt: row.completed_at,
      notes: row.notes,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  const activeItems = items.filter(
    (item) => item.status !== "cancelled",
  );

  const completedItems =
    activeItems.filter(
      (item) => item.status === "completed",
    ).length;

  const plannedBudget =
    activeItems.reduce(
      (total, item) =>
        total + item.plannedAmount,
      0,
    );

  const actualAmount =
    activeItems.reduce(
      (total, item) =>
        total + item.actualAmount,
      0,
    );

  const progressPercentage =
    activeItems.length === 0
      ? 0
      : (completedItems /
          activeItems.length) *
        100;

  return {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    canEdit,

    items,

    totalItems: activeItems.length,
    completedItems,

    plannedBudget:
      roundCurrency(plannedBudget),

    actualAmount:
      roundCurrency(actualAmount),

    budgetBalance:
      roundCurrency(
        plannedBudget - actualAmount,
      ),

    progressPercentage,
  };
}