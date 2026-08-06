"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Hammer,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteRenovationItem } from "@/features/reforma/actions/renovation-actions";
import { RenovationItemDialog } from "@/features/reforma/components/renovation-item-dialog";
import type {
  RenovationItemPriority,
  RenovationItemStatus,
  RenovationPageData,
} from "@/features/reforma/types";

interface RenovationDashboardProps {
  data: RenovationPageData;
}

const statusLabels: Record<
  RenovationItemStatus,
  string
> = {
  planned: "Planejado",
  quoting: "Em orçamento",
  approved: "Aprovado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const priorityLabels: Record<
  RenovationItemPriority,
  string
> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    new Date(year, month - 1, day),
  );
}

function getStatusBadge(
  status: RenovationItemStatus,
) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-950">
        Concluído
      </Badge>
    );
  }

  if (status === "in_progress") {
    return (
      <Badge className="bg-sky-100 text-sky-900">
        Em andamento
      </Badge>
    );
  }

  if (status === "cancelled") {
    return (
      <Badge className="bg-slate-100 text-slate-600">
        Cancelado
      </Badge>
    );
  }

  if (status === "quoting") {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        Em orçamento
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      {statusLabels[status]}
    </Badge>
  );
}

function getPriorityBadge(
  priority: RenovationItemPriority,
) {
  if (priority === "high") {
    return (
      <Badge className="bg-red-100 text-red-800">
        Alta
      </Badge>
    );
  }

  if (priority === "medium") {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        Média
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      Baixa
    </Badge>
  );
}

export function RenovationDashboard({
  data,
}: RenovationDashboardProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<RenovationItemStatus | "all">(
      "all",
    );

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [feedback, setFeedback] =
    useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("pt-BR");

    return data.items.filter((item) => {
      if (
        statusFilter !== "all" &&
        item.status !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.area,
        item.vendorName,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableText.includes(
        normalizedSearch,
      );
    });
  }, [
    data.items,
    search,
    statusFilter,
  ]);

  function handleDelete(
    itemId: string,
    itemTitle: string,
  ) {
    const confirmed = window.confirm(
      `Excluir "${itemTitle}" do planejamento da reforma?`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingId(itemId);

    startTransition(async () => {
      const result =
        await deleteRenovationItem(
          itemId,
          data.apartmentId,
        );

      setFeedback(result.message);
      setDeletingId(null);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  const isOverBudget =
    data.budgetBalance < 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Orçamento previsto"
          value={formatCurrency(
            data.plannedBudget,
          )}
          description="Soma dos itens ativos planejados."
          icon={Banknote}
        />

        <MetricCard
          title="Valor realizado"
          value={formatCurrency(
            data.actualAmount,
          )}
          description="Valores já informados como realizados."
          icon={CircleDollarSign}
        />

        <MetricCard
          title={
            isOverBudget
              ? "Acima do orçamento"
              : "Saldo do orçamento"
          }
          value={formatCurrency(
            Math.abs(data.budgetBalance),
          )}
          description={
            isOverBudget
              ? "O valor realizado ultrapassou o previsto."
              : "Diferença disponível entre previsto e realizado."
          }
          icon={
            isOverBudget
              ? TriangleAlert
              : Hammer
          }
        />

        <MetricCard
          title="Itens concluídos"
          value={`${data.completedItems} de ${data.totalItems}`}
          description={formatPercentage(
            data.progressPercentage,
          )}
          icon={CheckCircle2}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <CardTitle>
                Progresso da reforma
              </CardTitle>

              <CardDescription className="mt-1">
                Percentual calculado pela quantidade
                de itens concluídos.
              </CardDescription>
            </div>

            <Badge className="bg-emerald-100 text-emerald-950">
              {formatPercentage(
                data.progressPercentage,
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Progress
            value={data.progressPercentage}
            className="h-3"
          />
        </CardContent>
      </Card>

      {feedback && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
          {feedback}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <CardTitle>
              Planejamento da reforma
            </CardTitle>

            <CardDescription className="mt-2">
              Serviços, compras, fornecedores,
              prazos e valores planejados.
            </CardDescription>
          </div>

          {data.canEdit && (
            <RenovationItemDialog
              apartmentId={data.apartmentId}
            />
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="pl-9"
                placeholder="Pesquisar item, ambiente ou fornecedor"
              />
            </div>

            <NativeSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | RenovationItemStatus
                    | "all",
                )
              }
            >
              <NativeSelectOption value="all">
                Todas as situações
              </NativeSelectOption>

              {Object.entries(statusLabels).map(
                ([value, label]) => (
                  <NativeSelectOption
                    key={value}
                    value={value}
                  >
                    {label}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <Hammer className="mx-auto mb-4 size-10 text-slate-400" />

              <p className="font-medium">
                Nenhum item encontrado
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Adicione o primeiro item ou altere
                os filtros utilizados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table className="min-w-275">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Item
                    </TableHead>

                    <TableHead>
                      Ambiente
                    </TableHead>

                    <TableHead>
                      Situação
                    </TableHead>

                    <TableHead>
                      Prioridade
                    </TableHead>

                    <TableHead className="text-right">
                      Previsto
                    </TableHead>

                    <TableHead className="text-right">
                      Realizado
                    </TableHead>

                    <TableHead>
                      Prazo
                    </TableHead>

                    <TableHead className="text-right">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {item.title}
                          </p>

                          {item.vendorName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.vendorName}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {item.area || "—"}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(
                          item.status,
                        )}
                      </TableCell>

                      <TableCell>
                        {getPriorityBadge(
                          item.priority,
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        {formatCurrency(
                          item.plannedAmount,
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        {formatCurrency(
                          item.actualAmount,
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {item.targetDate
                          ? formatDatabaseDate(
                              item.targetDate,
                            )
                          : "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        {data.canEdit ? (
                          <div className="flex justify-end gap-2">
                            <RenovationItemDialog
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
                                isPending ||
                                deletingId ===
                                  item.id
                              }
                              aria-label={`Excluir ${item.title}`}
                              onClick={() =>
                                handleDelete(
                                  item.id,
                                  item.title,
                                )
                              }
                            >
                              <Trash2 className="size-4 text-red-700" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}