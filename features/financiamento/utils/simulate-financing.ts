import type {
  FinancingComparison,
  FinancingInstallment,
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

function calculateInstallmentDate(
  startDate: string,
  installmentNumber: number,
) {
  const [year, month, day] = startDate.split("-").map(Number);

  return new Date(
    year,
    month - 1 + installmentNumber - 1,
    day,
  );
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

  const schedule: FinancingInstallment[] = [];

  while (
    outstandingBalance > 0.01 &&
    currentMonth < MAX_SIMULATION_MONTHS
  ) {
    currentMonth += 1;

    const openingBalance = outstandingBalance;

    /*
     * Atualização mensal do saldo pela TR projetada.
     * O valor padrão permanece em zero porque a TR futura
     * não pode ser conhecida antecipadamente.
     */
    const trAdjustment = outstandingBalance * monthlyTrRate;

    outstandingBalance += trAdjustment;

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

    outstandingBalance = Math.max(
      outstandingBalance - principalPayment,
      0,
    );

    let extraPayment = input.monthlyExtraPayment;

    /*
     * A amortização inicial é aplicada depois
     * da primeira prestação.
     */
    if (currentMonth === 1) {
      extraPayment += input.initialExtraPayment;
    }

    /*
     * A amortização anual é aplicada depois
     * de cada grupo de 12 prestações.
     */
    if (currentMonth % 12 === 0) {
      extraPayment += input.annualExtraPayment;
    }

    extraPayment = Math.min(extraPayment, outstandingBalance);

    outstandingBalance = Math.max(
      outstandingBalance - extraPayment,
      0,
    );

    totalInterest += interest;
    totalTrAdjustment += trAdjustment;
    totalExtraPaid += extraPayment;
    totalPaid += regularPayment + extraPayment;

    schedule.push({
      installmentNumber: currentMonth,
      dueDate: calculateInstallmentDate(
        input.startDate,
        currentMonth,
      ),
      openingBalance,
      trAdjustment,
      interest,
      regularPayment,
      principalPayment,
      extraPayment,
      closingBalance: outstandingBalance,
    });
  }

  if (currentMonth >= MAX_SIMULATION_MONTHS) {
    throw new Error(
      "Não foi possível quitar o financiamento com os parâmetros informados.",
    );
  }

  const finalInstallment = schedule.at(-1);

  if (!finalInstallment) {
    throw new Error(
      "O simulador não conseguiu gerar o demonstrativo.",
    );
  }

  return {
    months: currentMonth,
    endDate: finalInstallment.dueDate,
    totalInterest,
    totalTrAdjustment,
    totalPaid,
    totalExtraPaid,
    monthlyInterestRate,
    schedule,
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
    monthsSaved: Math.max(
      baseline.months - scenario.months,
      0,
    ),
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

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatTerm(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const yearText =
    years === 0
      ? ""
      : `${years} ${years === 1 ? "ano" : "anos"}`;

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