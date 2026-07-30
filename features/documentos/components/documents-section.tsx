"use client";

import { useMemo, useState } from "react";
import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { DocumentUploadDialog } from "@/features/documentos/components/document-upload-dialog";
import type {
  ApartmentDocument,
  ApartmentDocumentType,
  DocumentExpenseOption,
  DocumentPaymentOption,
} from "@/features/documentos/types";
import { createClient } from "@/lib/supabase/client";

interface DocumentsSectionProps {
  apartmentId: string;
  apartmentName: string;
  documents: ApartmentDocument[];
  expenseOptions: DocumentExpenseOption[];
  paymentOptions: DocumentPaymentOption[];
}

const documentTypeLabels: Record<ApartmentDocumentType, string> = {
  purchase_contract: "Contrato de compra",
  financing: "Financiamento",
  construction: "Obra e construtora",
  expense: "Boleto ou despesa",
  receipt: "Comprovante",
  property: "Documento do imóvel",
  tax: "Imposto ou registro",
  insurance: "Seguro",
  renovation: "Reforma",
  other: "Outro",
};

function formatDatabaseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(sizeBytes / 1024, 0.1).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return FileSpreadsheet;
  }

  if (mimeType === "application/pdf" || mimeType.includes("word")) {
    return FileText;
  }

  return File;
}

export function DocumentsSection({
  apartmentId,
  apartmentName,
  documents,
  expenseOptions,
  paymentOptions,
}: DocumentsSectionProps) {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<ApartmentDocumentType | "all">(
    "all",
  );

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return documents.filter((document) => {
      if (typeFilter !== "all" && document.documentType !== typeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableContent = [
        document.title,
        document.originalFileName,
        document.description,
        document.issuerName,
        documentTypeLabels[document.documentType],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableContent.includes(normalizedSearch);
    });
  }, [documents, search, typeFilter]);

  async function deleteDocument(document: ApartmentDocument) {
    const confirmed = window.confirm(
      `Excluir definitivamente "${document.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingId(document.id);

    const { error: storageError } = await supabase.storage
      .from(document.bucketId)
      .remove([document.storagePath]);

    if (storageError) {
      setDeleteError(
        `Não foi possível excluir o arquivo: ${storageError.message}`,
      );

      setDeletingId(null);
      return;
    }

    const { error: metadataError } = await supabase
      .from("apartment_documents")
      .delete()
      .eq("id", document.id)
      .eq("apartment_id", document.apartmentId);

    if (metadataError) {
      setDeleteError(
        `O arquivo foi removido, mas o registro não pôde ser excluído: ${metadataError.message}`,
      );

      setDeletingId(null);
      router.refresh();
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <CardTitle>Arquivos do {apartmentName}</CardTitle>

          <CardDescription className="mt-2">
            Documentos privados disponíveis somente para os membros do
            apartamento.
          </CardDescription>
        </div>

        <DocumentUploadDialog
          apartmentId={apartmentId}
          expenseOptions={expenseOptions}
          paymentOptions={paymentOptions}
        />
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Pesquisar documentos"
            />
          </div>

          <NativeSelect
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as ApartmentDocumentType | "all")
            }
          >
            <NativeSelectOption value="all">Todos os tipos</NativeSelectOption>

            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {deleteError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {deleteError}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
            <FileText className="mb-4 size-10 text-slate-400" />

            <p className="font-medium">Nenhum documento adicionado</p>

            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Adicione contratos, comprovantes, boletos e outros arquivos
              relacionados ao apartamento.
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">Nenhum documento encontrado</p>

            <p className="mt-2 text-sm text-slate-500">
              Altere a busca ou o tipo selecionado.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDocuments.map((document) => {
              const Icon = getFileIcon(document.mimeType);

              return (
                <article
                  key={document.id}
                  className="flex flex-col justify-between gap-5 rounded-2xl border p-5 sm:flex-row sm:items-start"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="wrap-break-word font-medium">
                          {document.title}
                        </p>

                        {document.isImportant && (
                          <Badge className="bg-amber-100 text-amber-900">
                            <Star className="mr-1 size-3" />
                            Importante
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {documentTypeLabels[document.documentType]}
                      </p>

                      {document.expenseTitle && (
                        <Badge variant="outline" className="mt-2">
                          Gasto: {document.expenseTitle}
                        </Badge>
                      )}

                      {document.financingPaymentInstallmentNumber !== null && (
                        <Badge variant="outline" className="mt-2">
                          Parcela {document.financingPaymentInstallmentNumber}
                        </Badge>
                      )}

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>{formatFileSize(document.sizeBytes)}</span>

                        {document.referenceDate && (
                          <span>
                            {formatDatabaseDate(document.referenceDate)}
                          </span>
                        )}

                        {document.issuerName && (
                          <span>{document.issuerName}</span>
                        )}
                      </div>

                      {document.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <a
                      href={document.signedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Abrir
                    </a>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={deletingId === document.id}
                      aria-label={`Excluir ${document.title}`}
                      onClick={() => deleteDocument(document)}
                    >
                      {deletingId === document.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 text-red-700" />
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
