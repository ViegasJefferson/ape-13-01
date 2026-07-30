import type {
  DashboardConstruction,
  DashboardFinancing,
  DashboardLatestMedia,
  DashboardNextExpense,
  HomeDashboardData,
} from "@/features/dashboard/types";
import { createClient } from "@/lib/supabase/server";

const CONSTRUCTION_MEDIA_BUCKET =
  "construction-media";

interface ApartmentRow {
  id: string;
  name: string;
  project_name: string | null;
  block: string | null;
  unit: string | null;
  delivery_date: string | null;
}

interface FinancingRow {
  bank_name: string;
  financed_amount: number | string;
  base_payment: number | string;
  contractual_term_months: number;
  start_date: string | null;
}

interface ExpenseCategoryRow {
  slug: string;
}

interface ExpenseRow {
  id: string;
  title: string;
  due_date: string;
  planned_amount: number | string | null;
  paid_amount: number | string;
  status: string;

  category:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null;
}

interface AmortizationRow {
  amount: number | string;
  amortization_date: string;
}

interface ConstructionRow {
  overall_progress: number | string;
  reference_month: string;
  status: string;
}

interface StageRow {
  name: string;
}

interface MediaRow {
  id: string;
  title: string | null;
  reference_month: string;
  storage_path: string;

  stage:
    | StageRow
    | StageRow[]
    | null;
}

function getSingleRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function mapConstruction(
  row: ConstructionRow | null,
): DashboardConstruction | null {
  if (!row) {
    return null;
  }

  const validStatuses = [
    "not_started",
    "in_progress",
    "paused",
    "completed",
  ] as const;

  if (
    !validStatuses.includes(
      row.status as (typeof validStatuses)[number],
    )
  ) {
    throw new Error(
      `Status de obra inválido: ${row.status}.`,
    );
  }

  return {
    overallProgress: Number(
      row.overall_progress,
    ),

    referenceMonth: row.reference_month,

    status:
      row.status as DashboardConstruction["status"],
  };
}

function mapFinancing(
  row: FinancingRow | null,
): DashboardFinancing | null {
  if (!row) {
    return null;
  }

  return {
    bankName: row.bank_name,
    financedAmount: Number(
      row.financed_amount,
    ),
    basePayment: Number(row.base_payment),
    contractualTermMonths: Number(
      row.contractual_term_months,
    ),
    startDate: row.start_date,
  };
}

function getCategorySlug(
  relation:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null,
) {
  return (
    getSingleRelation(relation)?.slug ??
    null
  );
}

export async function getHomeDashboardData(): Promise<
  HomeDashboardData | null
