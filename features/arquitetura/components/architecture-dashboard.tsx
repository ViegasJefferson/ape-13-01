"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import Link from "next/link";

import {
  CheckCircle2,
  Clock3,
  Eye,
  Images,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  MetricCard,
} from "@/components/dashboard/metric-card";

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
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

import {
  Input,
} from "@/components/ui/Input";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteArchitectureItem,
} from "@/features/arquitetura/actions/architecture-actions";

import {
  ArchitectureItemDialog,
} from "@/features/arquitetura/components/architecture-item-dialog";

import type {
  ArchitectureItem,
  ArchitectureItemType,
  ArchitecturePageData,
  ArchitectureStatus,
} from "@/features/arquitetura/types";

interface ArchitectureDashboardProps {
  data: ArchitecturePageData;
}

const typeLabels: Record<
  ArchitectureItemType,
  string
> = {
  deliverable: "Entrega",
  version: "Versão",
  decision: "Decisão",
  meeting: "Reunião",
  task: "Pendência",
};

const statusLabels: Record<
  ArchitectureStatus,
  string
> = {
  planned: "Planejado",
  in_progress: "Em andamento",
  review: "Em revisão",
  approved: "Aprovado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const [
    year,
    month,
    day,
  ] = value
    .slice(0, 10)
    .split("-");

  return `${day}/${month}/${year}`;
}

export function ArchitectureDashboard({
  data,
}: ArchitectureDashboardProps) {
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
    status,
    setStatus,
  ] = useState<
    ArchitectureStatus | "all"
  >("all");

  const [
    room,
    setRoom,
  ] = useState("all");

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
            status !== "all" &&
            item.status !== status
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

          return [
            item.title,
            item.room,
            item.professionalName,
            item.description,
            item.notes,
            item.versionLabel,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR",
            )
            .includes(
              normalizedSearch,
            );
        },
      );
    }, [
      data.items,
      room,
      search,
      status,
    ]);

  function handleDelete(
    item: ArchitectureItem,
  ) {
    const confirmed =
      window.confirm(
        `Excluir "${item.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    startTransition(
      async () => {
        const result =
          await deleteArchitectureItem(
            item.id,
            data.apartmentId,
          );

        if (
          result.status ===
          "error"
        ) {
          window.alert(
            result.message,
          );

          return;
        }

        router.refresh();
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <MetricCard
          title="Registros"
          value={String(
            data.totalItems,
          )}
          description="Itens do projeto de arquitetura."
          icon={Eye}
        />

        <MetricCard
          title="Pendentes"
          value={String(
            data.pendingItems,
          )}
          description="Itens ainda em andamento."
          icon={Clock3}
        />

        <MetricCard
          title="Em revisão"
          value={String(
            data.reviewItems,
          )}
          description="Projetos aguardando análise."
          icon={TriangleAlert}
        />

        <MetricCard
          title="Aprovados"
          value={String(
            data.approvedItems,
          )}
          description={`${data.overdueItems} item(ns) com prazo vencido.`}
          icon={CheckCircle2}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <CardTitle>
              Projeto de arquitetura
            </CardTitle>

            <p className="mt-2 text-sm text-slate-500">
              Controle entregas,
              revisões, decisões e
              pendências por ambiente.
            </p>
          </div>

          {data.canEdit && (
            <ArchitectureItemDialog
              apartmentId={
                data.apartmentId
              }
            />
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                className="pl-9"
                placeholder="Pesquisar Arquitetura"
              />
            </div>

            <NativeSelect
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as
                    | ArchitectureStatus
                    | "all",
                )
              }
            >
              <NativeSelectOption value="all">
                Todos os status
              </NativeSelectOption>

              {Object.entries(
                statusLabels,
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <NativeSelectOption
                    key={value}
                    value={value}
                  >
                    {label}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>

            <NativeSelect
              value={room}
              onChange={(event) =>
                setRoom(
                  event.target.value,
                )
              }
            >
              <NativeSelectOption value="all">
                Todos os ambientes
              </NativeSelectOption>

              {data.rooms.map(
                (roomName) => (
                  <NativeSelectOption
                    key={roomName}
                    value={roomName}
                  >
                    {roomName}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </div>

          <div className="max-w-full overflow-x-auto rounded-xl border">
            <Table className="min-w-300">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Item
                  </TableHead>

                  <TableHead>
                    Ambiente
                  </TableHead>

                  <TableHead>
                    Tipo
                  </TableHead>

                  <TableHead>
                    Versão
                  </TableHead>

                  <TableHead>
                    Prazo
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Prioridade
                  </TableHead>

                  <TableHead className="text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredItems.length ===
                0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-slate-500"
                    >
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(
                    (item) => (
                      <TableRow
                        key={item.id}
                        id={`arquitetura-${item.id}`}
                        className="scroll-mt-24"
                      >
                        <TableCell className="max-w-80 whitespace-normal">
                          <p className="font-medium">
                            {item.title}
                          </p>

                          {item.professionalName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.professionalName}
                            </p>
                          )}
                        </TableCell>

                        <TableCell>
                          {item.room ??
                            "—"}
                        </TableCell>

                        <TableCell>
                          {
                            typeLabels[
                              item.itemType
                            ]
                          }
                        </TableCell>

                        <TableCell>
                          {item.versionLabel ??
                            "—"}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {formatDate(
                            item.targetDate,
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge variant="secondary">
                            {
                              statusLabels[
                                item.status
                              ]
                            }
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {item.priority ===
                          "high"
                            ? "Alta"
                            : item.priority ===
                                "medium"
                              ? "Média"
                              : "Baixa"}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/galeria?sourceType=architecture_item&sourceId=${item.id}`}
                              className={buttonVariants({
                                variant:
                                  "outline",
                                size: "sm",
                              })}
                            >
                              <Images className="size-4" />

                              Imagens
                            </Link>

                            {data.canEdit && (
                              <>
                                <ArchitectureItemDialog
                                  apartmentId={
                                    data.apartmentId
                                  }
                                  item={item}
                                />

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  disabled={
                                    isPending
                                  }
                                  aria-label={`Excluir ${item.title}`}
                                  onClick={() =>
                                    handleDelete(
                                      item,
                                    )
                                  }
                                >
                                  <Trash2 className="size-4 text-red-700" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}