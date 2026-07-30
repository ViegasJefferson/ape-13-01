import type { FinancingPayment } from "@/features/financiamento/types";
import { createClient } from "@/lib/supabase/server";

interface FinancingPaymentRow {
  id: string;
  contract_id: string;
  installment_number: number;
  due_date: string;
  paid_at: string | null;

  regular_payment: number | string;
  interest_amount: number | string;
  principal_amount: number | string;
  tr_adjustment: number | string;
  mio_amount: number | string;
  dfi_amount: number | string;
  administrative_fee: number | string;
  other_fees: number | string;

  total_paid: number | string;
  remaining_balance: number | string | null;

  payment_status:
    | "planned"
    | "paid"
    | "overdue"
    | "cancelled";

  notes: string | null;
  created_at: string;
}

function mapFinancingPayment(
  row: FinancingPaymentRow,
): FinancingPayment {
  return {
    id: row.id,
    contractId: row.contract_id,
    installmentNumber: Number(
      row.installment_number,
    ),
    dueDate: row.due_date,
    paidAt: row.paid_at,

    regularPayment: Number(
      row.regular_payment,
    ),
    interestAmount: Number(
      row.interest_amount,
    ),
    principalAmount: Number(
      row.principal_amount,
    ),
    trAdjustment: Number(
      row.tr_adjustment,
    ),
    mioAmount: Number(row.mio_amount),
    dfiAmount: Number(row.dfi_amount),
    administrativeFee: Number(
      row.administrative_fee,
    ),
    otherFees: Number(row.other_fees),

    totalPaid: Number(row.total_paid),

    remainingBalance:
      row.remaining_balance === null
        ? null
        : Number(row.remaining_balance),

    paymentStatus: row.payment_status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getFinancingPayments(
  contractId: string,
): Promise<FinancingPayment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financing_payments")
    .select(
      `
        id,
        contract_id,
        installment_number,
        due_date,
        paid_at,
        regular_payment,
        interest_amount,
        principal_amount,
        tr_adjustment,
        mio_amount,
        dfi_amount,
        administrative_fee,
        other_fees,
        total_paid,
        remaining_balance,
        payment_status,
        notes,
        created_at
      `,
    )
    .eq("contract_id", contractId)
    .order("installment_number", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar as parcelas: ${error.message}`,
    );
  }

  return (
    (data ?? []) as FinancingPaymentRow[]
  ).map(mapFinancingPayment);
}