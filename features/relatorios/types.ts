import type {
  ExtraAmortization,
  FinancingContract,
  FinancingPayment,
} from "@/features/financiamento/types";

import type {
  ApartmentCostSummary,
  Expense,
} from "@/features/gastos/types";

import type {
  HouseholdPageData,
} from "@/features/enxoval/types";

import type {
  RenovationPageData,
} from "@/features/reforma/types";

export interface ReportsPageData {
  apartmentId: string;
  apartmentName: string;

  costSummary:
    ApartmentCostSummary;

  expenses: Expense[];

  financingContract:
    FinancingContract | null;

  financingPayments:
    FinancingPayment[];

  extraAmortizations:
    ExtraAmortization[];

  renovation:
    RenovationPageData | null;

  household:
    HouseholdPageData | null;
}