import type {
  FinancingComparison,
  FinancingSimulationInput,
  FinancingSimulationResult,
} from "@/features/financiamento/types";

const MAX_SIMULATION_MONTHS = 1200;

function calculatePricePayment(
  principal: number,
  monthlyRate: number,
  months: number,
) {
  if (monthlyRate === 0) {
    return principal / months;
  }

  return (
    principal *
    (monthlyRate / (1 - Math.pow(1 + monthlyRate, -months)))
  );
}

/**
 * Encontra a taxa mensal compatível com o valor financiado,
 * a prestação-base e o prazo contratual.
 *
 * Isso evita pequenos resíduos causados pelo arredondamento
 * das taxas publicadas no contrato.
 */
function calculateImpliedMonthlyRate(
  principal: number,
  payment: number,
  months: number,
) {
  if (principal <= 0 || payment <= 0 || months <= 0) {
    return 0;
  }

  const paymentWithoutInterest = principal / months;

  if (payment <= paymentWithoutInterest) {
    return 0;
  }

  let minimumRate = 0;
  let maximumRate = 0.05;

  while (
    calculatePricePayment(principal, maximumRate, months) < payment &&
    maximumRate < 1
  ) {
    maximumRate *= 2;
  }

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const estimatedRate = (minimumRate + maximumRate) / 2;

    const estimatedPayment = calculatePricePayment(
      principal,
      estimatedRate,
      months,
    );

    if (estimatedPayment > payment) {
      maximumRate = estimatedRate;
    } else {
      minimumRate = estimatedRate;
    }
  }

  return (minimumRate + maximumRate) / 2;
}

function calculateEndDate(startDate: string, months: number) {
  const [year, month, day] = startDate.split("-").map(Number);

  return new Date(year, month - 1 + months - 1, day);
}

export function simulateFinancing(
  input: FinancingSimulationInput,
): FinancingSimulationResult {
  const monthlyInterestRate = calculateImpliedMonthlyRate(
    input.financedAmount,
    input.basePayment,
    input.contractualTermMonths,
  );

  const monthlyTrRate = input.monthlyTrRate / 100;

  let outstandingBalance = input.financedAmount;
  let totalInterest = 0;
  let totalTrAdjustment = 0;
  let totalPaid = 0;
  let totalExtraPaid = 0;
  let currentMonth = 0;

  while (
    outstandingBalance > 0.01 &&
    currentMonth < MAX_SIMULATION_MONTHS
  ) {
    currentMonth += 1;

    /*
     * Primeiro atualizamos o saldo pela TR informada.
     * O valor padrão será zero porque a TR futura é desconhecida.
     */
    const trAdjustment = outstandingBalance * monthlyTrRate;

    outstandingBalance += trAdjustment;
    totalTrAdjustment += trAdjustment;

    const interest = outstandingBalance * monthlyInterestRate;

    const regularPayment = Math.min(
      input.basePayment,
      outstandingBalance + interest,
    );

    const principalPayment = regularPayment - interest;

    if (principalPayment <= 0) {
      throw new Error(
        "A prestação informada não é suficiente para pagar os juros mensais.",
      );
    }

    outstandingBalance -= principalPayment;

    let extraPayment = input.monthlyExtraPayment;

    /*
     * A amortização inicial acontece após o pagamento
     * da primeira prestação.
     */
    if (currentMonth === 1) {
      extraPayment += input.initialExtraPayment;
    }

    /*
     * O aporte anual acontece a cada 12 prestações.
     */
    if (currentMonth % 12 === 0) {
      extraPayment += input.annualExtraPayment;
    }

    extraPayment = Math.min(
      extraPayment,
      Math.max(outstandingBalance, 0),
    );

    outstandingBalance -= extraPayment;

    totalInterest += interest;
    totalExtraPaid += extraPayment;
    totalPaid += regularPayment + extraPayment;
  }

  if (currentMonth >= MAX_SIMULATION_MONTHS) {
    throw new Error(
      "Não foi possível quitar o financiamento com os parâmetros informados.",
    );
  }

  return {
    months: currentMonth,
    endDate: calculateEndDate(input.startDate, currentMonth),
    totalInterest,
    totalTrAdjustment,
    totalPaid,
    totalExtraPaid,
    monthlyInterestRate,
  };
}

export function compareFinancing(
  input: FinancingSimulationInput,
): FinancingComparison {
  const baseline = simulateFinancing({
    ...input,
    initialExtraPayment: 0,
    monthlyExtraPayment: 0,
    annualExtraPayment: 0,
  });

  const scenario = simulateFinancing(input);

  return {
    baseline,
    scenario,
    monthsSaved: Math.max(baseline.months - scenario.months, 0),
    interestSaved: Math.max(
      baseline.totalInterest - scenario.totalInterest,
      0,
    ),
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatTerm(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const yearText =
    years === 0 ? "" : `${years} ${years === 1 ? "ano" : "anos"}`;

  const monthText =
    months === 0
      ? ""
      : `${months} ${months === 1 ? "mês" : "meses"}`;

  return [yearText, monthText].filter(Boolean).join(" e ");
}

export function formatMonthYear(date: Date) {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    formattedDate.charAt(0).toUpperCase() +
    formattedDate.slice(1)
  );
}