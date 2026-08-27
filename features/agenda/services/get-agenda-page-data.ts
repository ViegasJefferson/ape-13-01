import type {
  AgendaPageData,
  ApartmentReminder,
  ReminderEventType,
  ReminderPriority,
} from "@/features/agenda/types";

import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberRow {
  role: string;
}

interface ReminderRow {
  id: string;

  apartment_id: string;

  title: string;
  description: string | null;

  event_type: string;
  priority: string;

  event_date: string;
  event_time: string | null;

  is_completed: boolean;
  completed_at: string | null;

  source_type: string | null;
  source_id: string | null;

  created_at: string;
  updated_at: string;
}

const validEventTypes: ReminderEventType[] = [
  "reminder",
  "payment",
  "financing",
  "construction",
  "renovation",
  "document",
  "appointment",
  "other",
];

const validPriorities: ReminderPriority[] = [
  "low",
  "medium",
  "high",
];

function isEventType(
  value: string,
): value is ReminderEventType {
  return validEventTypes.includes(
    value as ReminderEventType,
  );
}

function isPriority(
  value: string,
): value is ReminderPriority {
  return validPriorities.includes(
    value as ReminderPriority,
  );
}

function toDateString(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getAgendaPageData(): Promise<
  AgendaPageData | null
> {
  const supabase =
    await createClient();

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

  if (
    claimsError ||
    !userId
  ) {
    throw new Error(
      "Não foi possível identificar o usuário atual.",
    );
  }

  const [
    memberResponse,
    remindersResponse,
  ] = await Promise.all([
    supabase
      .from("apartment_members")
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
      .from("apartment_reminders")
      .select(
        `
          id,
          apartment_id,
          title,
          description,
          event_type,
          priority,
          event_date,
          event_time,
          is_completed,
          completed_at,
          source_type,
          source_id,
          created_at,
          updated_at
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .order(
        "is_completed",
        {
          ascending: true,
        },
      )
      .order(
        "event_date",
        {
          ascending: true,
        },
      )
      .order(
        "event_time",
        {
          ascending: true,
          nullsFirst: false,
        },
      ),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (remindersResponse.error) {
    throw new Error(
      `Não foi possível carregar a agenda: ${remindersResponse.error.message}`,
    );
  }

  const member =
    memberResponse.data as
      | MemberRow
      | null;

  const canEdit =
    member?.role === "owner" ||
    member?.role === "editor";

  const reminders: ApartmentReminder[] =
    (
      (remindersResponse.data ??
        []) as ReminderRow[]
    ).map((row) => {
      if (
        !isEventType(
          row.event_type,
        )
      ) {
        throw new Error(
          `Tipo de evento inválido: ${row.event_type}.`,
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
        id: row.id,

        apartmentId:
          row.apartment_id,

        title: row.title,

        description:
          row.description,

        eventType:
          row.event_type,

        priority:
          row.priority,

        eventDate:
          row.event_date,

        eventTime:
          row.event_time,

        isCompleted:
          row.is_completed,

        completedAt:
          row.completed_at,

        sourceType:
          row.source_type,

        sourceId:
          row.source_id,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      };
    });

  const today =
    new Date();

  const todayString =
    toDateString(today);

  const sevenDays =
    new Date(today);

  sevenDays.setDate(
    sevenDays.getDate() + 7,
  );

  const sevenDaysString =
    toDateString(sevenDays);

  const activeReminders =
    reminders.filter(
      (reminder) =>
        !reminder.isCompleted,
    );

  const overdueCount =
    activeReminders.filter(
      (reminder) =>
        reminder.eventDate <
        todayString,
    ).length;

  const todayCount =
    activeReminders.filter(
      (reminder) =>
        reminder.eventDate ===
        todayString,
    ).length;

  const nextSevenDaysCount =
    activeReminders.filter(
      (reminder) =>
        reminder.eventDate >
          todayString &&
        reminder.eventDate <=
          sevenDaysString,
    ).length;

  const completedCount =
    reminders.filter(
      (reminder) =>
        reminder.isCompleted,
    ).length;

  return {
    apartmentId:
      apartment.id,

    apartmentName:
      apartment.name,

    canEdit,

    reminders,

    overdueCount,
    todayCount,
    nextSevenDaysCount,
    completedCount,
  };
}