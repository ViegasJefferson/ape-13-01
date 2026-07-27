import {
  CalendarDays,
  HandCoins,
  ListChecks,
} from "lucide-react";

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
import type { ExtraAmortization } from "@/features/financiamento/types";
import { formatCurrency } from "@/features/financiamento/utils/simulate-financing";

interface ExtraAmortizationHistoryProps {
  amortizations: ExtraAmortization[];
}

function formatDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

export function ExtraAmortizationHistory({
  amortizations,
}: ExtraAmortizationHistoryProps) {
  const totalAmortized = amortizations.reduce(
    (total, amortization) =>
      total + amortization.amount,
    0,
  );

  const latestAmortization = amortizations[0];

  if (amortizations.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
            <HandCoins className="size-6" />
          </div>

          <p className="font-medium text-slate-950">
            Nenhuma amortização registrada
          </p>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Quando uma amortização for efetivamente
            realizada no banco, registre-a para manter o
            histórico financeiro atualizado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <HandCoins className="mb-4 size-5 text-emerald-950" />

            <p className="text-sm text-slate-500">
              Total amortizado
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(totalAmortized)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <ListChecks className="mb-4 size-5 text-emerald-950" />

            <p className="text-sm text-slate-500">
              Amortizações realizadas
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {amortizations.length}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <CalendarDays className="mb-4 size-5 text-emerald-950" />

            <p className="text-sm text-slate-500">
              Última amortização
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {formatCurrency(
                latestAmortization.amount,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {formatDatabaseDate(
                latestAmortization.amortizationDate,
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Histórico de amortizações
          </CardTitle>

          <CardDescription>
            Valores efetivamente utilizados para reduzir o
            saldo devedor.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto rounded-xl border">
            <Table className="min-w-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>

                  <TableHead className="text-right">
                    Valor
                  </TableHead>

                  <TableHead>
                    Tipo de redução
                  </TableHead>

                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {amortizations.map(
                  (amortization) => (
                    <TableRow key={amortization.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDatabaseDate(
                          amortization.amortizationDate,
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-right font-semibold">
                        {formatCurrency(
                          amortization.amount,
                        )}
                      </TableCell>

                      <TableCell>
                        {amortization.reductionType ===
                        "term" ? (
                          <Badge className="bg-emerald-100 text-emerald-950">
                            Redução de prazo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Redução da prestação
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="min-w-64 text-slate-600">
                        {amortization.notes || "—"}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}