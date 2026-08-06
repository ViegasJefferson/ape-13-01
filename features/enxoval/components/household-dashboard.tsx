"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  Gift,
  PackageCheck,
  Search,
  ShoppingBasket,
  Trash2,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteHouseholdItem } from "@/features/enxoval/actions/household-actions";
import { HouseholdItemDialog } from "@/features/enxoval/components/household-item-dialog";
import type {
  HouseholdItemPriority,
  HouseholdListType,
  HouseholdPageData,
} from "@/features/enxoval/types";

interface HouseholdDashboardProps {
  data: HouseholdPageData;
}

type CompletionFilter = "all" | "pending" | "completed";

const priorityLabels: Record<HouseholdItemPriority, string> = {
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

function getPriorityBadge(priority: HouseholdItemPriority) {
  if (priority === "high") {
    return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
  }

  if (priority === "medium") {
    return <Badge className="bg-amber-100 text-amber-900">Média</Badge>;
  }

  return <Badge variant="secondary">Baixa</Badge>;
}

export function HouseholdDashboard({ data }: HouseholdDashboardProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");

  const [listTypeFilter, setListTypeFilter] = useState<
    HouseholdListType | "all"
  >("all");

  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    return data.items.filter((item) => {
      const acquired = item.purchasedQuantity + item.receivedQuantity;

      const completed = acquired >= item.desiredQuantity;

      if (listTypeFilter !== "all" && item.listType !== listTypeFilter) {
        return false;
      }

      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (completionFilter === "completed" && !completed) {
        return false;
      }

      if (completionFilter === "pending" && completed) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.title,
        item.category,
        item.room,
        item.storeName,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return searchableText.includes(normalizedSearch);
    });
  }, [data.items, search, listTypeFilter, categoryFilter, completionFilter]);

  function handleDelete(itemId: string, title: string) {
    const confirmed = window.confirm(`Excluir "${title}" da lista?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);
    setDeletingId(itemId);

    startTransition(async () => {
      const result = await deleteHouseholdItem(itemId, data.apartmentId);

      setFeedback(result.message);
      setDeletingId(null);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Progresso da lista"
          value={formatPercentage(data.progressPercentage)}
          description={`${data.fulfilledUnits} de ${data.desiredUnits} unidades atendidas.`}
          icon={PackageCheck}
        />

        <MetricCard
          title="Orçamento estimado"
          value={formatCurrency(data.estimatedBudget)}
          description="Valor estimado de todos os itens desejados."
          icon={Banknote}
        />

        <MetricCard
          title="Valor gasto"
          value={formatCurrency(data.actualSpent)}
          description="Compras realizadas pelo casal."
          icon={ShoppingBasket}
        />

        <MetricCard
          title="Presentes recebidos"
          value={formatCurrency(data.estimatedGiftValue)}
          description="Valor estimado dos itens recebidos."
          icon={Gift}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <CardTitle>Progresso do enxoval</CardTitle>

              <CardDescription className="mt-1">
                Compras e presentes recebidos em relação às quantidades
                desejadas.
              </CardDescription>
            </div>

            <Badge className="bg-emerald-100 text-emerald-950">
              {data.completedItems} de {data.totalItems} itens completos
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Progress value={data.progressPercentage} className="h-3" />

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-slate-500">Unidades desejadas</p>

              <p className="mt-2 text-xl font-semibold">{data.desiredUnits}</p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-slate-500">Unidades atendidas</p>

              <p className="mt-2 text-xl font-semibold">
                {data.fulfilledUnits}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-sm text-slate-500">Custo pendente estimado</p>

              <p className="mt-2 text-xl font-semibold">
                {formatCurrency(data.estimatedPendingCost)}
              </p>
            </div>
          </div>
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
            <CardTitle>Chá de panela e enxoval</CardTitle>

            <CardDescription className="mt-2">
              Organize itens necessários, compras próprias e presentes
              recebidos.
            </CardDescription>
          </div>

          {data.canEdit && (
            <HouseholdItemDialog apartmentId={data.apartmentId} />
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Pesquisar item"
              />
            </div>

            <NativeSelect
              value={listTypeFilter}
              onChange={(event) =>
                setListTypeFilter(
                  event.target.value as HouseholdListType | "all",
                )
              }
            >
              <NativeSelectOption value="all">
                Todas as listas
              </NativeSelectOption>

              <NativeSelectOption value="trousseau">Enxoval</NativeSelectOption>

              <NativeSelectOption value="housewarming">
                Chá de panela
              </NativeSelectOption>
            </NativeSelect>

            <NativeSelect
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <NativeSelectOption value="all">
                Todas as categorias
              </NativeSelectOption>

              {data.categories.map((category) => (
                <NativeSelectOption key={category} value={category}>
                  {category}
                </NativeSelectOption>
              ))}
            </NativeSelect>

            <NativeSelect
              value={completionFilter}
              onChange={(event) =>
                setCompletionFilter(event.target.value as CompletionFilter)
              }
            >
              <NativeSelectOption value="all">
                Todos os estados
              </NativeSelectOption>

              <NativeSelectOption value="pending">Pendentes</NativeSelectOption>

              <NativeSelectOption value="completed">
                Completos
              </NativeSelectOption>
            </NativeSelect>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <Gift className="mx-auto mb-4 size-10 text-slate-400" />

              <p className="font-medium">Nenhum item encontrado</p>

              <p className="mt-2 text-sm text-slate-500">
                Adicione o primeiro item ou altere os filtros utilizados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table className="min-w-325">
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Lista</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prioridade</TableHead>

                    <TableHead className="text-center">Desejado</TableHead>

                    <TableHead className="text-center">Comprado</TableHead>

                    <TableHead className="text-center">Presente</TableHead>

                    <TableHead>Progresso</TableHead>

                    <TableHead className="text-right">Estimado</TableHead>

                    <TableHead className="text-right">Gasto</TableHead>

                    <TableHead>Produto</TableHead>

                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredItems.map((item) => {
                    const acquired =
                      item.purchasedQuantity + item.receivedQuantity;

                    const progress = Math.min(
                      (acquired / item.desiredQuantity) * 100,
                      100,
                    );

                    const completed = acquired >= item.desiredQuantity;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex min-w-72 items-start gap-3">
                            {item.productImageUrl && (
                              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.productImageUrl}
                                  alt={item.title}
                                  loading="lazy"
                                  className="size-full object-contain"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{item.title}</p>

                                {completed && (
                                  <Badge className="bg-emerald-100 text-emerald-950">
                                    <CheckCircle2 className="mr-1 size-3" />
                                    Completo
                                  </Badge>
                                )}
                              </div>

                              {item.room && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.room}
                                </p>
                              )}

                              {item.storeName && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.storeName}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {item.listType === "trousseau"
                            ? "Enxoval"
                            : "Chá de panela"}
                        </TableCell>

                        <TableCell>{item.category}</TableCell>

                        <TableCell>{getPriorityBadge(item.priority)}</TableCell>

                        <TableCell className="text-center">
                          {item.desiredQuantity}
                        </TableCell>

                        <TableCell className="text-center">
                          {item.purchasedQuantity}
                        </TableCell>

                        <TableCell className="text-center">
                          {item.receivedQuantity}
                        </TableCell>

                        <TableCell>
                          <div className="min-w-32">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                              <span>
                                {acquired}/{item.desiredQuantity}
                              </span>

                              <span>{formatPercentage(progress)}</span>
                            </div>

                            <Progress value={progress} className="h-2" />
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right">
                          {formatCurrency(
                            item.estimatedUnitAmount * item.desiredQuantity,
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right">
                          {formatCurrency(item.actualTotalAmount)}
                        </TableCell>

                        <TableCell>
                          {item.productUrl ? (
                            <a
                              href={item.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                            >
                              <ExternalLink className="size-4" />
                              Abrir
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-right">
                          {data.canEdit ? (
                            <div className="flex justify-end gap-2">
                              <HouseholdItemDialog
                                apartmentId={data.apartmentId}
                                item={item}
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={isPending || deletingId === item.id}
                                aria-label={`Excluir ${item.title}`}
                                onClick={() =>
                                  handleDelete(item.id, item.title)
                                }
                              >
                                <Trash2 className="size-4 text-red-700" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
