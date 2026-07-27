export interface ExtraAmortizationActionState {
  status: "idle" | "success" | "error";
  message: string;

  fieldErrors?: {
    amortizationDate?: string[];
    amount?: string[];
    reductionType?: string[];
    notes?: string[];
  };
}

export const INITIAL_EXTRA_AMORTIZATION_STATE: ExtraAmortizationActionState = {
  status: "idle",
  message: "",
};