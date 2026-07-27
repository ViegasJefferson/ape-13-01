import {
  CalendarClock,
  CircleDollarSign,
  HardHat,
  ReceiptText,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Expense,
  ExpenseDashboardData,
  ExpenseStatus,
} from "@/features/gastos/types";

interface ExpenseDashboardProps {
  data: ExpenseDashboardData;
}

const statusLabels: Record<ExpenseStatus, string> = {
  planned: "Previsto",
  partial: "Parcial",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

function getBrazilCurrentYearMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  return `${year}-${month}`;
}

function getStatusBadge(status: ExpenseStatus) {
  if (status === "paid") {
    return (
      <Badge className="bg-emerald-100 text-emerald-950">
        Pago
      </Badge>
    );
  }

  if (status === "overdue") {
    return (
      <Badge className="bg-red-100 text-red-900">
        Vencido
      </Badge>
    );
  }

  if (status === "partial") {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        Parcial
      </Badge>
    );
  }

  if (status === "cancelled") {
    return <Badge variant="secondary">Cancelado</Badge>;
  }

  return <Badge variant="outline">Previsto</Badge>;
}

function getNextExpense(expenses: Expense[]) {
  return expenses.find(
    (expense) =>
      expense.status !== "paid" &&
      expense.status !== "cancelled",
  );
}

export function ExpenseDashboard({
  data,
}: ExpenseDashboardProps) {
  const currentYearMonth =
    getBrazilCurrentYearMonth();

  const totalPaid = data.expenses.reduce(
    (total, expense) =>
      total + expense.paidAmount,
    0,
  );

  const currentMonthPaid = data.expenses.reduce(
    (total, expense) => {
      if (
        !expense.paidAt ||
        !expense.paidAt.startsWith(currentYearMonth)
      ) {
        return total;
      }

      return total + expense.paidAmount;
    },
    0,
  );

  const constructionFeePaid = data.expenses.reduce(
    (total, expense) => {
      if (expense.category.slug !== "taxa-obra") {
        return total;
      }

      return total + expense.paidAmount;
    },
    0,
  );

  const pendingPlanned = data.expenses.reduce(
    (total, expense) => {
      if (
        expense.status === "paid" ||
        expense.status === "cancelled" ||
        expense.plannedAmount === null
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          expense.plannedAmount -
            expense.paidAmount,
          0,
        )
      );
    },
    0,
  );

  const nextExpense = getNextExpense(data.expenses);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total pago"
          value={formatCurrency(totalPaid)}
          description="Desembolsos registrados no módulo de gastos."
          icon={CircleDollarSign}
        />

        <MetricCard
          title="Pago no mês"
          value={formatCurrency(currentMonthPaid)}
          description="Valores pagos no mês atual."
          icon={ReceiptText}
        />

        <MetricCard
          title="Taxa de obra acumulada"
          value={formatCurrency(constructionFeePaid)}
          description="Total pago em taxa de evolução de obra."
          icon={HardHat}
        />

        <MetricCard
          title="Previsto pendente"
          value={formatCurrency(pendingPlanned)}
          description="Valores previstos ainda não integralmente pagos."
          icon={CalendarClock}
        />
      </div>

      {nextExpense && (
        <Card className="rounded-2xl border-emerald-200 bg-emerald-50 shadow-sm">
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-emerald-950">
                Próximo vencimento
              </p>

              <p className="mt-1 text-lg font-semibold text-emerald-950">
                {nextExpense.title}
              </p>

              <p className="mt-1 text-sm text-emerald-800">
                Vencimento em{" "}
                {formatDatabaseDate(
                  nextExpense.dueDate,
                )}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Valor previsto
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-950">
                {nextExpense.plannedAmount === null
                  ? "A informar"
                  : formatCurrency(
                      nextExpense.plannedAmount,
                    )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>

          <CardDescription>
            Gastos previstos e realizados relacionados ao
            {` ${data.apartmentName}`}.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {data.expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">
                Nenhum gasto cadastrado
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Os próximos lançamentos aparecerão nesta
                área.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border">
              <Table className="min-w-225">
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>

                    <TableHead className="text-right">
                      Previsto
                    </TableHead>

                    <TableHead className="text-right">
                      Pago
                    </TableHead>

                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDatabaseDate(
                          expense.dueDate,
                        )}
                      </TableCell>

                      <TableCell className="min-w-72">
                        <p className="font-medium">
                          {expense.title}
                        </p>

                        {expense.notes && (
                          <p className="mt-1 text-xs text-slate-500">
                            {expense.notes}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {expense.category.name}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right">
                        {expense.plannedAmount === null
                          ? "A informar"
                          : formatCurrency(
                              expense.plannedAmount,
                            )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-medium">
                        {formatCurrency(
                          expense.paidAmount,
                        )}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(
                          expense.status,
                        )}

                        <span className="sr-only">
                          {statusLabels[expense.status]}
                        </span>
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