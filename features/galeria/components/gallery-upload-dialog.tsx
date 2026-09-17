"use client";

import {
  type FormEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ImagePlus,
  LoaderCircle,
} from "lucide-react";

import {
  Button,
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

import {
  Input,
} from "@/components/ui/Input";

import {
  Label,
} from "@/components/ui/label";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  createClient,
} from "@/lib/supabase/client";

import type {
  GallerySourceOption,
} from "@/features/galeria/types";

const BUCKET_ID =
  "apartment-media";

const MAX_FILE_SIZE =
  6 * 1024 * 1024;

const MAX_FILES = 10;

const allowedMimeTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const extensionByMimeType:
  Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

interface GalleryUploadDialogProps {
  apartmentId: string;

  renovationOptions:
    GallerySourceOption[];

  architectureOptions:
    GallerySourceOption[];

  linkedSourceType?:
    string | null;

  linkedSourceId?:
    string | null;
}


function validateFiles(
  files: File[],
) {
  if (
    files.length === 0
  ) {
    return "Selecione pelo menos uma imagem.";
  }

  if (
    files.length >
    MAX_FILES
  ) {
    return `Envie no máximo ${MAX_FILES} imagens por vez.`;
  }

  const invalidType =
    files.find(
      (file) =>
        !allowedMimeTypes.has(
          file.type,
        ),
    );

  if (invalidType) {
    return `O arquivo ${invalidType.name} não está em formato JPG, PNG ou WebP.`;
  }

  const oversizedFile =
    files.find(
      (file) =>
        file.size >
        MAX_FILE_SIZE,
    );

  if (oversizedFile) {
    return `O arquivo ${oversizedFile.name} ultrapassa o limite de 6 MB.`;
  }

  return null;
}

function getLocalDate() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function removeExtension(
  filename: string,
) {
  return filename.replace(
    /\.[^/.]+$/,
    "",
  );
}

