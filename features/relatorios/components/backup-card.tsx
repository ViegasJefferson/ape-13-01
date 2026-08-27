"use client";

import {
  useState,
} from "react";

import {
  DatabaseBackup,
  Download,
  FileJson2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

interface BackupErrorResponse {
  status?: string;
  message?: string;
}

function getFilename(
  contentDisposition:
    string | null,
) {
  if (!contentDisposition) {
    return null;
  }

  const match =
    contentDisposition.match(
      /filename="([^"]+)"/i,
    );

  return match?.[1] ?? null;
}

export function BackupCard() {
  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<
    string | null
  >(null);

  async function handleBackup() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDownloading(true);

    try {
      const response =
        await fetch(
          "/api/backup",
          {
            method: "GET",
            cache: "no-store",
          },
        );

      if (!response.ok) {
        let errorData:
          BackupErrorResponse | null =
          null;

        try {
          errorData =
            (await response.json()) as
              BackupErrorResponse;
        } catch {
          // Resposta sem JSON.
        }

        throw new Error(
          errorData?.message ??
            "Não foi possível gerar o backup.",
        );
      }

      const blob =
        await response.blob();

      const filename =
        getFilename(
          response.headers.get(
            "content-disposition",
          ),
        ) ??
        `ape-13-01-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;

      const url =
        URL.createObjectURL(
          blob,
        );

      const link =
        document.createElement(
          "a",
        );

      link.href = url;
      link.download =
        filename;

      document.body.appendChild(
        link,
      );

      link.click();

      link.remove();

      URL.revokeObjectURL(
        url,
      );

      setSuccessMessage(
        "Backup gerado com sucesso.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o backup.",
      );
    } finally {
      setIsDownloading(
        false,
      );
    }
  }

  return (
    <Card className="rounded-2xl border-emerald-200 shadow-sm">
      <CardHeader>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <DatabaseBackup className="size-5" />
            </div>

            <div>
              <CardTitle>
                Backup do apartamento
              </CardTitle>

              <CardDescription className="mt-2 max-w-2xl leading-6">
                Gere uma cópia estruturada
                dos dados do apartamento
                para armazenamento seguro e
                futura recuperação.
              </CardDescription>
            </div>
          </div>

          <Button
            type="button"
            onClick={
              handleBackup
            }
            disabled={
              isDownloading
            }
            className="shrink-0 bg-emerald-950 hover:bg-emerald-900"
          >
            {isDownloading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />

                Gerando backup
              </>
            ) : (
              <>
                <Download className="size-4" />

                Baixar backup
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
            <FileJson2 className="mt-0.5 size-5 shrink-0 text-slate-600" />

            <div>
              <p className="text-sm font-medium">
                Dados estruturados
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Gastos, financiamento,
                amortizações, obra,
                reforma, enxoval,
                documentos, agenda e seus
                relacionamentos.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-slate-600" />

            <div>
              <p className="text-sm font-medium">
                Sem credenciais
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Senhas, tokens e chaves do
                Supabase não fazem parte do
                arquivo de backup.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-950">
            Arquivos físicos
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            O JSON registra os metadados e
            caminhos das imagens e
            documentos, mas não incorpora
            os arquivos físicos armazenados
            no Supabase Storage.
          </p>
        </div>

        {successMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}