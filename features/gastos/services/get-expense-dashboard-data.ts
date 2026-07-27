import type {
  Expense,
  ExpenseCategory,
  ExpenseCostNature,
  ExpenseDashboardData,
  ExpenseStatus,
} from "@/features/gastos/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface ExpenseCategoryRow {
  id: string;
  name: string;
  slug: string;
  financial_group: string;
  cost_nature: string;
}

interface ExpenseRow {
  id: string;
  apartment_id: string;
  series_id: string | null;
  title: string;
  reference_month: string;
  due_date: string;
  planned_amount: number | string | null;
  paid_amount: number | string;
  paid_at: string | null;
  status: string;
  vendor_name: string | null;
  payment_method: string | null;
  notes: string | null;
  category:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null;
}

function isExpenseStatus(
  status: string,
): status is ExpenseStatus {
  return [
    "planned",
    "partial",
    "paid",
    "overdue",
    "cancelled",
  ].includes(status);
}

function isExpenseCostNature(
  value: string,
): value is ExpenseCostNature {
  return [
    "purchase_principal",
    "additional_cost",
    "post_delivery_cost",
  ].includes(value);
}

function mapCategoryRow(
  category: ExpenseCategoryRow,
): ExpenseCategory {
  if (!isExpenseCostNature(category.cost_nature)) {
    throw new Error(
      `Natureza de custo inválida: ${category.cost_nature}.`,
    );
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    financialGroup: category.financial_group,
    costNature: category.cost_nature,
  };
}

function mapCategoryRelation(
  relation:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null,
): ExpenseCategory {
  const category = Array.isArray(relation)
    ? relation[0]
    : relation;

  if (!category) {
    throw new Error(
      "O lançamento não possui uma categoria válida.",
    );
  }

  return mapCategoryRow(category);
}

function mapExpense(row: ExpenseRow): Expense {
  if (!isExpenseStatus(row.status)) {
    throw new Error(
      `Status de gasto inválido: ${row.status}.`,
    );
  }

  return {
    id: row.id,
    apartmentId: row.apartment_id,
    seriesId: row.series_id,
    title: row.title,
    referenceMonth: row.reference_month,
    dueDate: row.due_date,
    plannedAmount:
      row.planned_amount === null
        ? null
        : Number(row.planned_amount),
    paidAmount: Number(row.paid_amount),
    paidAt: row.paid_at,
    status: row.status,
    vendorName: row.vendor_name,
    paymentMethod: row.payment_method,
    notes: row.notes,
    category: mapCategoryRelation(row.category),
  };
}

export async function getExpenseDashboardData(): Promise<
  ExpenseDashboardData | null
> {
  const supabase = await createClient();

  const {
    data: apartment,
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

  if (!apartment) {
    return null;
  }

  const [
    categoriesResponse,
    expensesResponse,
  ] = await Promise.all([
    supabase
      .from("expense_categories")
      .select(
        `
          id,
          name,
          slug,
          financial_group,
          cost_nature
        `,
      )
      .eq("apartment_id", apartment.id)
      .eq("active", true)
      .order("sort_order", {
        ascending: true,
      }),

    supabase
      .from("expenses")
      .select(
        `
          id,
          apartment_id,
          series_id,
          title,
          reference_month,
          due_date,
          planned_amount,
          paid_amount,
          paid_at,
          status,
          vendor_name,
          payment_method,
          notes,
          category:expense_categories (
            id,
            name,
            slug,
            financial_group,
            cost_nature
          )
        `,
      )
      .eq("apartment_id", apartment.id)
      .order("due_date", {
        ascending: true,
      }),
  ]);

  if (categoriesResponse.error) {
    throw new Error(
      `Não foi possível carregar as categorias: ${categoriesResponse.error.message}`,
    );
  }

  if (expensesResponse.error) {
    throw new Error(
      `Não foi possível carregar os gastos: ${expensesResponse.error.message}`,
    );
  }

  return {
    apartmentId: (apartment as ApartmentRow).id,
    apartmentName: (apartment as ApartmentRow).name,

    categories: (
      categoriesResponse.data ?? []
    ).map((category) =>
      mapCategoryRow(
        category as ExpenseCategoryRow,
      ),
    ),

    expenses: (
      expensesResponse.data ?? []
    ).map((expense) =>
      mapExpense(expense as ExpenseRow),
    ),
  };
}