export type ApartmentDocumentType =
  | "purchase_contract"
  | "financing"
  | "construction"
  | "expense"
  | "receipt"
  | "property"
  | "tax"
  | "insurance"
  | "renovation"
  | "other";

export interface ApartmentDocument {
  id: string;
  apartmentId: string;
  documentType: ApartmentDocumentType;

  title: string;
  description: string | null;
  issuerName: string | null;
  referenceDate: string | null;
  isImportant: boolean;

  bucketId: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;

  createdAt: string;
  signedUrl: string;

  expenseId: string | null;
expenseTitle: string | null;
expenseDueDate: string | null;

financingPaymentId: string | null;
financingPaymentInstallmentNumber: number | null;
financingPaymentDueDate: string | null;
}

export interface DocumentsPageData {
  apartmentId: string;
  apartmentName: string;
  documents: ApartmentDocument[];
}

export interface DocumentExpenseOption {
  id: string;
  title: string;
  dueDate: string;
}

export interface DocumentPaymentOption {
  id: string;
  installmentNumber: number;
  dueDate: string;
}

export interface DocumentLinkOptions {
  expenses: DocumentExpenseOption[];
  payments: DocumentPaymentOption[];
}