"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  FileUp,
  LoaderCircle,
  Paperclip,
} from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ApartmentDocumentType,
  DocumentExpenseOption,
  DocumentPaymentOption,
} from "@/features/documentos/types";
import { createClient } from "@/lib/supabase/client";

const BUCKET_ID = "apartment-documents";

const MAX_FILE_SIZE =
  6 * 1024 * 1024;

const MAX_FILES = 5;

type DocumentLinkType =
  | "none"
  | "expense"
  | "payment";

interface DefaultDocumentLink {
  type: "expense" | "payment";
  id: string;
}

interface DocumentUploadDialogProps {
  apartmentId: string;

  expenseOptions: DocumentExpenseOption[];
  paymentOptions: DocumentPaymentOption[];

  defaultLink?: DefaultDocumentLink;
  lockLink?: boolean;

  triggerLabel?: string;
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

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const extensionByMimeType: Record<
  string,
  string
> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    "xlsx",
};

function removeFileExtension(
  fileName: string,
) {
  return fileName.replace(
    /\.[^/.]+$/,
    "",
  );
}

function formatDatabaseDate(
  date: string,
) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    new Date(year, month - 1, day),
  );
}

function validateFiles(files: File[]) {
  if (files.length === 0) {
    return "Selecione pelo menos um arquivo.";
  }

  if (files.length > MAX_FILES) {
    return `Selecione no máximo ${MAX_FILES} arquivos por vez.`;
  }

  const invalidType = files.find(
    (file) =>
      !allowedMimeTypes.has(file.type),
  );

  if (invalidType) {
    return `O formato do arquivo ${invalidType.name} não é permitido.`;
  }

  const oversizedFile = files.find(
    (file) =>
      file.size > MAX_FILE_SIZE,
  );

  if (oversizedFile) {
    return `O arquivo ${oversizedFile.name} ultrapassa 6 MB.`;
  }

  return null;
}

