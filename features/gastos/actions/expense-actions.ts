"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ExpenseActionState } from "@/features/gastos/actions/expense-action-state";
import { createClient } from "@/lib/supabase/server";

const MAX_EXPENSE_VALUE = 100_000_000;

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
    .finite()
    .min(0, "O valor não pode ser negativo.")
    .max(
      MAX_EXPENSE_VALUE,
      "O valor informado é muito elevado.",
    )
    .nullable(),
);

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
    .finite()
    .min(0, "O valor não pode ser negativo.")
    .max(
      MAX_EXPENSE_VALUE,
      "O valor informado é muito elevado.",
    ),
);

const optionalDateSchema = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return null;
    }

    return value;
  },
  z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Informe uma data válida.",
    )
    .nullable(),
);

const optionalText = (
  maximumLength: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(maximumLength, message)
    .optional()
    .default("");

const createExpenseSchema = z.object({
  apartmentId: z
    .string()
    .uuid("O apartamento informado é inválido."),

  categoryId: z
    .string()
    .uuid("Selecione uma categoria válida."),

  title: z
    .string()
    .trim()
    .min(3, "Informe uma descrição.")
    .max(
      150,
      "A descrição pode ter no máximo 150 caracteres.",
    ),

  referenceMonth: z
    .string()
    .regex(
      /^\d{4}-\d{2}$/,
      "Informe um mês de referência válido.",
    ),

  dueDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Informe uma data de vencimento válida.",
    ),

  plannedAmount: optionalMoneySchema,
  paidAmount: requiredMoneySchema,
  paidAt: optionalDateSchema,

  vendorName: optionalText(
    120,
    "O fornecedor pode ter no máximo 120 caracteres.",
  ),

  paymentMethod: optionalText(
    80,
    "A forma de pagamento pode ter no máximo 80 caracteres.",
  ),

  notes: optionalText(
    500,
    "A observação pode ter no máximo 500 caracteres.",
  ),
});

const updateExpenseSchema = z.object({
  expenseId: z
    .string()
    .uuid("O lançamento informado é inválido."),

  apartmentId: z
    .string()
    .uuid("O apartamento informado é inválido."),

  plannedAmount: optionalMoneySchema,
  paidAmount: requiredMoneySchema,
  paidAt: optionalDateSchema,

  vendorName: optionalText(
    120,
    "O fornecedor pode ter no máximo 120 caracteres.",
  ),

  paymentMethod: optionalText(
    80,
    "A forma de pagamento pode ter no máximo 80 caracteres.",
  ),

  notes: optionalText(
    500,
    "A observação pode ter no máximo 500 caracteres.",
  ),

  statusMode: z.enum([
    "automatic",
    "cancelled",
  ]),
});


function determineStatus(
  plannedAmount: number | null,
  paidAmount: number,
): "planned" | "partial" | "paid" {
  if (paidAmount <= 0) {
    return "planned";
  }

  if (
    plannedAmount !== null &&
    paidAmount < plannedAmount
  ) {
    return "partial";
  }

  return "paid";
}

function validatePaymentDate(
  paidAmount: number,
  paidAt: string | null,
): ExpenseActionState | null {
  if (paidAmount > 0 && !paidAt) {
    return {
      status: "error",
      message:
        "Informe a data do pagamento.",
      fieldErrors: {
        paidAt: [
          "A data é obrigatória quando existe um valor pago.",
        ],
      },
    };
  }

  return null;
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();

  const {
    data,
    error,
  } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (error || !userId) {
    return {
      supabase,
      userId: null,
    };
  }

  return {
    supabase,
    userId,
  };
}

