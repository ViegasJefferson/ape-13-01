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

export type AmortizationSystem = "PRICE" | "SAC" | "OUTRO";

export interface FinancingContract {
  id: string;
  apartmentId: string;
  bankName: string;
  amortizationSystem: AmortizationSystem;
  financedAmount: number;
  contractualTermMonths: number;
  basePayment: number;
  initialMonthlyCharge: number | null;
  nominalAnnualRate: number | null;
  effectiveAnnualRate: number | null;
  monthlyTrRate: number;
  startDate: string;
  notes: string | null;
}

export type ExtraAmortizationReductionType =
  | "term"
  | "payment";

export interface ExtraAmortization {
  id: string;
  contractId: string;
  amortizationDate: string;
  amount: number;
  reductionType: ExtraAmortizationReductionType;
  notes: string | null;
  createdAt: string;
}