"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  CalendarClock,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RotateCcw,
  Search,
  Trash2,
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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteReminder,
  toggleReminderCompleted,
} from "@/features/agenda/actions/reminder-actions";

import { ReminderDialog } from "@/features/agenda/components/reminder-dialog";

import type {
  AgendaPageData,
  ApartmentReminder,
  ReminderEventType,
} from "@/features/agenda/types";

interface AgendaDashboardProps {
  data: AgendaPageData;
}

type StatusFilter = "all" | "active" | "overdue" | "today" | "completed";

const eventTypeLabels: Record<ReminderEventType, string> = {
  reminder: "Lembrete",
  payment: "Pagamento",
  financing: "Financiamento",
  construction: "Obra",
  renovation: "Reforma",
  document: "Documento",
  appointment: "Compromisso",
  other: "Outro",
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

function todayString() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusBadge(reminder: ApartmentReminder) {
  const today = todayString();

  if (reminder.isCompleted) {
    return <Badge className="bg-emerald-100 text-emerald-950">Concluído</Badge>;
  }

  if (reminder.eventDate < today) {
    return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
  }

  if (reminder.eventDate === today) {
    return <Badge className="bg-amber-100 text-amber-900">Hoje</Badge>;
  }

  return <Badge variant="secondary">Pendente</Badge>;
}

export function AgendaDashboard({ data }: AgendaDashboardProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [eventTypeFilter, setEventTypeFilter] = useState<
    ReminderEventType | "all"
  >("all");

  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredReminders = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    const today = todayString();

    return data.reminders.filter((reminder) => {
      if (eventTypeFilter !== "all" && reminder.eventType !== eventTypeFilter) {
        return false;
      }

      if (statusFilter === "active" && reminder.isCompleted) {
        return false;
      }

      if (statusFilter === "completed" && !reminder.isCompleted) {
        return false;
      }

      if (
        statusFilter === "overdue" &&
        (reminder.isCompleted || reminder.eventDate >= today)
      ) {
        return false;
      }

      if (
        statusFilter === "today" &&
        (reminder.isCompleted || reminder.eventDate !== today)
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [reminder.title, reminder.description]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch);
    });
  }, [data.reminders, eventTypeFilter, search, statusFilter]);

  function handleCompleted(reminder: ApartmentReminder) {
    setFeedback(null);

    startTransition(async () => {
      const result = await toggleReminderCompleted(
        reminder.id,
        data.apartmentId,
        !reminder.isCompleted,
      );

      setFeedback(result.message);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function handleDelete(reminder: ApartmentReminder) {
    const confirmed = window.confirm(`Excluir "${reminder.title}" da agenda?`);

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await deleteReminder(reminder.id, data.apartmentId);

      setFeedback(result.message);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Vencidos"
          value={String(data.overdueCount)}
          description="Eventos pendentes com prazo ultrapassado."
          icon={CircleAlert}
        />

        <MetricCard
          title="Hoje"
          value={String(data.todayCount)}
          description="Compromissos previstos para hoje."
          icon={Clock3}
        />

        <MetricCard
          title="Próximos 7 dias"
          value={String(data.nextSevenDaysCount)}
          description="Eventos futuros da próxima semana."
          icon={CalendarClock}
        />

        <MetricCard
          title="Concluídos"
          value={String(data.completedCount)}
          description="Eventos já finalizados."
          icon={CheckCircle2}
        />
      </div>

      {feedback && (
        <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
          {feedback}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <CardTitle>Agenda do apartamento</CardTitle>

            <CardDescription className="mt-2">
              Prazos, compromissos, pagamentos e lembretes relacionados ao Apê
              13-01.
            </CardDescription>
          </div>

          {data.canEdit && <ReminderDialog apartmentId={data.apartmentId} />}
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Pesquisar agenda"
              />
            </div>

            <NativeSelect
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <NativeSelectOption value="all">
                Todos os status
              </NativeSelectOption>

              <NativeSelectOption value="active">Pendentes</NativeSelectOption>

              <NativeSelectOption value="overdue">Vencidos</NativeSelectOption>

              <NativeSelectOption value="today">Hoje</NativeSelectOption>

              <NativeSelectOption value="completed">
                Concluídos
              </NativeSelectOption>
            </NativeSelect>

            <NativeSelect
              value={eventTypeFilter}
              onChange={(event) =>
                setEventTypeFilter(
                  event.target.value as ReminderEventType | "all",
                )
              }
            >
              <NativeSelectOption value="all">
                Todos os tipos
              </NativeSelectOption>

              {Object.entries(eventTypeLabels).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {filteredReminders.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-12 text-center">
              <CalendarClock className="mx-auto mb-4 size-10 text-slate-400" />

              <p className="font-medium">Nenhum evento encontrado</p>

              <p className="mt-2 text-sm text-slate-500">
                Adicione um lembrete ou altere os filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table className="min-w-275">
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>

                    <TableHead>Evento</TableHead>

                    <TableHead>Tipo</TableHead>

                    <TableHead>Prioridade</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredReminders.map((reminder) => (
                    <TableRow
                      key={reminder.id}
                      className={
                        reminder.isCompleted ? "opacity-60" : undefined
                      }
                    >
                      <TableCell className="whitespace-nowrap">
                        <p className="font-medium">
                          {formatDate(reminder.eventDate)}
                        </p>

                        {reminder.eventTime && (
                          <p className="mt-1 text-xs text-slate-500">
                            {reminder.eventTime.slice(0, 5)}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        <p className="font-medium">{reminder.title}</p>

                        {reminder.description && (
                          <p className="mt-1 max-w-xl text-xs text-slate-500">
                            {reminder.description}
                          </p>
                        )}
                      </TableCell>

                      <TableCell>
                        {eventTypeLabels[reminder.eventType]}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">
                          {reminder.priority === "high"
                            ? "Alta"
                            : reminder.priority === "medium"
                              ? "Média"
                              : "Baixa"}
                        </Badge>
                      </TableCell>

                      <TableCell>{getStatusBadge(reminder)}</TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        {data.canEdit ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isPending}
                              onClick={() => handleCompleted(reminder)}
                            >
                              {reminder.isCompleted ? (
                                <>
                                  <RotateCcw className="size-4" />
                                  Reabrir
                                </>
                              ) : (
                                <>
                                  <Check className="size-4" />
                                  Concluir
                                </>
                              )}
                            </Button>

                            {!reminder.sourceType && (
                              <ReminderDialog
                                apartmentId={data.apartmentId}
                                reminder={reminder}
                              />
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                              aria-label={`Excluir ${reminder.title}`}
                              onClick={() => handleDelete(reminder)}
                            >
                              <Trash2 className="size-4 text-red-700" />
                            </Button>
                          </div>
                        ) : (
                          "—"
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
