"use client";

import {
  FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
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
import type { ConstructionStage } from "@/features/obra/types";
import { createClient } from "@/lib/supabase/client";

const BUCKET_ID = "construction-media";
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const MAX_FILES = 10;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const extensionByMimeType: Record<
  string,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

interface ConstructionMediaUploadDialogProps {
  apartmentId: string;
  stages: ConstructionStage[];
  defaultReferenceMonth: string;
}

function validateFiles(files: File[]) {
  if (files.length === 0) {
    return "Selecione pelo menos uma imagem.";
  }

  if (files.length > MAX_FILES) {
    return `Envie no máximo ${MAX_FILES} imagens por vez.`;
  }

  const invalidType = files.find(
    (file) =>
      !allowedMimeTypes.has(file.type),
  );

  if (invalidType) {
    return `O arquivo ${invalidType.name} não está em formato JPG, PNG ou WebP.`;
  }

  const oversizedFile = files.find(
    (file) => file.size > MAX_FILE_SIZE,
  );

  if (oversizedFile) {
    return `O arquivo ${oversizedFile.name} ultrapassa o limite de 6 MB.`;
  }

  return null;
}

export function ConstructionMediaUploadDialog({
  apartmentId,
  stages,
  defaultReferenceMonth,
}: ConstructionMediaUploadDialogProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success",
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

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

    const referenceMonth = String(
      formData.get("referenceMonth"),
    );

    const stageIdValue = String(
      formData.get("stageId") ?? "",
    );

    const stageId =
      stageIdValue || null;

    const title = String(
      formData.get("title") ?? "",
    ).trim();

    const description = String(
      formData.get("description") ?? "",
    ).trim();

    const sourceName = String(
      formData.get("sourceName") ?? "",
    ).trim();

    const capturedAtValue = String(
      formData.get("capturedAt") ?? "",
    );

    const capturedAt =
      capturedAtValue || null;

    if (
      !/^\d{4}-\d{2}$/.test(
        referenceMonth,
      )
    ) {
      setMessageType("error");
      setMessage(
        "Informe um mês de referência válido.",
      );
      return;
    }

    setIsUploading(true);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setMessageType("error");
      setMessage(
        "Sua sessão expirou. Entre novamente no sistema.",
      );
      setIsUploading(false);
      return;
    }

    let uploadedCount = 0;

    try {
      for (const file of files) {
        const extension =
          extensionByMimeType[file.type];

        const storagePath = [
          apartmentId,
          referenceMonth,
          `${crypto.randomUUID()}.${extension}`,
        ].join("/");

        const {
          error: uploadError,
        } = await supabase.storage
          .from(BUCKET_ID)
          .upload(storagePath, file, {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Falha ao enviar ${file.name}: ${uploadError.message}`,
          );
        }

        const {
          error: metadataError,
        } = await supabase
          .from("construction_media")
          .insert({
            apartment_id: apartmentId,
            stage_id: stageId,
            reference_month:
              `${referenceMonth}-01`,
            media_type: "image",
            bucket_id: BUCKET_ID,
            storage_path: storagePath,
            original_file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            title: title || null,
            description:
              description || null,
            source_name:
              sourceName || null,
            captured_at: capturedAt,
            created_by: userData.user.id,
          });

        if (metadataError) {
          await supabase.storage
            .from(BUCKET_ID)
            .remove([storagePath]);

          throw new Error(
            `Falha ao registrar ${file.name}: ${metadataError.message}`,
          );
        }

        uploadedCount += 1;
      }

      form.reset();

      setMessageType("success");
      setMessage(
        `${uploadedCount} imagem(ns) adicionada(s) à galeria.`,
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
          : "Não foi possível enviar as imagens.",
      );

      if (uploadedCount > 0) {
        router.refresh();
      }
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900">
        <ImagePlus className="size-4" />
        Adicionar fotos
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Adicionar fotos da obra
          </DialogTitle>

          <DialogDescription>
            Envie até 10 imagens JPG, PNG ou
            WebP, com no máximo 6 MB cada.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="constructionFiles">
              Imagens
            </Label>

            <Input
              ref={fileInputRef}
              id="constructionFiles"
              name="constructionFiles"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />

            <p className="text-xs text-slate-500">
              Você pode selecionar várias fotos
              ao mesmo tempo.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mediaReferenceMonth">
                Mês de referência
              </Label>

              <Input
                id="mediaReferenceMonth"
                name="referenceMonth"
                type="month"
                defaultValue={
                  defaultReferenceMonth
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaStageId">
                Etapa da obra
              </Label>

              <NativeSelect
                id="mediaStageId"
                name="stageId"
                defaultValue=""
              >
                <NativeSelectOption value="">
                  Sem etapa específica
                </NativeSelectOption>

                {stages.map((stage) => (
                  <NativeSelectOption
                    key={stage.id}
                    value={stage.id}
                  >
                    {stage.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mediaTitle">
                Título
              </Label>

              <Input
                id="mediaTitle"
                name="title"
                maxLength={150}
                placeholder="Ex.: evolução da estrutura do bloco"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaSourceName">
                Fonte
              </Label>

              <Input
                id="mediaSourceName"
                name="sourceName"
                defaultValue="Aplicativo da construtora"
                maxLength={150}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mediaCapturedAt">
                Data da imagem
              </Label>

              <Input
                id="mediaCapturedAt"
                name="capturedAt"
                type="date"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mediaDescription">
                Descrição
              </Label>

              <Textarea
                id="mediaDescription"
                name="description"
                maxLength={1000}
                placeholder="Informações sobre as imagens enviadas."
              />
            </div>
          </div>

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
              onClick={() => setOpen(false)}
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
                "Adicionar à galeria"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}