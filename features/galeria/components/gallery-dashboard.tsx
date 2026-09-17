"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import Link from "next/link";

import {
  Building2,
  ExternalLink,
  FileImage,
  Gift,
  Images,
  Lightbulb,
  Maximize2,
  Palette,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
  buttonVariants,
} from "@/components/ui/Button";

import {
  Card,
  CardContent,
} from "@/components/ui/Card";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Input,
} from "@/components/ui/Input";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import {
  deleteGalleryMedia,
} from "@/features/galeria/actions/gallery-actions";

import {
  GalleryUploadDialog,
} from "@/features/galeria/components/gallery-upload-dialog";

import type {
  GalleryItem,
  GalleryPageData,
  GallerySection,
} from "@/features/galeria/types";

interface GalleryDashboardProps {
  data: GalleryPageData;

  linkedSourceType?:
    string | null;

  linkedSourceId?:
    string | null;
}

type GallerySectionFilter =
  | GallerySection
  | "all";

const sectionLabels:
  Record<
    GallerySection,
    string
  > = {
    construction:
      "Obra",

    architecture:
      "Arquitetura",

    renovation:
      "Reforma",

    household:
      "Chá e enxoval",

    documents:
      "Documentos",

    inspiration:
      "Inspirações",

    other:
      "Outros",
  };

function formatDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const datePart =
    value.slice(0, 10);

  const [
    year,
    month,
    day,
  ] =
    datePart.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function SectionIcon({
  section,
}: {
  section:
    GallerySection;
}) {
  switch (section) {
    case "construction":
      return (
        <Building2 className="size-4" />
      );

    case "architecture":
      return (
        <Palette className="size-4" />
      );

    case "renovation":
      return (
        <Wrench className="size-4" />
      );

    case "household":
      return (
        <Gift className="size-4" />
      );

    case "documents":
      return (
        <FileImage className="size-4" />
      );

    case "inspiration":
      return (
        <Lightbulb className="size-4" />
      );

    default:
      return (
        <Images className="size-4" />
      );
  }
}

