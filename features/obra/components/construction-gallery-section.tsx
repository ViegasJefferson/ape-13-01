"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConstructionMediaUploadDialog } from "@/features/obra/components/construction-media-upload-dialog";
import type {
  ConstructionMedia,
  ConstructionStage,
} from "@/features/obra/types";
import { createClient } from "@/lib/supabase/client";

interface ConstructionGallerySectionProps {
  apartmentId: string;
  stages: ConstructionStage[];
  media: ConstructionMedia[];
  defaultReferenceMonth: string;
}

function parseDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(parseDatabaseDate(date));
}

function formatFullDate(date: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(parseDatabaseDate(date));
}

export function ConstructionGallerySection({
  apartmentId,
  stages,
  media,
  defaultReferenceMonth,
}: ConstructionGallerySectionProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [selectedMedia, setSelectedMedia] =
    useState<ConstructionMedia | null>(
      null,
    );

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);

  const groupedMedia = useMemo(() => {
    const groups = new Map<
      string,
      ConstructionMedia[]
    >();

    for (const item of media) {
      const current =
        groups.get(item.referenceMonth) ??
        [];

      current.push(item);

      groups.set(
        item.referenceMonth,
        current,
      );
    }

    return Array.from(groups.entries());
  }, [media]);

  async function deleteMedia(
    item: ConstructionMedia,
  ) {
    const confirmed = window.confirm(
      "Excluir esta imagem definitivamente?",
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setDeletingId(item.id);

    const {
      error: storageError,
    } = await supabase.storage
      .from(item.bucketId)
      .remove([item.storagePath]);

    if (storageError) {
      setDeleteError(
        `Não foi possível excluir o arquivo: ${storageError.message}`,
      );

      setDeletingId(null);
      return;
    }

    const {
      error: metadataError,
    } = await supabase
      .from("construction_media")
      .delete()
      .eq("id", item.id)
      .eq(
        "apartment_id",
        item.apartmentId,
      );

    if (metadataError) {
      setDeleteError(
        `O arquivo foi removido, mas houve erro ao excluir o registro: ${metadataError.message}`,
      );

      setDeletingId(null);
      router.refresh();
      return;
    }

    setSelectedMedia(null);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <>
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
              <Camera className="size-5" />
            </div>

            <CardTitle>
              Galeria da obra
            </CardTitle>

            <CardDescription className="mt-2">
              Imagens organizadas por mês e
              etapa da construção.
            </CardDescription>
          </div>

          <ConstructionMediaUploadDialog
            apartmentId={apartmentId}
            stages={stages}
            defaultReferenceMonth={
              defaultReferenceMonth
            }
          />
        </CardHeader>

        <CardContent>
          {deleteError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {deleteError}
            </div>
          )}

          {media.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
              <Camera className="mb-4 size-10 text-slate-400" />

              <p className="font-medium">
                Nenhuma imagem adicionada
              </p>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Adicione as imagens recebidas da
                construtora para formar o
                histórico visual da obra.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedMedia.map(
                ([referenceMonth, items]) => (
                  <section
                    key={referenceMonth}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="size-4 text-emerald-800" />

                      <h3 className="font-medium capitalize">
                        {formatMonthYear(
                          referenceMonth,
                        )}
                      </h3>

                      <Badge variant="secondary">
                        {items.length}{" "}
                        {items.length === 1
                          ? "imagem"
                          : "imagens"}
                      </Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((item) => (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-2xl border bg-white"
                        >
                          <button
                            type="button"
                            className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"
                            onClick={() =>
                              setSelectedMedia(
                                item,
                              )
                            }
                          >
                            <img
                              src={item.signedUrl}
                              alt={
                                item.title ||
                                item.description ||
                                "Imagem da evolução da obra"
                              }
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                            />
                          </button>

                          <div className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium">
                                  {item.title ||
                                    item.stageName ||
                                    "Evolução da obra"}
                                </p>

                                {item.stageName && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.stageName}
                                  </p>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={
                                  deletingId ===
                                  item.id
                                }
                                aria-label="Excluir imagem"
                                onClick={() =>
                                  deleteMedia(item)
                                }
                              >
                                {deletingId ===
                                item.id ? (
                                  <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4 text-red-700" />
                                )}
                              </Button>
                            </div>

                            {item.description && (
                              <p className="line-clamp-2 text-sm text-slate-500">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedMedia)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMedia(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          {selectedMedia && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedMedia.title ||
                    selectedMedia.stageName ||
                    "Imagem da obra"}
                </DialogTitle>

                <DialogDescription className="capitalize">
                  {formatMonthYear(
                    selectedMedia.referenceMonth,
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={selectedMedia.signedUrl}
                  alt={
                    selectedMedia.title ||
                    selectedMedia.description ||
                    "Imagem ampliada da obra"
                  }
                  className="max-h-[65vh] w-full object-contain"
                />
              </div>

              <div className="space-y-2 text-sm">
                {selectedMedia.stageName && (
                  <p>
                    <strong>Etapa:</strong>{" "}
                    {selectedMedia.stageName}
                  </p>
                )}

                {selectedMedia.sourceName && (
                  <p>
                    <strong>Fonte:</strong>{" "}
                    {selectedMedia.sourceName}
                  </p>
                )}

                {selectedMedia.capturedAt && (
                  <p>
                    <strong>Data:</strong>{" "}
                    {formatFullDate(
                      selectedMedia.capturedAt,
                    )}
                  </p>
                )}

                {selectedMedia.description && (
                  <p className="leading-6 text-slate-600">
                    {selectedMedia.description}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}