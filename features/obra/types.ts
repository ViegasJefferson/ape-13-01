export type ConstructionStatus =
  | "not_started"
  | "in_progress"
  | "paused"
  | "completed";

export interface ConstructionUpdate {
  id: string;
  referenceMonth: string;
  overallProgress: number;
  status: ConstructionStatus;
  sourceName: string | null;
  notes: string | null;
  updatedAt: string;
}

export interface ConstructionStage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  progress: number;
  notes: string | null;
}

export interface ConstructionDashboardData {
  apartmentId: string;
  apartmentName: string;
  projectName: string | null;
  deliveryDate: string | null;
  currentUpdate: ConstructionUpdate | null;
  stages: ConstructionStage[];
  history: ConstructionUpdate[];
}