export type ExpenseStatus =
  | "planned"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export type ExpenseCostNature =
  | "purchase_principal"
  | "additional_cost"
  | "post_delivery_cost";

export interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  financialGroup: string;
  costNature: ExpenseCostNature;
}

export interface Expense {
  id: string;
  apartmentId: string;
  seriesId: string | null;
  title: string;
  referenceMonth: string;
  dueDate: string;
  plannedAmount: number | null;
  paidAmount: number;
  paidAt: string | null;
  status: ExpenseStatus;
  vendorName: string | null;
  paymentMethod: string | null;
  notes: string | null;
  category: ExpenseCategory;
}

export interface ExpenseDashboardData {
  apartmentId: string;
  apartmentName: string;
  expenses: Expense[];
  categories: ExpenseCategory[];
}

export type CostBreakdownGroup =
  | "principal"
  | "financing_cost"
  | "additional_cost"
  | "post_delivery"
  | "reconciliation";

export interface CostBreakdownItem {
  key: string;
  label: string;
  amount: number;
  group: CostBreakdownGroup;
}

export interface ApartmentCostSummary {
  apartmentId: string;
  apartmentName: string;

  purchasePrice: number | null;

  totalCashOutflow: number;
  acquisitionPrincipalPaid: number;
  nonPrincipalCostsPaid: number;

  remainingPurchasePrincipal: number | null;
  purchasePrincipalProgress: number | null;

  generalExpensesPaid: number;
  financingPaymentsPaid: number;
  extraAmortizationsPaid: number;

  reconciliationDifference: number;
  hasReconciliationDifference: boolean;

  breakdown: CostBreakdownItem[];
}