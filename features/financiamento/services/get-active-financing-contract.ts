import type {
  AmortizationSystem,
  FinancingContract,
} from "@/features/financiamento/types";
import { createClient } from "@/lib/supabase/server";

interface FinancingContractRow {
  id: string;
  apartment_id: string;
  bank_name: string;
  amortization_system: string;
  financed_amount: number;
  contractual_term_months: number;
  base_payment: number;
  initial_monthly_charge: number | null;
  nominal_annual_rate: number | null;
  effective_annual_rate: number | null;
  monthly_tr_rate: number;
  start_date: string | null;
  notes: string | null;
}

function isAmortizationSystem(
  value: string,
): value is AmortizationSystem {
  return ["PRICE", "SAC", "OUTRO"].includes(value);
}

function mapContract(
  row: FinancingContractRow,
): FinancingContract {
  if (!row.start_date) {
    throw new Error(
      "O contrato ativo não possui uma data inicial cadastrada.",
    );
  }

  if (!isAmortizationSystem(row.amortization_system)) {
    throw new Error(
      `Sistema de amortização inválido: ${row.amortization_system}.`,
    );
  }

  return {
    id: row.id,
    apartmentId: row.apartment_id,
    bankName: row.bank_name,
    amortizationSystem: row.amortization_system,
    financedAmount: Number(row.financed_amount),
    contractualTermMonths: Number(row.contractual_term_months),
    basePayment: Number(row.base_payment),
    initialMonthlyCharge:
      row.initial_monthly_charge === null
        ? null
        : Number(row.initial_monthly_charge),
    nominalAnnualRate:
      row.nominal_annual_rate === null
        ? null
        : Number(row.nominal_annual_rate),
    effectiveAnnualRate:
      row.effective_annual_rate === null
        ? null
        : Number(row.effective_annual_rate),
    monthlyTrRate: Number(row.monthly_tr_rate),
    startDate: row.start_date,
    notes: row.notes,
  };
}

export async function getActiveFinancingContract(): Promise<
  FinancingContract | null
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financing_contracts")
    .select(
      `
        id,
        apartment_id,
        bank_name,
        amortization_system,
        financed_amount,
        contractual_term_months,
        base_payment,
        initial_monthly_charge,
        nominal_annual_rate,
        effective_annual_rate,
        monthly_tr_rate,
        start_date,
        notes
      `,
    )
    .eq("active", true)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Não foi possível carregar o contrato: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  return mapContract(data as FinancingContractRow);
}