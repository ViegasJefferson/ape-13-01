"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ExtraAmortizationActionState } from "@/features/financiamento/actions/extra-amortization-action-state";
import { createClient } from "@/lib/supabase/server";

const extraAmortizationSchema = z.object({
  contractId: z
    .string()
    .uuid("O contrato informado é inválido."),

  amortizationDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Informe uma data válida.",
    ),

  amount: z.coerce
    .number()
    .positive("O valor precisa ser maior que zero.")
    .max(
      100_000_000,
      "O valor informado é muito elevado.",
    ),

  reductionType: z.enum(["term", "payment"]),

  notes: z
    .string()
    .trim()
    .max(
      500,
      "A observação pode ter no máximo 500 caracteres.",
    ),
});


export async function createExtraAmortization(
  _previousState: ExtraAmortizationActionState,
  formData: FormData,
): Promise<ExtraAmortizationActionState> {
  const validation = extraAmortizationSchema.safeParse({
    contractId: formData.get("contractId"),
    amortizationDate: formData.get(
      "amortizationDate",
    ),
    amount: formData.get("amount"),
    reductionType: formData.get("reductionType"),
    notes: formData.get("notes") ?? "",
  });

  if (!validation.success) {
    const fieldErrors =
      validation.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        "Revise os campos indicados antes de continuar.",
      fieldErrors: {
        amortizationDate:
          fieldErrors.amortizationDate,
        amount: fieldErrors.amount,
        reductionType: fieldErrors.reductionType,
        notes: fieldErrors.notes,
      },
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente no sistema.",
    };
  }

  const { error } = await supabase
    .from("extra_amortizations")
    .insert({
      contract_id: validation.data.contractId,
      amortization_date:
        validation.data.amortizationDate,
      amount: validation.data.amount,
      reduction_type:
        validation.data.reductionType,
      notes: validation.data.notes || null,
      created_by: userId,
    });

  if (error) {
    console.error(
      "Erro ao cadastrar amortização:",
      error,
    );

    return {
      status: "error",
      message:
        "Não foi possível registrar a amortização.",
    };
  }

  revalidatePath("/financiamento");

  return {
    status: "success",
    message: "Amortização registrada com sucesso.",
  };
}