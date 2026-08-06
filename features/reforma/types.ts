export type RenovationItemStatus =
  | "planned"
  | "quoting"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export type RenovationItemPriority =
  | "low"
  | "medium"
  | "high";

export interface RenovationItem {
  id: string;
  apartmentId: string;

  title: string;
  area: string | null;

  status: RenovationItemStatus;
  priority: RenovationItemPriority;

  plannedAmount: number;
  actualAmount: number;

  vendorName: string | null;
  targetDate: string | null;
  completedAt: string | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface RenovationPageData {
  apartmentId: string;
  apartmentName: string;
  canEdit: boolean;

  items: RenovationItem[];

  totalItems: number;
  completedItems: number;

  plannedBudget: number;
  actualAmount: number;
  budgetBalance: number;

  progressPercentage: number;
}

export interface SaveRenovationItemInput {
  id?: string;
  apartmentId: string;

  title: string;
  area: string | null;

  status: RenovationItemStatus;
  priority: RenovationItemPriority;

  plannedAmount: number;
  actualAmount: number;

  vendorName: string | null;
  targetDate: string | null;
  notes: string | null;
}

export interface RenovationActionResult {
  status: "success" | "error";
  message: string;
}