export function GalleryUploadDialog({
  apartmentId,
  renovationOptions,
  architectureOptions,
  linkedSourceType = null,
  linkedSourceId = null,
}: GalleryUploadDialogProps) {
  const router =
    useRouter();

  const supabase =
    useMemo(
      () => createClient(),
      [],
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  const [
    messageType,
    setMessageType,
  ] = useState<
    "success" | "error"
  >("success");

  const initialSection =
  linkedSourceType ===
  "renovation_item"
    ? "renovation"
    : linkedSourceType ===
        "architecture_item"
      ? "architecture"
      : "architecture";

  const [
    section,
    setSection,
  ] = useState(
    initialSection,
  );

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage(null);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const files =
      Array.from(
        fileInputRef.current
          ?.files ?? [],
      );

    const validation =
      validateFiles(files);

    if (validation) {
      setMessageType(
        "error",
      );

      setMessage(
        validation,
      );

      return;
    }

    const section =
      String(
        formData.get(
          "section",
        ) ?? "",
      );

    const renovationItemId =
    section === "renovation"
      ? String(
          formData.get(
            "renovationItemId",
          ) ?? "",
        ).trim()
      : "";

    const architectureItemId =
      section === "architecture"
        ? String(
            formData.get(
              "architectureItemId",
            ) ?? "",
          ).trim()
        : "";

    if (
      ![
        "architecture",
        "renovation",
        "inspiration",
        "other",
      ].includes(section)
    ) {
      setMessageType(
        "error",
      );

      setMessage(
        "Selecione um setor válido.",
      );

      return;
    }

    const title =
      String(
        formData.get(
          "title",
        ) ?? "",
      ).trim();

    const description =
      String(
        formData.get(
          "description",
        ) ?? "",
      ).trim();

    const room =
      String(
        formData.get(
          "room",
        ) ?? "",
      ).trim();

    const selectedRenovationItem =
      renovationItemId
        ? renovationOptions.find(
            (item) =>
              item.id ===
              renovationItemId,
          )
        : undefined;

    const selectedArchitectureItem =
      architectureItemId
        ? architectureOptions.find(
            (item) =>
              item.id ===
              architectureItemId,
          )
        : undefined;

    const effectiveRoom =
      room ||
      selectedArchitectureItem
        ?.room ||
      selectedRenovationItem
        ?.room ||
      null;

    const sourceType =
      architectureItemId
        ? "architecture_item"
        : renovationItemId
          ? "renovation_item"
          : null;

    const sourceId =
      architectureItemId ||
      renovationItemId ||
      null;

    const referenceDate =
      String(
        formData.get(
          "referenceDate",
        ) ?? "",
      ) || null;

    const tags =
      String(
        formData.get(
          "tags",
        ) ?? "",
      )
        .split(",")
        .map((tag) =>
          tag.trim(),
        )
        .filter(Boolean)
        .slice(0, 20);

    setIsUploading(true);

    try {
      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          "Sua sessão expirou. Entre novamente.",
        );
      }

      let uploadedCount =
        0;

      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];

        const extension =
          extensionByMimeType[
            file.type
          ];

        const monthFolder =
          (
            referenceDate ??
            getLocalDate()
          ).slice(0, 7);

        const storagePath =
          [
            apartmentId,
            section,
            monthFolder,
            `${crypto.randomUUID()}.${extension}`,
          ].join("/");

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              BUCKET_ID,
            )
            .upload(
              storagePath,
              file,
              {
                contentType:
                  file.type,

                cacheControl:
                  "3600",

                upsert:
                  false,
              },
            );

        if (
          uploadError
        ) {
          throw new Error(
            `Falha ao enviar ${file.name}: ${uploadError.message}`,
          );
        }

        const itemTitle =
          title
            ? files.length ===
              1
              ? title
              : `${title} — ${index + 1}`
            : removeExtension(
                file.name,
              );

        const {
          error:
            metadataError,
        } =
          await supabase
            .from(
              "apartment_media",
            )
            .insert({
              apartment_id:
                apartmentId,

              section,

              title:
                itemTitle,

              description:
                description ||
                null,

              room:
                effectiveRoom,

              tags,

              reference_date:
                referenceDate,

              source_type:
                sourceType,

              source_id:
                sourceId,

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

        if (
          metadataError
        ) {
          await supabase.storage
            .from(
              BUCKET_ID,
            )
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

      setMessageType(
        "success",
      );

      setMessage(
        `${uploadedCount} imagem(ns) adicionada(s) à galeria.`,
      );

      router.refresh();

      setTimeout(() => {
        setOpen(false);
        setMessage(null);
      }, 900);
    } catch (error) {
      setMessageType(
        "error",
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as imagens.",
      );
    } finally {
      setIsUploading(
        false,
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        setOpen
      }
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900">
        <ImagePlus className="size-4" />

        Adicionar imagens
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Adicionar à galeria
          </DialogTitle>

          <DialogDescription>
            Envie imagens de
            arquitetura, reforma,
            inspirações e outros
            registros do apartamento.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="galleryFiles">
              Imagens
            </Label>

            <Input
              ref={
                fileInputRef
              }
              id="galleryFiles"
              name="galleryFiles"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />

            <p className="text-xs leading-5 text-slate-500">
              Até 10 imagens por
              envio, com no máximo
              6 MB cada.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gallerySection">
                Setor
              </Label>

              <NativeSelect
                  id="gallerySection"
                  name="section"
                  value={section}
                  onChange={(event) =>
                    setSection(
                      event.target.value,
                    )
                  }
                  required
                >
                <NativeSelectOption value="architecture">
                  Projeto de arquitetura
                </NativeSelectOption>

                <NativeSelectOption value="renovation">
                  Reforma
                </NativeSelectOption>

                <NativeSelectOption value="inspiration">
                  Inspirações
                </NativeSelectOption>

                <NativeSelectOption value="other">
                  Outros
                </NativeSelectOption>
              </NativeSelect>
            </div>

            {section ===
              "renovation" && (
              <div className="space-y-2">
                <Label htmlFor="galleryRenovationItem">
                  Item da reforma
                </Label>

                <NativeSelect
                  id="galleryRenovationItem"
                  name="renovationItemId"
                  defaultValue={
                  linkedSourceType ===
                    "renovation_item"
                    ? linkedSourceId ??
                      ""
                    : ""
                }
                >
                  <NativeSelectOption value="">
                    Sem vínculo específico
                  </NativeSelectOption>

                  {renovationOptions.map(
                    (item) => (
                      <NativeSelectOption
                        key={item.id}
                        value={item.id}
                      >
                        {item.title}
                        {item.room
                          ? ` — ${item.room}`
                          : ""}
                      </NativeSelectOption>
                    ),
                  )}
                </NativeSelect>

                <p className="text-xs leading-5 text-slate-500">
                  Vincule a imagem a um
                  serviço ou etapa específica
                  da Reforma.
                </p>
              </div>
            )}

            {section ===
              "architecture" && (
              <div className="space-y-2">
                <Label htmlFor="galleryArchitectureItem">
                  Registro de arquitetura
                </Label>

                <NativeSelect
                  id="galleryArchitectureItem"
                  name="architectureItemId"
                  defaultValue={
                    linkedSourceType ===
                      "architecture_item"
                      ? linkedSourceId ??
                        ""
                      : ""
                  }
                >
                  <NativeSelectOption value="">
                    Sem vínculo específico
                  </NativeSelectOption>

                  {architectureOptions.map(
                    (item) => (
                      <NativeSelectOption
                        key={item.id}
                        value={item.id}
                      >
                        {item.title}
                        {item.room
                          ? ` — ${item.room}`
                          : ""}
                      </NativeSelectOption>
                    ),
                  )}
                </NativeSelect>

                <p className="text-xs leading-5 text-slate-500">
                  Vincule a imagem a uma
                  entrega, versão ou decisão
                  específica do projeto.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="galleryReferenceDate">
                Data
              </Label>

              <Input
                id="galleryReferenceDate"
                name="referenceDate"
                type="date"
                defaultValue={
                  getLocalDate()
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="galleryRoom">
                Ambiente
              </Label>

              <Input
                id="galleryRoom"
                name="room"
                maxLength={100}
                placeholder="Ex.: Cozinha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="galleryTags">
                Tags
              </Label>

              <Input
                id="galleryTags"
                name="tags"
                placeholder="marcenaria, iluminação, inspiração"
              />

              <p className="text-xs text-slate-500">
                Separe as tags por
                vírgula.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="galleryTitle">
                Título
              </Label>

              <Input
                id="galleryTitle"
                name="title"
                maxLength={150}
                placeholder="Ex.: Projeto da cozinha"
              />

              <p className="text-xs text-slate-500">
                Se estiver vazio, será
                utilizado o nome do
                arquivo.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="galleryDescription">
                Descrição
              </Label>

              <Textarea
                id="galleryDescription"
                name="description"
                maxLength={1000}
                placeholder="Informações sobre as imagens."
              />
            </div>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm font-medium text-sky-950">
              Obra, Enxoval e Documentos
            </p>

            <p className="mt-1 text-xs leading-5 text-sky-800">
              As imagens desses módulos
              são sincronizadas
              automaticamente. Não
              precisam ser enviadas
              novamente aqui.
            </p>
          </div>

          {message && (
            <div
              role="alert"
              className={
                messageType ===
                "error"
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
              disabled={
                isUploading
              }
              onClick={() =>
                setOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isUploading
              }
              className="bg-emerald-950 hover:bg-emerald-900"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />

                  Enviando
                </>
              ) : (
                <>
                  <ImagePlus className="size-4" />

                  Adicionar à galeria
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}