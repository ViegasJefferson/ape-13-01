export type HouseholdListType =
  | "trousseau"
  | "housewarming";

export type HouseholdItemPriority =
  | "low"
  | "medium"
  | "high";

export interface HouseholdItem {
  id: string;
  apartmentId: string;

  listType: HouseholdListType;

  title: string;
  category: string;
  room: string | null;
  priority: HouseholdItemPriority;

  desiredQuantity: number;
  purchasedQuantity: number;
  receivedQuantity: number;

  estimatedUnitAmount: number;
  actualTotalAmount: number;

  storeName: string | null;
  productUrl: string | null;
  productImageUrl: string | null;
  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface HouseholdPageData {
  apartmentId: string;
  apartmentName: string;
  canEdit: boolean;

  items: HouseholdItem[];
  categories: string[];

  totalItems: number;
  completedItems: number;

  desiredUnits: number;
  fulfilledUnits: number;

  estimatedBudget: number;
  actualSpent: number;
  estimatedGiftValue: number;
  estimatedPendingCost: number;

  progressPercentage: number;
}

export interface SaveHouseholdItemInput {
  id?: string;

  apartmentId: string;
  listType: HouseholdListType;

  title: string;
  category: string;
  room: string | null;
  priority: HouseholdItemPriority;

  desiredQuantity: number;
  purchasedQuantity: number;
  receivedQuantity: number;

  estimatedUnitAmount: number;
  actualTotalAmount: number;

  storeName: string | null;
  productUrl: string | null;
  productImageUrl: string | null;
  notes: string | null;
}

export interface HouseholdActionResult {
  status: "success" | "error";
  message: string;
}

export interface ImportedProductData {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  storeName: string | null;
  url: string;
}

export interface ProductImportApiResponse {
  status: "success" | "error";
  message: string;
  product?: ImportedProductData;
}