import {
  CircleDollarSign,
  House,
  Landmark,
  ReceiptText,
  TriangleAlert,
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
  ApartmentCostSummary as ApartmentCostSummaryData,
  CostBreakdownGroup,
} from "@/features/gastos/types";

interface ApartmentCostSummaryProps {
  summary: ApartmentCostSummaryData;
}

const groupLabels: Record<
  CostBreakdownGroup,
  string
> = {
  principal: "Principal",
  financing_cost:
    "Custo do financiamento",
  additional_cost: "Custo adicional",
  post_delivery: "Após a entrega",
  reconciliation: "A conciliar",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value)}%`;
}

function getGroupBadge(
  group: CostBreakdownGroup,
) {
  if (group === "principal") {
    return (
      <Badge className="bg-emerald-100 text-emerald-950">
        Principal
      </Badge>
    );
  }

  if (group === "reconciliation") {
    return (
      <Badge className="bg-amber-100 text-amber-900">
        A conciliar
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      {groupLabels[group]}
    </Badge>
  );
}

export function ApartmentCostSummary({
  summary,
}: ApartmentCostSummaryProps) {
  const visibleBreakdown =
    summary.breakdown.filter(
      (item) =>
        Math.abs(item.amount) >= 0.01,
    );

  return (
    <section className="space-y-6">
      <div>
        <Badge
          variant="secondary"
          className="mb-3 bg-emerald-100 text-emerald-950"
        >
          Visão consolidada
        </Badge>

        <h3 className="text-2xl font-semibold tracking-tight">
          Custo total do apartamento
        </h3>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Consolidação dos gastos gerais,
          parcelas pagas e amortizações
          extraordinárias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Desembolso total"
          value={formatCurrency(
            summary.totalCashOutflow,
          )}
          description="Todo o dinheiro efetivamente pago no projeto."
          icon={CircleDollarSign}
        />

        <MetricCard
          title="Principal do imóvel pago"
          value={formatCurrency(
            summary.acquisitionPrincipalPaid,
          )}
          description="Valores que reduzem o principal do imóvel."
          icon={House}
        />

        <MetricCard
          title="Custos não patrimoniais"
          value={formatCurrency(
            summary.nonPrincipalCostsPaid,
          )}
          description="Juros, taxas, seguros e demais custos."
          icon={ReceiptText}
        />

        <MetricCard
          title="Principal restante"
          value={
            summary.remainingPurchasePrincipal ===
            null
              ? "Não informado"
              : formatCurrency(
                  summary.remainingPurchasePrincipal,
                )
          }
          description="Diferença estimada sobre o valor de aquisição."
          icon={Landmark}
        />
      </div>

      {summary.purchasePrice !== null &&
        summary.purchasePrincipalProgress !==
          null && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <CardTitle>
                    Quitação do valor de aquisição
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Comparação entre o principal
                    pago e o preço de compra do
                    apartamento.
                  </CardDescription>
                </div>

                <Badge className="bg-emerald-100 text-emerald-950">
                  {formatPercentage(
                    summary.purchasePrincipalProgress,
                  )}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Progress
                value={
                  summary.purchasePrincipalProgress
                }
                className="h-3"
              />

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Valor de aquisição
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(
                      summary.purchasePrice,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal pago
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(
                      summary.acquisitionPrincipalPaid,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal restante
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(
                      summary.remainingPurchasePrincipal ??
                        0,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Composição do desembolso
          </CardTitle>

          <CardDescription>
            Origem dos valores efetivamente pagos
            até o momento.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {visibleBreakdown.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <p className="font-medium">
                Nenhum pagamento registrado
              </p>

              <p className="mt-2 text-sm text-slate-500">
                A composição aparecerá conforme
                gastos e pagamentos forem
                cadastrados.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border">
              <Table className="min-w-175">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Componente
                    </TableHead>

                    <TableHead>
                      Natureza
                    </TableHead>

                    <TableHead className="text-right">
                      Valor pago
                    </TableHead>

                    <TableHead className="text-right">
                      Participação
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {visibleBreakdown.map(
                    (item) => {
                      const participation =
                        summary.totalCashOutflow >
                        0
                          ? (item.amount /
                              summary.totalCashOutflow) *
                            100
                          : 0;

                      return (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium">
                            {item.label}
                          </TableCell>

                          <TableCell>
                            {getGroupBadge(
                              item.group,
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-right font-medium">
                            {formatCurrency(
                              item.amount,
                            )}
                          </TableCell>

                          <TableCell className="whitespace-nowrap text-right">
                            {formatPercentage(
                              participation,
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-sky-800" />

          <div>
            <p className="font-medium text-sky-950">
              Como evitamos valores duplicados
            </p>

            <p className="mt-1 text-sm leading-6 text-sky-800">
              O preço integral do apartamento não
              é somado ao desembolso. O sistema
              considera somente entrada,
              principal pago nas parcelas,
              amortizações extraordinárias e os
              custos realmente pagos.
            </p>
          </div>
        </div>
      </div>

      {summary.hasReconciliationDifference && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-800" />

            <div>
              <p className="font-medium text-amber-950">
                Parcela com diferença na composição
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Existe uma diferença acumulada de{" "}
                <strong>
                  {formatCurrency(
                    summary.reconciliationDifference,
                  )}
                </strong>{" "}
                entre o total das parcelas e a soma
                de principal, juros, seguros, TR e
                tarifas. Revise os pagamentos
                cadastrados no financiamento.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}