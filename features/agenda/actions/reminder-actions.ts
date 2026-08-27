"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  ReminderActionResult,
  ReminderEventType,
  ReminderPriority,
  SaveReminderInput,
} from "@/features/agenda/types";

import { createClient } from "@/lib/supabase/server";

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

function isValidEventType(
  value: string,
): value is ReminderEventType {
  return validEventTypes.includes(
    value as ReminderEventType,
  );
}

function isValidPriority(
  value: string,
): value is ReminderPriority {
  return validPriorities.includes(
    value as ReminderPriority,
  );
}

export async function saveReminder(
  input: SaveReminderInput,
): Promise<ReminderActionResult> {
  const title =
    input.title.trim();

  const description =
    input.description?.trim() ||
    null;

  const eventTime =
    input.eventTime?.trim() ||
    null;

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

  if (!input.eventDate) {
    return {
      status: "error",
      message:
        "Informe a data do lembrete.",
    };
  }

  if (
    !isValidEventType(
      input.eventType,
    )
  ) {
    return {
      status: "error",
      message:
        "O tipo de evento é inválido.",
    };
  }

  if (
    !isValidPriority(
      input.priority,
    )
  ) {
    return {
      status: "error",
      message:
        "A prioridade é inválida.",
    };
  }

  const supabase =
    await createClient();

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
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const payload = {
    apartment_id:
      input.apartmentId,

    title,

    description,

    event_type:
      input.eventType,

    priority:
      input.priority,

    event_date:
      input.eventDate,

    event_time:
      eventTime,
  };

  if (input.id) {
    const { error } =
      await supabase
        .from(
          "apartment_reminders",
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
          "apartment_reminders",
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
    "/agenda",
  );

  revalidatePath("/");

  return {
    status: "success",

    message: input.id
      ? "Lembrete atualizado."
      : "Lembrete adicionado à agenda.",
  };
}

export async function toggleReminderCompleted(
  reminderId: string,
  apartmentId: string,
  completed: boolean,
): Promise<ReminderActionResult> {
  const supabase =
    await createClient();

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

  const { error } =
    await supabase
      .from(
        "apartment_reminders",
      )
      .update({
        is_completed:
          completed,

        completed_at:
          completed
            ? new Date()
                .toISOString()
            : null,
      })
      .eq(
        "id",
        reminderId,
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
    "/agenda",
  );

  return {
    status: "success",

    message: completed
      ? "Evento concluído."
      : "Evento reaberto.",
  };
}

export async function deleteReminder(
  reminderId: string,
  apartmentId: string,
): Promise<ReminderActionResult> {
  const supabase =
    await createClient();

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

  const { error } =
    await supabase
      .from(
        "apartment_reminders",
      )
      .delete()
      .eq(
        "id",
        reminderId,
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
    "/agenda",
  );

  return {
    status: "success",
    message:
      "Lembrete removido.",
  };
}