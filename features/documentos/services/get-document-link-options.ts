import type {
  DocumentExpenseOption,
  DocumentLinkOptions,
  DocumentPaymentOption,
} from "@/features/documentos/types";
import { createClient } from "@/lib/supabase/server";

interface ExpenseRow {
  id: string;
  title: string;
  due_date: string;
}

interface FinancingContractRow {
  id: string;
}

interface FinancingPaymentRow {
  id: string;
  installment_number: number;
  due_date: string;
}

export async function getDocumentLinkOptions(
  apartmentId: string,
): Promise<DocumentLinkOptions> {
  const supabase = await createClient();

  const [
    expensesResponse,
    contractResponse,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        `
          id,
          title,
          due_date
        `,
      )
      .eq("apartment_id", apartmentId)
      .neq("status", "cancelled")
      .order("due_date", {
        ascending: false,
      }),

    supabase
      .from("financing_contracts")
      .select("id")
      .eq("apartment_id", apartmentId)
      .eq("active", true)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),
  ]);

  if (expensesResponse.error) {
    throw new Error(
      `Não foi possível carregar os gastos para vínculo: ${expensesResponse.error.message}`,
    );
  }

  if (contractResponse.error) {
    throw new Error(
      `Não foi possível carregar o contrato: ${contractResponse.error.message}`,
    );
  }

  const expenses: DocumentExpenseOption[] = (
    (expensesResponse.data ?? []) as ExpenseRow[]
  ).map((expense) => ({
    id: expense.id,
    title: expense.title,
    dueDate: expense.due_date,
  }));

  const contract =
    contractResponse.data as FinancingContractRow | null;

  let payments: DocumentPaymentOption[] = [];

  if (contract) {
    const { data, error } = await supabase
      .from("financing_payments")
      .select(
        `
          id,
          installment_number,
          due_date
        `,
      )
      .eq("contract_id", contract.id)
      .order("installment_number", {
        ascending: false,
      });

    if (error) {
      throw new Error(
        `Não foi possível carregar as parcelas para vínculo: ${error.message}`,
      );
    }

    payments = (
      (data ?? []) as FinancingPaymentRow[]
    ).map((payment) => ({
      id: payment.id,
      installmentNumber: Number(
        payment.installment_number,
      ),
      dueDate: payment.due_date,
    }));
  }

  return {
    expenses,
    payments,
  };
}