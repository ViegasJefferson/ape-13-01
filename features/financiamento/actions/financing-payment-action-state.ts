export interface FinancingPaymentActionState {
  status: "idle" | "success" | "error";
  message: string;

  fieldErrors?: {
    installmentNumber?: string[];
    dueDate?: string[];
    paidAt?: string[];
    regularPayment?: string[];
    interestAmount?: string[];
    principalAmount?: string[];
    trAdjustment?: string[];
    mioAmount?: string[];
    dfiAmount?: string[];
    administrativeFee?: string[];
    otherFees?: string[];
    remainingBalance?: string[];
    notes?: string[];
  };
}

export const INITIAL_FINANCING_PAYMENT_STATE: FinancingPaymentActionState =
  {
    status: "idle",
    message: "",
  };