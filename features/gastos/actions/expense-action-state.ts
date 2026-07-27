export interface ExpenseActionState {
  status: "idle" | "success" | "error";
  message: string;

  fieldErrors?: {
    categoryId?: string[];
    title?: string[];
    referenceMonth?: string[];
    dueDate?: string[];
    plannedAmount?: string[];
    paidAmount?: string[];
    paidAt?: string[];
    vendorName?: string[];
    paymentMethod?: string[];
    notes?: string[];
  };
}

export const INITIAL_EXPENSE_ACTION_STATE: ExpenseActionState = {
  status: "idle",
  message: "",
};