export async function createExpense(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const validation = createExpenseSchema.safeParse({
    apartmentId: formData.get("apartmentId"),
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    referenceMonth:
      formData.get("referenceMonth"),
    dueDate: formData.get("dueDate"),
    plannedAmount:
      formData.get("plannedAmount"),
    paidAmount: formData.get("paidAmount"),
    paidAt: formData.get("paidAt"),
    vendorName: formData.get("vendorName"),
    paymentMethod:
      formData.get("paymentMethod"),
    notes: formData.get("notes"),
  });

  if (!validation.success) {
    const errors =
      validation.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        "Revise os campos indicados antes de continuar.",
      fieldErrors: {
        categoryId: errors.categoryId,
        title: errors.title,
        referenceMonth:
          errors.referenceMonth,
        dueDate: errors.dueDate,
        plannedAmount:
          errors.plannedAmount,
        paidAmount: errors.paidAmount,
        paidAt: errors.paidAt,
        vendorName: errors.vendorName,
        paymentMethod:
          errors.paymentMethod,
        notes: errors.notes,
      },
    };
  }

  const paymentDateError =
    validatePaymentDate(
      validation.data.paidAmount,
      validation.data.paidAt,
    );

  if (paymentDateError) {
    return paymentDateError;
  }

  const {
    supabase,
    userId,
  } = await getAuthenticatedUserId();

  if (!userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente no sistema.",
    };
  }

  const {
    data: category,
    error: categoryError,
  } = await supabase
    .from("expense_categories")
    .select("id")
    .eq(
      "id",
      validation.data.categoryId,
    )
    .eq(
      "apartment_id",
      validation.data.apartmentId,
    )
    .eq("active", true)
    .maybeSingle();

  if (categoryError || !category) {
    return {
      status: "error",
      message:
        "A categoria selecionada não pertence ao apartamento.",
      fieldErrors: {
        categoryId: [
          "Selecione uma categoria válida.",
        ],
      },
    };
  }

  const status = determineStatus(
    validation.data.plannedAmount,
    validation.data.paidAmount,
  );

  const { error } = await supabase
    .from("expenses")
    .insert({
      apartment_id:
        validation.data.apartmentId,
      category_id:
        validation.data.categoryId,
      title: validation.data.title,
      reference_month: `${validation.data.referenceMonth}-01`,
      due_date: validation.data.dueDate,
      planned_amount:
        validation.data.plannedAmount,
      paid_amount:
        validation.data.paidAmount,
      paid_at:
        validation.data.paidAmount > 0
          ? validation.data.paidAt
          : null,
      status,
      vendor_name:
        validation.data.vendorName || null,
      payment_method:
        validation.data.paymentMethod ||
        null,
      notes:
        validation.data.notes || null,
      created_by: userId,
    });

  if (error) {
    console.error(
      "Erro ao registrar gasto:",
      error,
    );

    return {
      status: "error",
      message:
        "Não foi possível registrar o gasto.",
    };
  }

  revalidatePath("/gastos");

  return {
    status: "success",
    message:
      "Gasto registrado com sucesso.",
  };
}

export async function updateExpense(
  _previousState: ExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const validation = updateExpenseSchema.safeParse({
    expenseId: formData.get("expenseId"),
    apartmentId: formData.get("apartmentId"),
    plannedAmount:
      formData.get("plannedAmount"),
    paidAmount: formData.get("paidAmount"),
    paidAt: formData.get("paidAt"),
    vendorName: formData.get("vendorName"),
    paymentMethod:
      formData.get("paymentMethod"),
    notes: formData.get("notes"),
    statusMode: formData.get("statusMode"),
  });

  if (!validation.success) {
    const errors =
      validation.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        "Revise os campos indicados antes de continuar.",
      fieldErrors: {
        plannedAmount:
          errors.plannedAmount,
        paidAmount: errors.paidAmount,
        paidAt: errors.paidAt,
        vendorName: errors.vendorName,
        paymentMethod:
          errors.paymentMethod,
        notes: errors.notes,
      },
    };
  }

  if (
    validation.data.statusMode !==
    "cancelled"
  ) {
    const paymentDateError =
      validatePaymentDate(
        validation.data.paidAmount,
        validation.data.paidAt,
      );

    if (paymentDateError) {
      return paymentDateError;
    }
  }

  const {
    supabase,
    userId,
  } = await getAuthenticatedUserId();

  if (!userId) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente no sistema.",
    };
  }

  const status =
    validation.data.statusMode ===
    "cancelled"
      ? "cancelled"
      : determineStatus(
          validation.data.plannedAmount,
          validation.data.paidAmount,
        );

  const { error } = await supabase
    .from("expenses")
    .update({
      planned_amount:
        validation.data.plannedAmount,
      paid_amount:
        validation.data.paidAmount,
      paid_at:
        validation.data.paidAmount > 0
          ? validation.data.paidAt
          : null,
      status,
      vendor_name:
        validation.data.vendorName || null,
      payment_method:
        validation.data.paymentMethod ||
        null,
      notes:
        validation.data.notes || null,
    })
    .eq("id", validation.data.expenseId)
    .eq(
      "apartment_id",
      validation.data.apartmentId,
    );

  if (error) {
    console.error(
      "Erro ao atualizar gasto:",
      error,
    );

    return {
      status: "error",
      message:
        "Não foi possível atualizar o lançamento.",
    };
  }

  revalidatePath("/gastos");

  return {
    status: "success",
    message:
      "Lançamento atualizado com sucesso.",
  };
}