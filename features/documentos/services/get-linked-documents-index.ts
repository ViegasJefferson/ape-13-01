import type {
  ApartmentDocumentType,
  LinkedDocument,
  LinkedDocumentsIndex,
} from "@/features/documentos/types";
import { createClient } from "@/lib/supabase/server";

const DOCUMENTS_BUCKET =
  "apartment-documents";

interface LinkedDocumentRow {
  id: string;
  apartment_id: string;
  expense_id: string | null;
  financing_payment_id: string | null;

  document_type: string;
  title: string;
  reference_date: string | null;
  is_important: boolean;

  bucket_id: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
}

const validDocumentTypes: ApartmentDocumentType[] = [
  "purchase_contract",
  "financing",
  "construction",
  "expense",
  "receipt",
  "property",
  "tax",
  "insurance",
  "renovation",
  "other",
];

function isDocumentType(
  value: string,
): value is ApartmentDocumentType {
  return validDocumentTypes.includes(
    value as ApartmentDocumentType,
  );
}

function addDocumentToIndex(
  index: Record<string, LinkedDocument[]>,
  linkedId: string,
  document: LinkedDocument,
) {
  if (!index[linkedId]) {
    index[linkedId] = [];
  }

  index[linkedId].push(document);
}

export async function getLinkedDocumentsIndex(
  apartmentId: string,
): Promise<LinkedDocumentsIndex> {
  const supabase = await createClient();

  const {
    data: documentsData,
    error: documentsError,
  } = await supabase
    .from("apartment_documents")
    .select(
      `
        id,
        apartment_id,
        expense_id,
        financing_payment_id,
        document_type,
        title,
        reference_date,
        is_important,
        bucket_id,
        storage_path,
        original_file_name,
        mime_type
      `,
    )
    .eq("apartment_id", apartmentId)
    .order("is_important", {
      ascending: false,
    })
    .order("reference_date", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (documentsError) {
    throw new Error(
      `Não foi possível carregar os documentos vinculados: ${documentsError.message}`,
    );
  }

  const rows = (
    (documentsData ?? []) as LinkedDocumentRow[]
  ).filter(
    (document) =>
      document.expense_id !== null ||
      document.financing_payment_id !== null,
  );

  const emptyResult: LinkedDocumentsIndex = {
    byExpenseId: {},
    byFinancingPaymentId: {},
  };

  if (rows.length === 0) {
    return emptyResult;
  }

  const paths = rows.map(
    (document) => document.storage_path,
  );

  const {
    data: signedFiles,
    error: signedUrlsError,
  } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrls(paths, 600);

  if (signedUrlsError) {
    throw new Error(
      `Não foi possível gerar os links temporários: ${signedUrlsError.message}`,
    );
  }

  const signedUrlByPath = new Map(
    (signedFiles ?? []).map((file) => [
      file.path,
      file.signedUrl,
    ]),
  );

  const result: LinkedDocumentsIndex = {
    byExpenseId: {},
    byFinancingPaymentId: {},
  };

  for (const row of rows) {
    if (!isDocumentType(row.document_type)) {
      continue;
    }

    const signedUrl = signedUrlByPath.get(
      row.storage_path,
    );

    if (!signedUrl) {
      continue;
    }

    const document: LinkedDocument = {
      id: row.id,
      title: row.title,
      documentType: row.document_type,
      originalFileName:
        row.original_file_name,
      mimeType: row.mime_type,
      referenceDate: row.reference_date,
      isImportant: row.is_important,
      signedUrl,
    };

    if (row.expense_id) {
      addDocumentToIndex(
        result.byExpenseId,
        row.expense_id,
        document,
      );
    }

    if (row.financing_payment_id) {
      addDocumentToIndex(
        result.byFinancingPaymentId,
        row.financing_payment_id,
        document,
      );
    }
  }

  return result;
}