export interface FinancingSimulationInput {
  financedAmount: number;
  contractualTermMonths: number;
  basePayment: number;
  nominalAnnualRate: number;
  effectiveAnnualRate: number;
  monthlyTrRate: number;
  initialExtraPayment: number;
  monthlyExtraPayment: number;
  annualExtraPayment: number;
  startDate: string;
}

export interface FinancingInstallment {
  installmentNumber: number;
  dueDate: Date;
  openingBalance: number;
  trAdjustment: number;
  interest: number;
  regularPayment: number;
  principalPayment: number;
  extraPayment: number;
  closingBalance: number;
}

export interface FinancingSimulationResult {
  months: number;
  endDate: Date;
  totalInterest: number;
  totalTrAdjustment: number;
  totalPaid: number;
  totalExtraPaid: number;
  monthlyInterestRate: number;
  schedule: FinancingInstallment[];
}

export interface FinancingComparison {
  baseline: FinancingSimulationResult;
  scenario: FinancingSimulationResult;
  monthsSaved: number;
  interestSaved: number;
}