export function DocumentUploadDialog({
  apartmentId,
  expenseOptions,
  paymentOptions,
  defaultLink,
  lockLink = false,
  triggerLabel = "Adicionar documento",
}: DocumentUploadDialogProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const initialLinkType: DocumentLinkType =
    defaultLink?.type ?? "none";

  const isLockedLink =
    lockLink && defaultLink !== undefined;

  const [open, setOpen] =
    useState(false);

  const [linkType, setLinkType] =
    useState<DocumentLinkType>(
      initialLinkType,
    );

  const [isUploading, setIsUploading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success",
    );

  const defaultDocumentType:
    ApartmentDocumentType =
    defaultLink?.type === "expense"
      ? "expense"
      : defaultLink?.type === "payment"
        ? "financing"
        : "other";

  const lockedLinkLabel = useMemo(() => {
    if (!defaultLink) {
      return "Nenhum vínculo selecionado";
    }

    if (
      defaultLink.type === "expense"
    ) {
      const expense =
        expenseOptions.find(
          (item) =>
            item.id === defaultLink.id,
        );

      if (!expense) {
        return "Gasto não encontrado";
      }

      return `${expense.title} — ${formatDatabaseDate(
        expense.dueDate,
      )}`;
    }

    const payment =
      paymentOptions.find(
        (item) =>
          item.id === defaultLink.id,
      );

    if (!payment) {
      return "Parcela não encontrada";
    }

    return `Parcela ${
      payment.installmentNumber
    } — ${formatDatabaseDate(
      payment.dueDate,
    )}`;
  }, [
    defaultLink,
    expenseOptions,
    paymentOptions,
  ]);

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    setOpen(nextOpen);
    setMessage(null);

    if (nextOpen) {
      setLinkType(
        defaultLink?.type ?? "none",
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);

    const form = event.currentTarget;

    const formData =
      new FormData(form);

    const files = Array.from(
      fileInputRef.current?.files ?? [],
    );

    const validationMessage =
      validateFiles(files);

    if (validationMessage) {
      setMessageType("error");
      setMessage(validationMessage);
      return;
    }

    const documentType = String(
      formData.get("documentType"),
    ) as ApartmentDocumentType;

    const customTitle = String(
      formData.get("title") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const issuerName = String(
      formData.get("issuerName") ?? "",
    ).trim();

    const referenceDateValue = String(
      formData.get("referenceDate") ?? "",
    );

    const referenceDate =
      referenceDateValue || null;

    const isImportant =
      formData.get("isImportant") === "on";

    if (
      !validDocumentTypes.includes(
        documentType,
      )
    ) {
      setMessageType("error");

      setMessage(
        "Selecione um tipo de documento válido.",
      );

      return;
    }

    const effectiveLinkType:
      DocumentLinkType =
      isLockedLink && defaultLink
        ? defaultLink.type
        : linkType;

    const linkedId =
      isLockedLink && defaultLink
        ? defaultLink.id
        : String(
            formData.get("linkedId") ??
              "",
          );

    let expenseId: string | null = null;

    let financingPaymentId:
      | string
      | null = null;

    if (
      effectiveLinkType === "expense"
    ) {
      const validExpense =
        expenseOptions.some(
          (expense) =>
            expense.id === linkedId,
        );

      if (!validExpense) {
        setMessageType("error");

        setMessage(
          "Selecione um gasto válido para o vínculo.",
        );

        return;
      }

      expenseId = linkedId;
    }

    if (
      effectiveLinkType === "payment"
    ) {
      const validPayment =
        paymentOptions.some(
          (payment) =>
            payment.id === linkedId,
        );

      if (!validPayment) {
        setMessageType("error");

        setMessage(
          "Selecione uma parcela válida para o vínculo.",
        );

        return;
      }

      financingPaymentId = linkedId;
    }

    setIsUploading(true);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (
      userError ||
      !userData.user
    ) {
      setMessageType("error");

      setMessage(
        "Sua sessão expirou. Entre novamente.",
      );

      setIsUploading(false);

      return;
    }

    const now = new Date();

    const year = String(
      now.getFullYear(),
    );

    const month = String(
      now.getMonth() + 1,
    ).padStart(2, "0");

    let uploadedCount = 0;

    try {
      for (const file of files) {
        const extension =
          extensionByMimeType[
            file.type
          ];

        const storagePath = [
          apartmentId,
          documentType,
          year,
          month,
          `${crypto.randomUUID()}.${extension}`,
        ].join("/");

        const {
          error: uploadError,
        } = await supabase.storage
          .from(BUCKET_ID)
          .upload(
            storagePath,
            file,
            {
              contentType: file.type,
              cacheControl: "3600",
              upsert: false,
            },
          );

        if (uploadError) {
          throw new Error(
            `Falha ao enviar ${file.name}: ${uploadError.message}`,
          );
        }

        const title =
          files.length === 1 &&
          customTitle
            ? customTitle
            : removeFileExtension(
                file.name,
              );

        const {
          error: metadataError,
        } = await supabase
          .from(
            "apartment_documents",
          )
          .insert({
            apartment_id:
              apartmentId,

            document_type:
              documentType,

            title,

            description:
              description || null,

            issuer_name:
              issuerName || null,

            reference_date:
              referenceDate,

            is_important:
              isImportant,

            expense_id:
              expenseId,

            financing_payment_id:
              financingPaymentId,

            bucket_id:
              BUCKET_ID,

            storage_path:
              storagePath,

            original_file_name:
              file.name,

            mime_type:
              file.type,

            size_bytes:
              file.size,

            created_by:
              userData.user.id,
          });

        if (metadataError) {
          await supabase.storage
            .from(BUCKET_ID)
            .remove([
              storagePath,
            ]);

          throw new Error(
            `Falha ao registrar ${file.name}: ${metadataError.message}`,
          );
        }

        uploadedCount += 1;
      }

      form.reset();

      setLinkType(
        defaultLink?.type ?? "none",
      );

      setMessageType("success");

      setMessage(
        `${uploadedCount} documento(s) adicionado(s).`,
      );

      router.refresh();

      setTimeout(() => {
        setOpen(false);
        setMessage(null);
      }, 900);
    } catch (error) {
      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar os documentos.",
      );

      if (uploadedCount > 0) {
        router.refresh();
      }
    } finally {
      setIsUploading(false);
    }
  }

  const directAttachment =
    isLockedLink;

  const TriggerIcon =
    directAttachment
      ? Paperclip
      : FileUp;

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger
        className={
          directAttachment
            ? buttonVariants({
                variant:
                  "outline",
                size: "sm",
              })
            : "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900"
        }
      >
        <TriggerIcon className="size-4" />

        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {directAttachment
              ? "Anexar documento"
              : "Adicionar documento"}
          </DialogTitle>

          <DialogDescription>
            Envie até cinco arquivos,
            com no máximo 6 MB cada.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="documentFiles">
              Arquivos
            </Label>

            <Input
              ref={fileInputRef}
              id="documentFiles"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              multiple
              required
            />

            <p className="text-xs text-slate-500">
              PDF, imagens, Word ou Excel.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">
                Tipo
              </Label>

              <NativeSelect
                id="documentType"
                name="documentType"
                defaultValue={
                  defaultDocumentType
                }
                required
              >
                <NativeSelectOption value="purchase_contract">
                  Contrato de compra
                </NativeSelectOption>

                <NativeSelectOption value="financing">
                  Financiamento
                </NativeSelectOption>

                <NativeSelectOption value="construction">
                  Obra e construtora
                </NativeSelectOption>

                <NativeSelectOption value="expense">
                  Boleto ou despesa
                </NativeSelectOption>

                <NativeSelectOption value="receipt">
                  Comprovante
                </NativeSelectOption>

                <NativeSelectOption value="property">
                  Documento do imóvel
                </NativeSelectOption>

                <NativeSelectOption value="tax">
                  Imposto ou registro
                </NativeSelectOption>

                <NativeSelectOption value="insurance">
                  Seguro
                </NativeSelectOption>

                <NativeSelectOption value="renovation">
                  Reforma
                </NativeSelectOption>

                <NativeSelectOption value="other">
                  Outro
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceDate">
                Data de referência
              </Label>

              <Input
                id="referenceDate"
                name="referenceDate"
                type="date"
              />
            </div>

            {isLockedLink &&
            defaultLink ? (
              <>
                <div className="space-y-2">
                  <Label>
                    Tipo de vínculo
                  </Label>

                  <div className="flex min-h-9 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-600">
                    {defaultLink.type ===
                    "expense"
                      ? "Gasto"
                      : "Parcela do financiamento"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Lançamento relacionado
                  </Label>

                  <input
                    type="hidden"
                    name="linkedId"
                    value={
                      defaultLink.id
                    }
                  />

                  <div className="flex min-h-9 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-600">
                    {lockedLinkLabel}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="documentLinkType">
                    Vincular documento
                  </Label>

                  <NativeSelect
                    id="documentLinkType"
                    value={linkType}
                    onChange={(event) =>
                      setLinkType(
                        event.target
                          .value as DocumentLinkType,
                      )
                    }
                  >
                    <NativeSelectOption value="none">
                      Sem vínculo específico
                    </NativeSelectOption>

                    <NativeSelectOption
                      value="expense"
                      disabled={
                        expenseOptions.length ===
                        0
                      }
                    >
                      Vincular a um gasto
                    </NativeSelectOption>

                    <NativeSelectOption
                      value="payment"
                      disabled={
                        paymentOptions.length ===
                        0
                      }
                    >
                      Vincular a uma parcela
                    </NativeSelectOption>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentLinkedId">
                    Lançamento relacionado
                  </Label>

                  {linkType === "none" && (
                    <div className="flex min-h-9 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-500">
                      Nenhum vínculo selecionado
                    </div>
                  )}

                  {linkType ===
                    "expense" && (
                    <NativeSelect
                      key="expense-link"
                      id="documentLinkedId"
                      name="linkedId"
                      defaultValue=""
                      required
                    >
                      <NativeSelectOption
                        value=""
                        disabled
                      >
                        Selecione o gasto
                      </NativeSelectOption>

                      {expenseOptions.map(
                        (expense) => (
                          <NativeSelectOption
                            key={
                              expense.id
                            }
                            value={
                              expense.id
                            }
                          >
                            {
                              expense.title
                            }{" "}
                            —{" "}
                            {formatDatabaseDate(
                              expense.dueDate,
                            )}
                          </NativeSelectOption>
                        ),
                      )}
                    </NativeSelect>
                  )}

                  {linkType ===
                    "payment" && (
                    <NativeSelect
                      key="payment-link"
                      id="documentLinkedId"
                      name="linkedId"
                      defaultValue=""
                      required
                    >
                      <NativeSelectOption
                        value=""
                        disabled
                      >
                        Selecione a parcela
                      </NativeSelectOption>

                      {paymentOptions.map(
                        (payment) => (
                          <NativeSelectOption
                            key={
                              payment.id
                            }
                            value={
                              payment.id
                            }
                          >
                            Parcela{" "}
                            {
                              payment.installmentNumber
                            }{" "}
                            —{" "}
                            {formatDatabaseDate(
                              payment.dueDate,
                            )}
                          </NativeSelectOption>
                        ),
                      )}
                    </NativeSelect>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="documentTitle">
                Título
              </Label>

              <Input
                id="documentTitle"
                name="title"
                maxLength={150}
                placeholder="Opcional para envio de um arquivo"
              />

              <p className="text-xs text-slate-500">
                Em envios múltiplos, será
                usado o nome de cada arquivo.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="issuerName">
                Emissor ou origem
              </Label>

              <Input
                id="issuerName"
                name="issuerName"
                maxLength={150}
                placeholder="Ex.: Caixa Econômica ou construtora"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="documentDescription">
                Descrição
              </Label>

              <Textarea
                id="documentDescription"
                name="description"
                maxLength={1000}
                placeholder="Informações adicionais sobre o documento."
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border p-4">
            <input
              type="checkbox"
              name="isImportant"
              className="mt-1 size-4"
            />

            <span>
              <span className="block text-sm font-medium">
                Documento importante
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Documentos importantes
                aparecem primeiro na lista.
              </span>
            </span>
          </label>

          {message && (
            <div
              role="alert"
              className={
                messageType === "error"
                  ? "rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  : "rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              }
            >
              {message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() =>
                setOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isUploading}
              className="bg-emerald-950 hover:bg-emerald-900"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Enviando
                </>
              ) : (
                "Adicionar documentos"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}