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

export interface ConstructionMedia {
  id: string;
  apartmentId: string;
  stageId: string | null;
  stageName: string | null;
  referenceMonth: string;
  mediaType: "image" | "video";
  bucketId: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  title: string | null;
  description: string | null;
  sourceName: string | null;
  capturedAt: string | null;
  createdAt: string;
  signedUrl: string;
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