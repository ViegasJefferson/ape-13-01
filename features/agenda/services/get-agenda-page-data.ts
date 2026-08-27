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

interface ExpenseCategoryRow {
  name: string;
  financial_group: string;
}

interface ExpenseAgendaRow {
  id: string;
  apartment_id: string;

  title: string;
  due_date: string;

  planned_amount:
    | number
    | string
    | null;

  paid_amount:
    | number
    | string;

  paid_at: string | null;

  status: string;

  vendor_name: string | null;

  category:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null;
}

interface FinancingContractAgendaRow {
  id: string;
  bank_name: string;
}

interface FinancingPaymentAgendaRow {
  id: string;
  contract_id: string;

  installment_number: number;
  due_date: string;

  paid_at: string | null;

  regular_payment:
    | number
    | string;

  tr_adjustment:
    | number
    | string;

  mio_amount:
    | number
    | string;

  dfi_amount:
    | number
    | string;

  administrative_fee:
    | number
    | string;

  other_fees:
    | number
    | string;

  total_paid:
    | number
    | string;

  payment_status: string;
}

interface RenovationAgendaRow {
  id: string;
  apartment_id: string;

  title: string;
  area: string | null;

  status: string;
  priority: string;

  target_date: string | null;
  completed_at: string | null;

  vendor_name: string | null;
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

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function getCategory(
  relation:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null,
) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getExpenseEventType(
  financialGroup:
    | string
    | null,
): ReminderEventType {
  switch (financialGroup) {
    case "construction":
      return "construction";

    case "financing":
      return "financing";

    case "documentation":
      return "document";

    case "renovation":
      return "renovation";

    default:
      return "payment";
  }
}

function buildDescription(
  parts: Array<
    string | null | undefined
  >,
) {
  const description = parts
    .filter(
      (
        part,
      ): part is string =>
        Boolean(part),
    )
    .join(" • ");

  return description || null;
}

export async function getAgendaPageData(): Promise<
  AgendaPageData | null
> {
  const supabase =
    await createClient();

  // =======================================================
  // APARTAMENTO
  // =======================================================

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

  // =======================================================
  // USUÁRIO
  // =======================================================

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
      "Não foi possível identificar o usuário atual.",
    );
  }

  // =======================================================
  // FONTES DA AGENDA
  // =======================================================

  const [
    memberResponse,
    remindersResponse,
    expensesResponse,
    contractsResponse,
    renovationResponse,
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

    // Lembretes cadastrados manualmente.
    supabase
      .from(
        "apartment_reminders",
      )
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
      .is(
        "source_type",
        null,
      ),

    // Gastos.
    supabase
      .from("expenses")
      .select(
        `
          id,
          apartment_id,
          title,
          due_date,
          planned_amount,
          paid_amount,
          paid_at,
          status,
          vendor_name,
          category:expense_categories (
            name,
            financial_group
          )
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      ),

    // Contratos de financiamento.
    supabase
      .from(
        "financing_contracts",
      )
      .select(
        `
          id,
          bank_name
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .eq(
        "active",
        true,
      ),

    // Reforma.
    supabase
      .from(
        "renovation_items",
      )
      .select(
        `
          id,
          apartment_id,
          title,
          area,
          status,
          priority,
          target_date,
          completed_at,
          vendor_name
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      ),
  ]);

  if (memberResponse.error) {
    throw new Error(
      `Não foi possível verificar sua permissão: ${memberResponse.error.message}`,
    );
  }

  if (
    remindersResponse.error
  ) {
    throw new Error(
      `Não foi possível carregar os lembretes: ${remindersResponse.error.message}`,
    );
  }

  if (
    expensesResponse.error
  ) {
    throw new Error(
      `Não foi possível carregar os vencimentos dos gastos: ${expensesResponse.error.message}`,
    );
  }

  if (
    contractsResponse.error
  ) {
    throw new Error(
      `Não foi possível carregar o financiamento: ${contractsResponse.error.message}`,
    );
  }

  if (
    renovationResponse.error
  ) {
    throw new Error(
      `Não foi possível carregar os prazos da reforma: ${renovationResponse.error.message}`,
    );
  }

  // =======================================================
  // PERMISSÃO
  // =======================================================

  const member =
    memberResponse.data as
      | MemberRow
      | null;

  const canEdit =
    member?.role === "owner" ||
    member?.role === "editor";

  // =======================================================
  // CONTRATOS E PARCELAS
  // =======================================================

  const contracts = (
    contractsResponse.data ??
    []
  ) as FinancingContractAgendaRow[];

  const contractIds =
    contracts.map(
      (contract) =>
        contract.id,
    );

  const contractById =
    new Map(
      contracts.map(
        (contract) => [
          contract.id,
          contract,
        ],
      ),
    );

  let financingPayments:
    FinancingPaymentAgendaRow[] =
    [];

  if (
    contractIds.length > 0
  ) {
    const {
      data:
        financingPaymentsData,
      error:
        financingPaymentsError,
    } = await supabase
      .from(
        "financing_payments",
      )
      .select(
        `
          id,
          contract_id,
          installment_number,
          due_date,
          paid_at,
          regular_payment,
          tr_adjustment,
          mio_amount,
          dfi_amount,
          administrative_fee,
          other_fees,
          total_paid,
          payment_status
        `,
      )
      .in(
        "contract_id",
        contractIds,
      );

    if (
      financingPaymentsError
    ) {
      throw new Error(
        `Não foi possível carregar as parcelas do financiamento: ${financingPaymentsError.message}`,
      );
    }

    financingPayments =
      (
        financingPaymentsData ??
        []
      ) as FinancingPaymentAgendaRow[];
  }

  // =======================================================
  // HOJE
  // =======================================================

  const todayString =
    toDateString(
      new Date(),
    );

  // =======================================================
  // LEMBRETES MANUAIS
  // =======================================================

  const manualReminders: ApartmentReminder[] =
    (
      (
        remindersResponse.data ??
        []
      ) as ReminderRow[]
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

        title:
          row.title,

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

        sourceHref:
          null,

        createdAt:
          row.created_at,

        updatedAt:
          row.updated_at,
      };
    });

  // =======================================================
  // GASTOS AUTOMÁTICOS
  // =======================================================

  const expenseReminders: ApartmentReminder[] =
    (
      (
        expensesResponse.data ??
        []
      ) as ExpenseAgendaRow[]
    )
      .filter(
        (expense) =>
          expense.status !==
          "cancelled",
      )
      .map((expense) => {
        const category =
          getCategory(
            expense.category,
          );

        const isCompleted =
          expense.status ===
          "paid";

        const plannedAmount =
          expense.planned_amount ===
          null
            ? null
            : Number(
                expense.planned_amount,
              );

        const paidAmount =
          Number(
            expense.paid_amount,
          );

        const priority:
          ReminderPriority =
          !isCompleted &&
          (
            expense.status ===
              "overdue" ||
            expense.due_date <
              todayString
          )
            ? "high"
            : "medium";

        const amountDescription =
          isCompleted &&
          paidAmount > 0
            ? `Pago: ${formatCurrency(
                paidAmount,
              )}`
            : plannedAmount !==
                null
              ? `Previsto: ${formatCurrency(
                  plannedAmount,
                )}`
              : null;

        return {
          id:
            `expense:${expense.id}`,

          apartmentId:
            expense.apartment_id,

          title:
            expense.title,

          description:
            buildDescription([
              category?.name
                ? `Categoria: ${category.name}`
                : null,

              amountDescription,

              expense.vendor_name
                ? `Fornecedor: ${expense.vendor_name}`
                : null,
            ]),

          eventType:
            getExpenseEventType(
              category?.financial_group ??
                null,
            ),

          priority,

          eventDate:
            expense.due_date,

          eventTime:
            null,

          isCompleted,

          completedAt:
            expense.paid_at,

          sourceType:
            "expense",

          sourceId:
            expense.id,

          sourceHref:
            "/gastos",

          createdAt:
            expense.due_date,

          updatedAt:
            expense.due_date,
        };
      });

  // =======================================================
  // FINANCIAMENTO AUTOMÁTICO
  // =======================================================

  const financingReminders: ApartmentReminder[] =
    financingPayments
      .filter(
        (payment) =>
          payment.payment_status !==
          "cancelled",
      )
      .map((payment) => {
        const contract =
          contractById.get(
            payment.contract_id,
          );

        const isCompleted =
          payment.payment_status ===
          "paid";

        const expectedAmount =
          Number(
            payment.regular_payment,
          ) +
          Number(
            payment.tr_adjustment,
          ) +
          Number(
            payment.mio_amount,
          ) +
          Number(
            payment.dfi_amount,
          ) +
          Number(
            payment.administrative_fee,
          ) +
          Number(
            payment.other_fees,
          );

        const totalPaid =
          Number(
            payment.total_paid,
          );

        const priority:
          ReminderPriority =
          !isCompleted &&
          (
            payment.payment_status ===
              "overdue" ||
            payment.due_date <
              todayString
          )
            ? "high"
            : "medium";

        return {
          id:
            `financing:${payment.id}`,

          apartmentId:
            apartment.id,

          title:
            `Parcela ${payment.installment_number} do financiamento`,

          description:
            buildDescription([
              contract?.bank_name
                ? `Banco: ${contract.bank_name}`
                : null,

              isCompleted &&
              totalPaid > 0
                ? `Pago: ${formatCurrency(
                    totalPaid,
                  )}`
                : expectedAmount >
                    0
                  ? `Previsto: ${formatCurrency(
                      expectedAmount,
                    )}`
                  : null,
            ]),

          eventType:
            "financing",

          priority,

          eventDate:
            payment.due_date,

          eventTime:
            null,

          isCompleted,

          completedAt:
            payment.paid_at,

          sourceType:
            "financing_payment",

          sourceId:
            payment.id,

          sourceHref:
            "/financiamento",

          createdAt:
            payment.due_date,

          updatedAt:
            payment.due_date,
        };
      });

  // =======================================================
  // REFORMA AUTOMÁTICA
  // =======================================================

  const renovationReminders: ApartmentReminder[] =
    (
      (
        renovationResponse.data ??
        []
      ) as RenovationAgendaRow[]
    )
      .filter(
        (item) =>
          Boolean(
            item.target_date,
          ) &&
          item.status !==
            "cancelled",
      )
      .map((item) => {
        const isCompleted =
          item.status ===
          "completed";

        const priority:
          ReminderPriority =
          isPriority(
            item.priority,
          )
            ? item.priority
            : "medium";

        return {
          id:
            `renovation:${item.id}`,

          apartmentId:
            item.apartment_id,

          title:
            `Reforma: ${item.title}`,

          description:
            buildDescription([
              item.area
                ? `Ambiente: ${item.area}`
                : null,

              item.vendor_name
                ? `Fornecedor: ${item.vendor_name}`
                : null,
            ]),

          eventType:
            "renovation",

          priority,

          eventDate:
            item.target_date as string,

          eventTime:
            null,

          isCompleted,

          completedAt:
            item.completed_at,

          sourceType:
            "renovation_item",

          sourceId:
            item.id,

          sourceHref:
            "/reforma",

          createdAt:
            item.target_date as string,

          updatedAt:
            item.target_date as string,
        };
      });

  // =======================================================
  // AGENDA UNIFICADA
  // =======================================================

  const reminders = [
    ...manualReminders,
    ...expenseReminders,
    ...financingReminders,
    ...renovationReminders,
  ];

  reminders.sort(
    (first, second) => {
      if (
        first.isCompleted !==
        second.isCompleted
      ) {
        return first.isCompleted
          ? 1
          : -1;
      }

      const dateComparison =
        first.eventDate.localeCompare(
          second.eventDate,
        );

      if (
        dateComparison !== 0
      ) {
        return dateComparison;
      }

      const firstTime =
        first.eventTime ??
        "99:99";

      const secondTime =
        second.eventTime ??
        "99:99";

      return firstTime.localeCompare(
        secondTime,
      );
    },
  );

  // =======================================================
  // INDICADORES
  // =======================================================

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

  const sevenDays =
    new Date();

  sevenDays.setDate(
    sevenDays.getDate() + 7,
  );

  const sevenDaysString =
    toDateString(
      sevenDays,
    );

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