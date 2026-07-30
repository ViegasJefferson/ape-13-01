import type {
    ApartmentDocument,
    ApartmentDocumentType,
    DocumentsPageData,
} from "@/features/documentos/types";
import { createClient } from "@/lib/supabase/server";

const DOCUMENTS_BUCKET =
    "apartment-documents";

interface ApartmentRow {
    id: string;
    name: string;
}

interface ApartmentDocumentRow {
    id: string;
    apartment_id: string;
    document_type: string;
    title: string;
    description: string | null;
    issuer_name: string | null;
    reference_date: string | null;
    is_important: boolean;
    bucket_id: string;
    storage_path: string;
    original_file_name: string;
    mime_type: string;
    size_bytes: number | string;
    created_at: string;

    expense_id: string | null;
    financing_payment_id: string | null;

    expense:
    | ExpenseRelationRow
    | ExpenseRelationRow[]
    | null;

    financing_payment:
    | FinancingPaymentRelationRow
    | FinancingPaymentRelationRow[]
    | null;
}

interface ExpenseRelationRow {
    id: string;
    title: string;
    due_date: string;
}

interface FinancingPaymentRelationRow {
    id: string;
    installment_number: number;
    due_date: string;
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
function getSingleRelation<T>(
    relation: T | T[] | null,
): T | null {
    if (Array.isArray(relation)) {
        return relation[0] ?? null;
    }

    return relation;
}

export async function getDocumentsPageData(): Promise<
    DocumentsPageData | null
> {
    const supabase = await createClient();

    const {
        data: apartmentData,
        error: apartmentError,
    } = await supabase
        .from("apartments")
        .select("id, name")
        .order("created_at", {
            ascending: true,
        })
        .limit(1)
        .maybeSingle();

    if (apartmentError) {
        throw new Error(
            `Não foi possível carregar o apartamento: ${apartmentError.message}`,
        );
    }

    if (!apartmentData) {
        return null;
    }

    const apartment =
        apartmentData as ApartmentRow;

    const {
        data: documentsData,
        error: documentsError,
    } = await supabase
        .from("apartment_documents")
        .select(
            `
        id,
        apartment_id,
        document_type,
        title,
        description,
        issuer_name,
        reference_date,
        is_important,
        bucket_id,
        storage_path,
        original_file_name,
        mime_type,
        size_bytes,
        expense_id,
        financing_payment_id,
        created_at,
        expense:expenses (
        id,
        title,
        due_date
        ),
        financing_payment:financing_payments (
        id,
        installment_number,
        due_date
        )
      `,
        )
        .eq("apartment_id", apartment.id)
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
            `Não foi possível carregar os documentos: ${documentsError.message}`,
        );
    }

    const rows =
        (documentsData ??
            []) as ApartmentDocumentRow[];

    if (rows.length === 0) {
        return {
            apartmentId: apartment.id,
            apartmentName: apartment.name,
            documents: [],
        };
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
            `Não foi possível gerar os links dos documentos: ${signedUrlsError.message}`,
        );
    }

    const signedUrlByPath = new Map(
        (signedFiles ?? []).map((file) => [
            file.path,
            file.signedUrl,
        ]),
    );

    const documents: ApartmentDocument[] = rows
        .map((row) => {
            if (!isDocumentType(row.document_type)) {
                throw new Error(
                    `Tipo de documento inválido: ${row.document_type}.`,
                );
            }

            const expense = getSingleRelation(
                row.expense,
            );

            const financingPayment =
                getSingleRelation(
                    row.financing_payment,
                );

            return {
                id: row.id,
                apartmentId: row.apartment_id,
                documentType: row.document_type,
                title: row.title,
                description: row.description,
                issuerName: row.issuer_name,
                referenceDate: row.reference_date,
                isImportant: row.is_important,
                expenseId: row.expense_id,
                expenseTitle: expense?.title ?? null,
                expenseDueDate:
                    expense?.due_date ?? null,

                financingPaymentId:
                    row.financing_payment_id,

                financingPaymentInstallmentNumber:
                    financingPayment
                        ? Number(
                            financingPayment.installment_number,
                        )
                        : null,

                financingPaymentDueDate:
                    financingPayment?.due_date ?? null,
                bucketId: row.bucket_id,
                storagePath: row.storage_path,
                originalFileName:
                    row.original_file_name,
                mimeType: row.mime_type,
                sizeBytes: Number(row.size_bytes),
                createdAt: row.created_at,
                signedUrl:
                    signedUrlByPath.get(
                        row.storage_path,
                    ) ?? "",
            };
        })
        .filter((document) => document.signedUrl);

    return {
        apartmentId: apartment.id,
        apartmentName: apartment.name,
        documents,
    };
}