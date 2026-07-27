import type { LucideIcon } from "lucide-react";
import {
  BrickWall,
  Building2,
  CalendarDays,
  Camera,
  Hammer,
  Landmark,
  Layers,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ConstructionDashboardData,
  ConstructionStatus,
} from "@/features/obra/types";

interface ConstructionDashboardProps {
  data: ConstructionDashboardData;
}

const statusLabels: Record<
  ConstructionStatus,
  string
> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  paused: "Pausada",
  completed: "Concluída",
};

const stageIcons: Record<
  string,
  LucideIcon
> = {
  fundacao: Landmark,
  estrutura: Building2,
  alvenaria: BrickWall,
  "acabamento-interno": Hammer,
  "revestimento-externo": Layers,
};

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

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 2,
    },
  ).format(value)}%`;
}

function getStatusBadge(
  status: ConstructionStatus,
) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-950">
        Concluída
      </Badge>
    );
  }

  if (status === "paused") {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        Pausada
      </Badge>
    );
  }

  if (status === "not_started") {
    return (
      <Badge variant="secondary">
        Não iniciada
      </Badge>
    );
  }

  return (
    <Badge className="bg-sky-100 text-sky-900">
      Em andamento
    </Badge>
  );
}

export function ConstructionDashboard({
  data,
}: ConstructionDashboardProps) {
  const current = data.currentUpdate;

  if (!current) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <Building2 className="mb-4 size-10 text-slate-400" />

          <p className="font-medium">
            Nenhuma atualização cadastrada
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Registre o primeiro acompanhamento da
            construção.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <CardDescription>
                  Progresso geral
                </CardDescription>

                <CardTitle className="mt-2 text-5xl text-emerald-700">
                  {formatPercentage(
                    current.overallProgress,
                  )}
                </CardTitle>
              </div>

              {getStatusBadge(current.status)}
            </div>
          </CardHeader>

          <CardContent>
            <Progress
              value={current.overallProgress}
              className="h-3"
            />

            <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4" />

                <span>
                  Última atualização:{" "}
                  <strong className="font-medium capitalize text-slate-800">
                    {formatMonthYear(
                      current.referenceMonth,
                    )}
                  </strong>
                </span>
              </div>

              {current.sourceName && (
                <span>
                  Fonte:{" "}
                  <strong className="font-medium text-slate-800">
                    {current.sourceName}
                  </strong>
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardDescription>
              Previsão de entrega
            </CardDescription>

            <CardTitle className="text-3xl">
              {data.deliveryDate
                ? formatMonthYear(
                    data.deliveryDate,
                  )
                : "Não informada"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-slate-500">
              {data.projectName
                ? `${data.projectName} — ${data.apartmentName}`
                : data.apartmentName}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Etapas da obra
          </CardTitle>

          <CardDescription>
            Evolução divulgada pela construtora em{" "}
            {formatMonthYear(
              current.referenceMonth,
            )}.
          </CardDescription>
        </CardHeader>

        <CardContent className="divide-y">
          {data.stages.map((stage) => {
            const Icon =
              stageIcons[stage.slug] ??
              Building2;

            return (
              <div
                key={stage.id}
                className="py-5 first:pt-0 last:pb-0"
              >
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium">
                        {stage.name}
                      </p>

                      {stage.description && (
                        <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="shrink-0 bg-sky-100 text-sky-900"
                  >
                    {formatPercentage(
                      stage.progress,
                    )}
                  </Badge>
                </div>

                <Progress
                  value={stage.progress}
                  className="h-2.5"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Histórico da evolução
          </CardTitle>

          <CardDescription>
            Comparativo mensal do progresso geral
            da construção.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto rounded-xl border">
            <Table className="min-w-190">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    Referência
                  </TableHead>

                  <TableHead className="text-right">
                    Progresso
                  </TableHead>

                  <TableHead className="text-right">
                    Evolução
                  </TableHead>

                  <TableHead>
                    Situação
                  </TableHead>

                  <TableHead>
                    Fonte
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.history.map(
                  (update, index) => {
                    const previous =
                      data.history[index + 1];

                    const variation = previous
                      ? update.overallProgress -
                        previous.overallProgress
                      : null;

                    return (
                      <TableRow key={update.id}>
                        <TableCell className="whitespace-nowrap font-medium capitalize">
                          {formatMonthYear(
                            update.referenceMonth,
                          )}
                        </TableCell>

                        <TableCell className="text-right font-semibold">
                          {formatPercentage(
                            update.overallProgress,
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {variation === null
                            ? "—"
                            : `${
                                variation >= 0
                                  ? "+"
                                  : ""
                              }${formatPercentage(
                                variation,
                              )}`}
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(
                            update.status,
                          )}

                          <span className="sr-only">
                            {
                              statusLabels[
                                update.status
                              ]
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          {update.sourceName ||
                            "—"}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
              <Camera className="size-5" />
            </div>

            <div>
              <p className="font-medium">
                Galeria da obra
              </p>

              <p className="mt-1 text-sm text-slate-500">
                As imagens e vídeos serão
                organizados por mês e etapa da
                construção.
              </p>
            </div>
          </div>

          <Badge variant="outline">
            Próxima etapa
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}