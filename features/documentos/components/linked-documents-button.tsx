"use client";

import {
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  buttonVariants,
} from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  ApartmentDocumentType,
  LinkedDocument,
} from "@/features/documentos/types";

interface LinkedDocumentsButtonProps {
  documents: LinkedDocument[];
  title?: string;
}

const documentTypeLabels: Record<
  ApartmentDocumentType,
  string
> = {
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

function parseDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(parseDatabaseDate(date));
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return FileImage;
  }

  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel")
  ) {
    return FileSpreadsheet;
  }

  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word")
  ) {
    return FileText;
  }

  return File;
}

export function LinkedDocumentsButton({
  documents,
  title = "Documentos vinculados",
}: LinkedDocumentsButtonProps) {
  if (documents.length === 0) {
    return (
      <span className="text-sm text-slate-400">
        —
      </span>
    );
  }

  const buttonLabel =
    documents.length === 1
      ? "1 documento"
      : `${documents.length} documentos`;

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({
          variant: "outline",
          size: "sm",
        })}
      >
        <Paperclip className="size-4" />
        {buttonLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>
            Arquivos privados relacionados a este
            lançamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {documents.map((document) => {
            const Icon = getFileIcon(
              document.mimeType,
            );

            return (
              <article
                key={document.id}
                className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
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
                      {
                        documentTypeLabels[
                          document.documentType
                        ]
                      }
                    </p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="break-all">
                        {document.originalFileName}
                      </span>

                      {document.referenceDate && (
                        <span>
                          {formatDate(
                            document.referenceDate,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

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
              </article>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}