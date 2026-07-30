export interface DashboardApartment {
  id: string;
  name: string;
  projectName: string | null;
  block: string | null;
  unit: string | null;
  deliveryDate: string | null;
}

export interface DashboardConstruction {
  overallProgress: number;
  referenceMonth: string;
  status:
    | "not_started"
    | "in_progress"
    | "paused"
    | "completed";
}

export interface DashboardFinancing {
  bankName: string;
  financedAmount: number;
  basePayment: number;
  contractualTermMonths: number;
  startDate: string | null;
}

export interface DashboardNextExpense {
  id: string;
  title: string;
  dueDate: string;
  plannedAmount: number | null;
  paidAmount: number;
  status:
    | "planned"
    | "partial"
    | "overdue";
}

export interface DashboardExpenseSummary {
  totalPaid: number;
  constructionFeePaid: number;
  pendingPlanned: number;
  nextExpense: DashboardNextExpense | null;
}

export interface DashboardAmortizationSummary {
  totalAmount: number;
  count: number;
  latestDate: string | null;
}

export interface DashboardLatestMedia {
  id: string;
  title: string | null;
  stageName: string | null;
  referenceMonth: string;
  signedUrl: string;
}

export interface HomeDashboardData {
  apartment: DashboardApartment;
  construction: DashboardConstruction | null;
  financing: DashboardFinancing | null;
  expenses: DashboardExpenseSummary;
  amortizations: DashboardAmortizationSummary;
  latestMedia: DashboardLatestMedia | null;
}