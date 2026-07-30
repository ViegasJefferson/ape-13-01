"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FinancingPaymentActionState } from "@/features/financiamento/actions/financing-payment-action-state";
import { createClient } from "@/lib/supabase/server";

const MAX_VALUE = 100_000_000;

const requiredMoneySchema = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return 0;
    }

    return Number(value);
  },
  z
    .number()
    .finite("Informe um valor válido.")
    .min(0, "O valor não pode ser negativo.")
    .max(
      MAX_VALUE,
      "O valor informado é muito elevado.",
    ),
);

const optionalMoneySchema = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return Number(value);
  },
  z
    .number()
    .finite("Informe um valor válido.")
    .min(0, "O valor não pode ser negativo.")
    .max(
      MAX_VALUE,
      "O valor informado é muito elevado.",
    )
    .nullable(),
);

const financingPaymentSchema = z.object({
  contractId: z
    .string()
    .uuid("O contrato informado é inválido."),

  installmentNumber: z.coerce
    .number()
    .int("Informe um número inteiro.")
    .positive(
      "O número da parcela deve ser maior que zero.",
    )
    .max(
      1000,
      "O número da parcela é muito elevado.",
    ),

  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Informe um vencimento válido.",
    ),

  paidAt: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Informe uma data de pagamento válida.",
    ),

  regularPayment: requiredMoneySchema,
  interestAmount: requiredMoneySchema,
  principalAmount: requiredMoneySchema,
  trAdjustment: requiredMoneySchema,
  mioAmount: requiredMoneySchema,
  dfiAmount: requiredMoneySchema,
  administrativeFee: requiredMoneySchema,
  otherFees: requiredMoneySchema,

  remainingBalance: optionalMoneySchema,

  notes: z
    .string()
    .trim()
    .max(
      500,
      "A observação pode ter no máximo 500 caracteres.",
    ),
});

function roundCurrency(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

export async function saveFinancingPayment(
  _previousState: FinancingPaymentActionState,
  formData: FormData,
): Promise<FinancingPaymentActionState> {
  const validation =
    financingPaymentSchema.safeParse({
      contractId:
        formData.get("contractId"),

      installmentNumber:
        formData.get("installmentNumber"),

      dueDate: formData.get("dueDate"),
      paidAt: formData.get("paidAt"),

      regularPayment:
        formData.get("regularPayment"),

      interestAmount:
        formData.get("interestAmount"),

      principalAmount:
        formData.get("principalAmount"),

      trAdjustment:
        formData.get("trAdjustment"),

      mioAmount:
        formData.get("mioAmount"),

      dfiAmount:
        formData.get("dfiAmount"),

      administrativeFee:
        formData.get(
          "administrativeFee",
        ),

      otherFees:
        formData.get("otherFees"),

      remainingBalance:
        formData.get("remainingBalance"),

      notes: formData.get("notes") ?? "",
    });

  if (!validation.success) {
    const errors =
      validation.error.flatten()
        .fieldErrors;

    return {
      status: "error",
      message:
        "Revise os campos indicados antes de continuar.",

      fieldErrors: {
        installmentNumber:
          errors.installmentNumber,
        dueDate: errors.dueDate,
        paidAt: errors.paidAt,
        regularPayment:
          errors.regularPayment,
        interestAmount:
          errors.interestAmount,
        principalAmount:
          errors.principalAmount,
        trAdjustment:
          errors.trAdjustment,
        mioAmount: errors.mioAmount,
        dfiAmount: errors.dfiAmount,
        administrativeFee:
          errors.administrativeFee,
        otherFees: errors.otherFees,
        remainingBalance:
          errors.remainingBalance,
        notes: errors.notes,
      },
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente no sistema.",
    };
  }

  const values = validation.data;

  const totalPaid = roundCurrency(
    values.regularPayment +
      values.trAdjustment +
      values.mioAmount +
      values.dfiAmount +
      values.administrativeFee +
      values.otherFees,
  );

  if (totalPaid <= 0) {
    return {
      status: "error",
      message:
        "O total da parcela precisa ser maior que zero.",
      fieldErrors: {
        regularPayment: [
          "Informe os valores efetivamente pagos.",
        ],
      },
    };
  }

  const { data: contract } =
    await supabase
      .from("financing_contracts")
      .select("id")
      .eq("id", values.contractId)
      .eq("active", true)
      .maybeSingle();

  if (!contract) {
    return {
      status: "error",
      message:
        "O contrato não foi encontrado ou você não possui acesso.",
    };
  }

  const { error } = await supabase
    .from("financing_payments")
    .upsert(
      {
        contract_id: values.contractId,

        installment_number:
          values.installmentNumber,

        due_date: values.dueDate,
        paid_at: values.paidAt,

        regular_payment:
          values.regularPayment,

        interest_amount:
          values.interestAmount,

        principal_amount:
          values.principalAmount,

        tr_adjustment:
          values.trAdjustment,

        mio_amount:
          values.mioAmount,

        dfi_amount:
          values.dfiAmount,

        administrative_fee:
          values.administrativeFee,

        other_fees:
          values.otherFees,

        total_paid: totalPaid,

        remaining_balance:
          values.remainingBalance,

        payment_status: "paid",

        notes: values.notes || null,
        created_by: userId,
      },
      {
        onConflict:
          "contract_id,installment_number",
      },
    );

  if (error) {
    console.error(
      "Erro ao salvar parcela:",
      error,
    );

    return {
      status: "error",
      message:
        "Não foi possível registrar a parcela.",
    };
  }

  revalidatePath("/financiamento");
  revalidatePath("/");

  return {
    status: "success",
    message:
      "Parcela registrada com sucesso.",
  };
}