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
}

export interface DocumentsPageData {
  apartmentId: string;
  apartmentName: string;
  documents: ApartmentDocument[];
}