export function GalleryDashboard({
  data,
  linkedSourceType = null,
  linkedSourceId = null,
}: GalleryDashboardProps) {
  const router =
    useRouter();

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    section,
    setSection,
  ] =
    useState<GallerySectionFilter>(
      "all",
    );

  const [
    room,
    setRoom,
  ] = useState("all");

  const [
    selectedItem,
    setSelectedItem,
  ] = useState<
    GalleryItem | null
  >(null);

  const [
    feedback,
    setFeedback,
  ] = useState<
    string | null
  >(null);

  const filteredItems =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            "pt-BR",
          );

      return data.items.filter(
        (item) => {

          if (
            linkedSourceType &&
            item.linkedSourceType !==
              linkedSourceType
          ) {
            return false;
          }

          if (
            linkedSourceId &&
            item.linkedSourceId !==
              linkedSourceId
          ) {
            return false;
          }

          if (
            section !==
              "all" &&
            item.section !==
              section
          ) {
            return false;
          }

          if (
            room !== "all" &&
            item.room !== room
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchable =
            [
              item.title,
              item.description,
              item.room,
              item.sourceLabel,
              ...item.tags,
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase(
                "pt-BR",
              );

          return searchable.includes(
            normalizedSearch,
          );
        },
      );
    }, [
      data.items,
      linkedSourceId,
      linkedSourceType,
      room,
      search,
      section,
    ]);

  function handleDelete(
    item: GalleryItem,
  ) {
    if (
      !item.canDeleteHere
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Excluir "${item.title}" da galeria?`,
      );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(
      async () => {
        const result =
          await deleteGalleryMedia(
            item.entityId,
            data.apartmentId,
          );

        setFeedback(
          result.message,
        );

        if (
          result.status ===
          "success"
        ) {
          setSelectedItem(
            null,
          );

          router.refresh();
        }
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Todas as imagens
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {
                data.counts
                  .total
              }
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Obra
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {
                data.counts
                  .construction
              }
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Arquitetura
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {
                data.counts
                  .architecture
              }
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">
              Chá e enxoval
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {
                data.counts
                  .household
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="grid flex-1 gap-3 md:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  className="pl-9"
                  placeholder="Pesquisar imagens"
                />
              </div>

              <NativeSelect
                value={
                  section
                }
                onChange={(
                  event,
                ) =>
                  setSection(
                    event
                      .target
                      .value as GallerySectionFilter,
                  )
                }
              >
                <NativeSelectOption value="all">
                  Todos os setores
                </NativeSelectOption>

                {Object.entries(
                  sectionLabels,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <NativeSelectOption
                      key={
                        value
                      }
                      value={
                        value
                      }
                    >
                      {label}
                    </NativeSelectOption>
                  ),
                )}
              </NativeSelect>

              <NativeSelect
                value={room}
                onChange={(
                  event,
                ) =>
                  setRoom(
                    event
                      .target
                      .value,
                  )
                }
              >
                <NativeSelectOption value="all">
                  Todos os ambientes
                </NativeSelectOption>

                {data.rooms.map(
                  (
                    roomName,
                  ) => (
                    <NativeSelectOption
                      key={
                        roomName
                      }
                      value={
                        roomName
                      }
                    >
                      {
                        roomName
                      }
                    </NativeSelectOption>
                  ),
                )}
              </NativeSelect>
            </div>

            {data.canEdit && (
              <GalleryUploadDialog
                apartmentId={
                  data.apartmentId
                }
                renovationOptions={
                  data.renovationOptions
                }
              />
            )}
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
          {feedback}
        </div>
      )}

      {linkedSourceId && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium text-sky-950">
              Imagens vinculadas
            </p>

            <p className="mt-1 text-sm text-sky-800">
              A Galeria está mostrando
              somente as imagens vinculadas
              ao registro selecionado.
            </p>
          </div>

          <Link
            href="/galeria"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
            })}
          >
            Ver toda a galeria
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Imagens
          </h2>

          <p className="text-sm text-slate-500">
            {
              filteredItems.length
            }{" "}
            resultado(s)
          </p>
        </div>
      </div>

      {filteredItems.length ===
      0 ? (
        <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
          <Images className="mx-auto mb-4 size-10 text-slate-400" />

          <p className="font-medium">
            Nenhuma imagem encontrada
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Altere os filtros ou
            adicione novas imagens.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredItems.map(
            (item) => (
              <button
                key={
                  item.id
                }
                type="button"
                className="group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() =>
                  setSelectedItem(
                    item,
                  )
                }
              >
                <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      item.imageUrl
                    }
                    alt={
                      item.title
                    }
                    loading="lazy"
                    className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />

                  <div className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur">
                    <Maximize2 className="size-4" />
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 whitespace-normal break-words font-medium leading-5">
                      {
                        item.title
                      }
                    </p>

                    <Badge
                      variant="secondary"
                      className="shrink-0"
                    >
                      <SectionIcon
                        section={
                          item.section
                        }
                      />

                      <span className="ml-1">
                        {
                          sectionLabels[
                            item
                              .section
                          ]
                        }
                      </span>
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    {item.room && (
                      <span>
                        {
                          item.room
                        }
                      </span>
                    )}

                    {formatDate(
                      item.referenceDate,
                    ) && (
                      <span>
                        {formatDate(
                          item.referenceDate,
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ),
          )}
        </div>
      )}

      <Dialog
        open={
          Boolean(
            selectedItem,
          )
        }
        onOpenChange={(
          nextOpen,
        ) => {
          if (!nextOpen) {
            setSelectedItem(
              null,
            );
          }
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <SectionIcon
                      section={
                        selectedItem.section
                      }
                    />

                    <span className="ml-1">
                      {
                        sectionLabels[
                          selectedItem
                            .section
                        ]
                      }
                    </span>
                  </Badge>

                  <Badge variant="outline">
                    {
                      selectedItem.sourceLabel
                    }
                  </Badge>
                </div>

                <DialogTitle className="pt-2">
                  {
                    selectedItem.title
                  }
                </DialogTitle>

                <DialogDescription>
                  {selectedItem.room
                    ? `Ambiente: ${selectedItem.room}`
                    : "Registro do apartamento"}
                </DialogDescription>
              </DialogHeader>

              <div className="overflow-hidden rounded-2xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    selectedItem.imageUrl
                  }
                  alt={
                    selectedItem.title
                  }
                  className="mx-auto max-h-[65vh] w-full object-contain"
                />
              </div>

              <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Setor
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      sectionLabels[
                        selectedItem
                          .section
                      ]
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Data
                  </p>

                  <p className="mt-1 text-sm">
                    {formatDate(
                      selectedItem.referenceDate,
                    ) ??
                      "Não informada"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ambiente
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      selectedItem.room ??
                      "Não informado"
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Origem
                  </p>

                  <p className="mt-1 text-sm">
                    {
                      selectedItem.sourceLabel
                    }
                  </p>
                </div>
              </div>

              {selectedItem.description && (
                <div>
                  <p className="text-sm font-medium">
                    Descrição
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {
                      selectedItem.description
                    }
                  </p>
                </div>
              )}

              {selectedItem.tags.length >
                0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map(
                    (tag) => (
                      <Badge
                        key={
                          tag
                        }
                        variant="outline"
                      >
                        {tag}
                      </Badge>
                    ),
                  )}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-3">
                {selectedItem.sourceHref && (
                  <Link
                    href={
                      selectedItem.sourceHref
                    }
                    className={buttonVariants({
                      variant:
                        "outline",
                    })}
                  >
                    <ExternalLink className="size-4" />

                    Abrir origem
                  </Link>
                )}

                {selectedItem.canDeleteHere && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      isPending
                    }
                    className="text-red-700"
                    onClick={() =>
                      handleDelete(
                        selectedItem,
                      )
                    }
                  >
                    <Trash2 className="size-4" />

                    Excluir imagem
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}