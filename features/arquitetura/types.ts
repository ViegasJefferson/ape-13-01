export type ArchitectureItemType =
  | "deliverable"
  | "version"
  | "decision"
  | "meeting"
  | "task";

export type ArchitectureStatus =
  | "planned"
  | "in_progress"
  | "review"
  | "approved"
  | "completed"
  | "cancelled";

export type ArchitecturePriority =
  | "low"
  | "medium"
  | "high";

export interface ArchitectureItem {
  id: string;

  apartmentId: string;

  title: string;
  room: string | null;

  itemType: ArchitectureItemType;
  status: ArchitectureStatus;
  priority: ArchitecturePriority;

  versionLabel: string | null;

  professionalName: string | null;

  targetDate: string | null;
  completedAt: string | null;

  description: string | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ArchitecturePageData {
  apartmentId: string;
  apartmentName: string;

  canEdit: boolean;

  items: ArchitectureItem[];
  rooms: string[];

  totalItems: number;
  pendingItems: number;
  reviewItems: number;
  approvedItems: number;
  overdueItems: number;
}

export interface SaveArchitectureItemInput {
  id?: string;

  apartmentId: string;

  title: string;
  room: string | null;

  itemType: ArchitectureItemType;
  status: ArchitectureStatus;
  priority: ArchitecturePriority;

  versionLabel: string | null;

  professionalName: string | null;

  targetDate: string | null;

  description: string | null;
  notes: string | null;
}

export interface ArchitectureActionResult {
  status: "success" | "error";
  message: string;
}