> {
  const supabase = await createClient();

  const {
    data: apartmentData,
    error: apartmentError,
  } = await supabase
    .from("apartments")
    .select(
      `
        id,
        name,
        project_name,
        block,
        unit,
        delivery_date
      `,
    )
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

  const [
    financingResponse,
    expensesResponse,
    amortizationsResponse,
    constructionResponse,
    mediaResponse,
  ] = await Promise.all([
    supabase
      .from("financing_contracts")
      .select(
        `
          bank_name,
          financed_amount,
          base_payment,
          contractual_term_months,
          start_date
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("expenses")
      .select(
        `
          id,
          title,
          due_date,
          planned_amount,
          paid_amount,
          status,
          category:expense_categories (
            slug
          )
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .order("due_date", {
        ascending: true,
      }),

    supabase
      .from("extra_amortizations")
      .select(
        `
          amount,
          amortization_date
        `,
      )
      .order("amortization_date", {
        ascending: false,
      }),

    supabase
      .from("construction_updates")
      .select(
        `
          overall_progress,
          reference_month,
          status
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .order("reference_month", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("construction_media")
      .select(
        `
          id,
          title,
          reference_month,
          storage_path,
          stage:construction_stages (
            name
          )
        `,
      )
      .eq(
        "apartment_id",
        apartment.id,
      )
      .order("reference_month", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (financingResponse.error) {
    throw new Error(
      `Não foi possível carregar o financiamento: ${financingResponse.error.message}`,
    );
  }

  if (expensesResponse.error) {
    throw new Error(
      `Não foi possível carregar os gastos: ${expensesResponse.error.message}`,
    );
  }

  if (amortizationsResponse.error) {
    throw new Error(
      `Não foi possível carregar as amortizações: ${amortizationsResponse.error.message}`,
    );
  }

  if (constructionResponse.error) {
    throw new Error(
      `Não foi possível carregar a obra: ${constructionResponse.error.message}`,
    );
  }

  if (mediaResponse.error) {
    throw new Error(
      `Não foi possível carregar a última imagem: ${mediaResponse.error.message}`,
    );
  }

  const expenseRows =
    (expensesResponse.data ??
      []) as ExpenseRow[];

  const totalPaid = expenseRows.reduce(
    (total, expense) =>
      total + Number(expense.paid_amount),
    0,
  );

  const constructionFeePaid =
    expenseRows.reduce(
      (total, expense) => {
        if (
          getCategorySlug(
            expense.category,
          ) !== "taxa-obra"
        ) {
          return total;
        }

        return (
          total +
          Number(expense.paid_amount)
        );
      },
      0,
    );

  const pendingPlanned =
    expenseRows.reduce(
      (total, expense) => {
        if (
          expense.status === "paid" ||
          expense.status === "cancelled" ||
          expense.planned_amount === null
        ) {
          return total;
        }

        const remaining = Math.max(
          Number(expense.planned_amount) -
            Number(expense.paid_amount),
          0,
        );

        return total + remaining;
      },
      0,
    );

  const nextExpenseRow =
    expenseRows.find(
      (expense) =>
        expense.status === "planned" ||
        expense.status === "partial" ||
        expense.status === "overdue",
    ) ?? null;

  let nextExpense:
    | DashboardNextExpense
    | null = null;

  if (nextExpenseRow) {
    nextExpense = {
      id: nextExpenseRow.id,
      title: nextExpenseRow.title,
      dueDate: nextExpenseRow.due_date,

      plannedAmount:
        nextExpenseRow.planned_amount ===
        null
          ? null
          : Number(
              nextExpenseRow.planned_amount,
            ),

      paidAmount: Number(
        nextExpenseRow.paid_amount,
      ),

      status:
        nextExpenseRow.status as DashboardNextExpense["status"],
    };
  }

  const amortizationRows =
    (amortizationsResponse.data ??
      []) as AmortizationRow[];

  const totalAmortized =
    amortizationRows.reduce(
      (total, amortization) =>
        total +
        Number(amortization.amount),
      0,
    );

  let latestMedia:
    | DashboardLatestMedia
    | null = null;

  const mediaRow =
    mediaResponse.data as MediaRow | null;

  if (mediaRow) {
    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from(CONSTRUCTION_MEDIA_BUCKET)
      .createSignedUrl(
        mediaRow.storage_path,
        3600,
      );

    if (signedUrlError) {
      console.error(
        "Não foi possível assinar a última imagem:",
        signedUrlError,
      );
    } else {
      const stage = getSingleRelation(
        mediaRow.stage,
      );

      latestMedia = {
        id: mediaRow.id,
        title: mediaRow.title,
        stageName: stage?.name ?? null,
        referenceMonth:
          mediaRow.reference_month,
        signedUrl:
          signedUrlData.signedUrl,
      };
    }
  }

  return {
    apartment: {
      id: apartment.id,
      name: apartment.name,
      projectName:
        apartment.project_name,
      block: apartment.block,
      unit: apartment.unit,
      deliveryDate:
        apartment.delivery_date,
    },

    construction: mapConstruction(
      constructionResponse.data as
        | ConstructionRow
        | null,
    ),

    financing: mapFinancing(
      financingResponse.data as
        | FinancingRow
        | null,
    ),

    expenses: {
      totalPaid,
      constructionFeePaid,
      pendingPlanned,
      nextExpense,
    },

    amortizations: {
      totalAmount: totalAmortized,
      count: amortizationRows.length,

      latestDate:
        amortizationRows[0]
          ?.amortization_date ?? null,
    },

    latestMedia,
  };
}