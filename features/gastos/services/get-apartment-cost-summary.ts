import type {
  ApartmentCostSummary,
  CostBreakdownItem,
  ExpenseCostNature,
} from "@/features/gastos/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
  purchase_price: number | string | null;
}

interface ExpenseCategoryRow {
  slug: string;
  cost_nature: string;
}

interface ExpenseRow {
  paid_amount: number | string;
  status: string;

  category:
    | ExpenseCategoryRow
    | ExpenseCategoryRow[]
    | null;
}

interface FinancingContractRow {
  id: string;
}

interface FinancingPaymentRow {
  principal_amount: number | string;
  interest_amount: number | string;
  tr_adjustment: number | string;
  mio_amount: number | string;
  dfi_amount: number | string;
  administrative_fee: number | string;
  other_fees: number | string;
  total_paid: number | string;
  payment_status: string;
}

interface ExtraAmortizationRow {
  amount: number | string;
}

const validCostNatures: ExpenseCostNature[] = [
  "purchase_principal",
  "additional_cost",
  "post_delivery_cost",
];

function roundCurrency(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function getSingleRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function isExpenseCostNature(
  value: string,
): value is ExpenseCostNature {
  return validCostNatures.includes(
    value as ExpenseCostNature,
  );
}

export async function getApartmentCostSummary(
  apartmentId: string,
): Promise<ApartmentCostSummary> {
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
        purchase_price
      `,
    )
    .eq("id", apartmentId)
    .maybeSingle();

  if (apartmentError) {
    throw new Error(
      `Não foi possível carregar o apartamento: ${apartmentError.message}`,
    );
  }

  if (!apartmentData) {
    throw new Error(
      "O apartamento informado não foi encontrado.",
    );
  }

  const apartment =
    apartmentData as ApartmentRow;

  const [
    expensesResponse,
    contractResponse,
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        `
          paid_amount,
          status,
          category:expense_categories (
            slug,
            cost_nature
          )
        `,
      )
      .eq("apartment_id", apartmentId),

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
      `Não foi possível carregar os gastos: ${expensesResponse.error.message}`,
    );
  }

  if (contractResponse.error) {
    throw new Error(
      `Não foi possível carregar o contrato: ${contractResponse.error.message}`,
    );
  }

  const expenseRows =
    (expensesResponse.data ?? []) as ExpenseRow[];

  let purchasePrincipalExpenses = 0;
  let constructionFeePaid = 0;
  let otherAdditionalExpenses = 0;
  let postDeliveryExpenses = 0;

  for (const expense of expenseRows) {
    if (expense.status === "cancelled") {
      continue;
    }

    const amount = Number(
      expense.paid_amount,
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const category = getSingleRelation(
      expense.category,
    );

    if (
      !category ||
      !isExpenseCostNature(
        category.cost_nature,
      )
    ) {
      continue;
    }

    if (
      category.cost_nature ===
      "purchase_principal"
    ) {
      purchasePrincipalExpenses += amount;
      continue;
    }

    if (
      category.cost_nature ===
      "post_delivery_cost"
    ) {
      postDeliveryExpenses += amount;
      continue;
    }

    if (category.slug === "taxa-obra") {
      constructionFeePaid += amount;
      continue;
    }

    otherAdditionalExpenses += amount;
  }

  const contract =
    contractResponse.data as
      | FinancingContractRow
      | null;

  let financingRows: FinancingPaymentRow[] =
    [];

  let extraAmortizationRows: ExtraAmortizationRow[] =
    [];

  if (contract) {
    const [
      financingPaymentsResponse,
      extraAmortizationsResponse,
    ] = await Promise.all([
      supabase
        .from("financing_payments")
        .select(
          `
            principal_amount,
            interest_amount,
            tr_adjustment,
            mio_amount,
            dfi_amount,
            administrative_fee,
            other_fees,
            total_paid,
            payment_status
          `,
        )
        .eq("contract_id", contract.id),

      supabase
        .from("extra_amortizations")
        .select("amount")
        .eq("contract_id", contract.id),
    ]);

    if (financingPaymentsResponse.error) {
      throw new Error(
        `Não foi possível carregar as parcelas: ${financingPaymentsResponse.error.message}`,
      );
    }

    if (extraAmortizationsResponse.error) {
      throw new Error(
        `Não foi possível carregar as amortizações: ${extraAmortizationsResponse.error.message}`,
      );
    }

    financingRows =
      (financingPaymentsResponse.data ??
        []) as FinancingPaymentRow[];

    extraAmortizationRows =
      (extraAmortizationsResponse.data ??
        []) as ExtraAmortizationRow[];
  }

  let financingPaymentsPaid = 0;
  let financingPrincipalPaid = 0;
  let interestPaid = 0;
  let trPaid = 0;
  let insurancePaid = 0;
  let financingFeesPaid = 0;

  for (const payment of financingRows) {
    if (
      payment.payment_status !== "paid"
    ) {
      continue;
    }

    financingPaymentsPaid += Number(
      payment.total_paid,
    );

    financingPrincipalPaid += Number(
      payment.principal_amount,
    );

    interestPaid += Number(
      payment.interest_amount,
    );

    trPaid += Number(
      payment.tr_adjustment,
    );

    insurancePaid +=
      Number(payment.mio_amount) +
      Number(payment.dfi_amount);

    financingFeesPaid +=
      Number(payment.administrative_fee) +
      Number(payment.other_fees);
  }

  const extraAmortizationsPaid =
    extraAmortizationRows.reduce(
      (total, amortization) =>
        total +
        Number(amortization.amount),
      0,
    );

  const generalExpensesPaid =
    purchasePrincipalExpenses +
    constructionFeePaid +
    otherAdditionalExpenses +
    postDeliveryExpenses;

  const identifiedFinancingAmount =
    financingPrincipalPaid +
    interestPaid +
    trPaid +
    insurancePaid +
    financingFeesPaid;

  const reconciliationDifference =
    roundCurrency(
      financingPaymentsPaid -
        identifiedFinancingAmount,
    );

  const totalCashOutflow = roundCurrency(
    generalExpensesPaid +
      financingPaymentsPaid +
      extraAmortizationsPaid,
  );

  const acquisitionPrincipalPaid =
    roundCurrency(
      purchasePrincipalExpenses +
        financingPrincipalPaid +
        extraAmortizationsPaid,
    );

  const nonPrincipalCostsPaid =
    roundCurrency(
      totalCashOutflow -
        acquisitionPrincipalPaid,
    );

  const purchasePrice =
    apartment.purchase_price === null
      ? null
      : Number(apartment.purchase_price);

  const remainingPurchasePrincipal =
    purchasePrice === null
      ? null
      : roundCurrency(
          Math.max(
            purchasePrice -
              acquisitionPrincipalPaid,
            0,
          ),
        );

  const purchasePrincipalProgress =
    purchasePrice === null ||
    purchasePrice <= 0
      ? null
      : Math.min(
          (acquisitionPrincipalPaid /
            purchasePrice) *
            100,
          100,
        );

  const breakdown: CostBreakdownItem[] = [
    {
      key: "purchase-principal-expenses",
      label: "Entrada e pagamentos à construtora",
      amount: roundCurrency(
        purchasePrincipalExpenses,
      ),
      group: "principal",
    },
    {
      key: "financing-principal",
      label: "Principal pago nas parcelas",
      amount: roundCurrency(
        financingPrincipalPaid,
      ),
      group: "principal",
    },
    {
      key: "extra-amortizations",
      label: "Amortizações extraordinárias",
      amount: roundCurrency(
        extraAmortizationsPaid,
      ),
      group: "principal",
    },
    {
      key: "interest",
      label: "Juros do financiamento",
      amount: roundCurrency(interestPaid),
      group: "financing_cost",
    },
    {
      key: "tr",
      label: "TR e correções",
      amount: roundCurrency(trPaid),
      group: "financing_cost",
    },
    {
      key: "insurance",
      label: "Seguros MIP/MIO e DFI/DFC",
      amount: roundCurrency(
        insurancePaid,
      ),
      group: "financing_cost",
    },
    {
      key: "financing-fees",
      label: "Taxas e encargos bancários",
      amount: roundCurrency(
        financingFeesPaid,
      ),
      group: "financing_cost",
    },
    {
      key: "construction-fee",
      label: "Taxa de evolução de obra",
      amount: roundCurrency(
        constructionFeePaid,
      ),
      group: "additional_cost",
    },
    {
      key: "additional-expenses",
      label: "Outros custos adicionais",
      amount: roundCurrency(
        otherAdditionalExpenses,
      ),
      group: "additional_cost",
    },
    {
      key: "post-delivery",
      label: "Gastos após a entrega",
      amount: roundCurrency(
        postDeliveryExpenses,
      ),
      group: "post_delivery",
    },
  ];

  if (
    Math.abs(reconciliationDifference) >=
    0.01
  ) {
    breakdown.push({
      key: "reconciliation",
      label:
        "Diferença da composição das parcelas",
      amount: reconciliationDifference,
      group: "reconciliation",
    });
  }

  return {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    purchasePrice,

    totalCashOutflow,
    acquisitionPrincipalPaid,
    nonPrincipalCostsPaid,

    remainingPurchasePrincipal,
    purchasePrincipalProgress,

    generalExpensesPaid: roundCurrency(
      generalExpensesPaid,
    ),

    financingPaymentsPaid: roundCurrency(
      financingPaymentsPaid,
    ),

    extraAmortizationsPaid:
      roundCurrency(
        extraAmortizationsPaid,
      ),

    reconciliationDifference,

    hasReconciliationDifference:
      Math.abs(
        reconciliationDifference,
      ) >= 0.01,

    breakdown,
  };
}