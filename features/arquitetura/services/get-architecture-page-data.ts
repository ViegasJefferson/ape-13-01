import type {
  ArchitectureItem,
  ArchitectureItemType,
  ArchitecturePageData,
  ArchitecturePriority,
  ArchitectureStatus,
} from "@/features/arquitetura/types";

import {
  createClient,
} from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberRow {
  role: string;
}

interface ArchitectureRow {
  id: string;

  apartment_id: string;

  title: string;
  room: string | null;

  item_type: string;
  status: string;
  priority: string;

  version_label: string | null;

  professional_name: string | null;

  target_date: string | null;
  completed_at: string | null;

  description: string | null;
  notes: string | null;

  created_at: string;
  updated_at: string;
}

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

function isItemType(
  value: string,
): value is ArchitectureItemType {
  return itemTypes.includes(
    value as ArchitectureItemType,
  );
}

function isStatus(
  value: string,
): value is ArchitectureStatus {
  return statuses.includes(
    value as ArchitectureStatus,
  );
}

function isPriority(
  value: string,
): value is ArchitecturePriority {
  return priorities.includes(
    value as ArchitecturePriority,
  );
}

function getTodayString() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getArchitecturePageData(): Promise<
  ArchitecturePageData | null
> {
  const supabase =
    await createClient();

  const {
    data: apartmentData,
    error: apartmentError,
  } = await supabase
    .from("apartments")
    .select("id, name")
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
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
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (
    claimsError ||
    !userId
  ) {
    throw new Error(
      "Não foi possível identificar o usuário.",
    );
  }

  const [
    memberResponse,
    itemsResponse,
  ] = await Promise.all([
    supabase
      .from(
        "apartment_members",
      )
      .select("role")
      .eq(
        "apartment_id",
        apartment.id,
      )
      .eq(
        "user_id",
        userId,
      )
      .maybeSingle(),

    supabase
      .from(
        "architecture_items",
      )
      .select(
        `
          id,
          apartment_id,
          title,
          room,
          item_type,
          status,
          priority,
          version_label,
          professional_name,
          target_date,
          completed_at,
          description,
          notes,
          created_at,
          updated_at
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .order(
        "target_date",
        {
          ascending: true,
          nullsFirst: false,
        },
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      ),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (itemsResponse.error) {
    throw new Error(
      `Não foi possível carregar Arquitetura: ${itemsResponse.error.message}`,
    );
  }

  const member =
    memberResponse.data as
      | MemberRow
      | null;

  const canEdit =
    member?.role === "owner" ||
    member?.role === "editor";

  const items: ArchitectureItem[] =
    (
      (
        itemsResponse.data ??
        []
      ) as ArchitectureRow[]
    ).map((row) => {
      if (
        !isItemType(
          row.item_type,
        )
      ) {
        throw new Error(
          `Tipo de arquitetura inválido: ${row.item_type}.`,
        );
      }

      if (
        !isStatus(
          row.status,
        )
      ) {
        throw new Error(
          `Status de arquitetura inválido: ${row.status}.`,
        );
      }

      if (
        !isPriority(
          row.priority,
        )
      ) {
        throw new Error(
          `Prioridade inválida: ${row.priority}.`,
        );
      }

      return {
        id:
          row.id,

        apartmentId:
          row.apartment_id,

        title:
          row.title,

        room:
          row.room,

        itemType:
          row.item_type,

        status:
          row.status,

        priority:
          row.priority,

        versionLabel:
          row.version_label,

        professionalName:
          row.professional_name,

        targetDate:
          row.target_date,

        completedAt:
          row.completed_at,

        description:
          row.description,

        notes:
          row.notes,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      };
    });

  const rooms =
    Array.from(
      new Set(
        items
          .map(
            (item) =>
              item.room?.trim(),
          )
          .filter(
            (
              room,
            ): room is string =>
              Boolean(room),
          ),
      ),
    ).sort((a, b) =>
      a.localeCompare(
        b,
        "pt-BR",
      ),
    );

  const today =
    getTodayString();

  const activeItems =
    items.filter(
      (item) =>
        item.status !==
          "completed" &&
        item.status !==
          "cancelled",
    );

  return {
    apartmentId:
      apartment.id,

    apartmentName:
      apartment.name,

    canEdit,

    items,

    rooms,

    totalItems:
      items.length,

    pendingItems:
      activeItems.length,

    reviewItems:
      items.filter(
        (item) =>
          item.status ===
          "review",
      ).length,

    approvedItems:
      items.filter(
        (item) =>
          item.status ===
            "approved" ||
          item.status ===
            "completed",
      ).length,

    overdueItems:
      activeItems.filter(
        (item) =>
          Boolean(
            item.targetDate,
          ) &&
          (
            item.targetDate as string
          ) < today,
      ).length,
  };
}