import {
  getActiveFinancingContract,
} from "@/features/financiamento/services/get-active-financing-contract";

import {
  getExtraAmortizations,
} from "@/features/financiamento/services/get-extra-amortizations";

import {
  getFinancingPayments,
} from "@/features/financiamento/services/get-financing-payments";

import {
  getApartmentCostSummary,
} from "@/features/gastos/services/get-apartment-cost-summary";

import {
  getExpenseDashboardData,
} from "@/features/gastos/services/get-expense-dashboard-data";

import {
  getHouseholdPageData,
} from "@/features/enxoval/services/get-household-page-data";

import {
  getRenovationPageData,
} from "@/features/reforma/services/get-renovation-page-data";

import type {
  ExtraAmortization,
  FinancingPayment,
} from "@/features/financiamento/types";

import type {
  ReportsPageData,
} from "@/features/relatorios/types";

export async function getReportsPageData(): Promise<
  ReportsPageData | null
> {
  const expensesData =
    await getExpenseDashboardData();

  if (!expensesData) {
    return null;
  }

  const [
    costSummary,
    financingContract,
    renovation,
    household,
  ] = await Promise.all([
    getApartmentCostSummary(
      expensesData.apartmentId,
    ),

    getActiveFinancingContract(),

    getRenovationPageData(),

    getHouseholdPageData(),
  ]);

  let financingPayments:
    FinancingPayment[] = [];

  let extraAmortizations:
    ExtraAmortization[] = [];

  if (financingContract) {
    [
      financingPayments,
      extraAmortizations,
    ] = await Promise.all([
      getFinancingPayments(
        financingContract.id,
      ),

      getExtraAmortizations(
        financingContract.id,
      ),
    ]);
  }

  return {
    apartmentId:
      expensesData.apartmentId,

    apartmentName:
      expensesData.apartmentName,

    costSummary,

    expenses:
      expensesData.expenses,

    financingContract,

    financingPayments,

    extraAmortizations,

    renovation,

    household,
  };
}