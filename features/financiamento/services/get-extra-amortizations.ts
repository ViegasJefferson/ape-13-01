import type {
  ExtraAmortization,
  ExtraAmortizationReductionType,
} from "@/features/financiamento/types";
import { createClient } from "@/lib/supabase/server";

interface ExtraAmortizationRow {
  id: string;
  contract_id: string;
  amortization_date: string;
  amount: number;
  reduction_type: string;
  notes: string | null;
  created_at: string;
}

function isReductionType(
  value: string,
): value is ExtraAmortizationReductionType {
  return value === "term" || value === "payment";
}

function mapExtraAmortization(
  row: ExtraAmortizationRow,
): ExtraAmortization {
  if (!isReductionType(row.reduction_type)) {
    throw new Error(
      `Tipo de redução inválido: ${row.reduction_type}.`,
    );
  }

  return {
    id: row.id,
    contractId: row.contract_id,
    amortizationDate: row.amortization_date,
    amount: Number(row.amount),
    reductionType: row.reduction_type,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getExtraAmortizations(
  contractId: string,
): Promise<ExtraAmortization[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("extra_amortizations")
    .select(
      `
        id,
        contract_id,
        amortization_date,
        amount,
        reduction_type,
        notes,
        created_at
      `,
    )
    .eq("contract_id", contractId)
    .order("amortization_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Não foi possível carregar as amortizações: ${error.message}`,
    );
  }

  return (data ?? []).map((row) =>
    mapExtraAmortization(row as ExtraAmortizationRow),
  );
}