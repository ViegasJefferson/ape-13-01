export interface ConstructionUpdateActionState {
  status: "idle" | "success" | "error";
  message: string;

  fieldErrors?: {
    referenceMonth?: string[];
    overallProgress?: string[];
    constructionStatus?: string[];
    sourceName?: string[];
    notes?: string[];

    stages?: Record<
      string,
      string[]
    >;
  };
}

export const INITIAL_CONSTRUCTION_UPDATE_STATE: ConstructionUpdateActionState =
  {
    status: "idle",
    message: "",
  };