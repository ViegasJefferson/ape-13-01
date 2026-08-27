export type ReminderEventType =
  | "reminder"
  | "payment"
  | "financing"
  | "construction"
  | "renovation"
  | "document"
  | "appointment"
  | "other";

export type ReminderPriority =
  | "low"
  | "medium"
  | "high";

export interface ApartmentReminder {
  id: string;

  apartmentId: string;

  title: string;
  description: string | null;

  eventType: ReminderEventType;
  priority: ReminderPriority;

  eventDate: string;
  eventTime: string | null;

  isCompleted: boolean;
  completedAt: string | null;

  sourceType: string | null;
  sourceId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface AgendaPageData {
  apartmentId: string;
  apartmentName: string;

  canEdit: boolean;

  reminders: ApartmentReminder[];

  overdueCount: number;
  todayCount: number;
  nextSevenDaysCount: number;
  completedCount: number;
}

export interface SaveReminderInput {
  id?: string;

  apartmentId: string;

  title: string;
  description: string | null;

  eventType: ReminderEventType;
  priority: ReminderPriority;

  eventDate: string;
  eventTime: string | null;
}

export interface ReminderActionResult {
  status: "success" | "error";
  message: string;
}