/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Camera,
  CircleDollarSign,
  HardHat,
  House,
  Landmark,
  PiggyBank,
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
import { Progress } from "@/components/ui/progress";
import type { HomeDashboardData } from "@/features/dashboard/types";
import type {
  ApartmentCostSummary as ApartmentCostSummaryData,
} from "@/features/gastos/types";

interface HomeDashboardProps {
  data: HomeDashboardData;
  costSummary: ApartmentCostSummaryData;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseDatabaseDate(date: string) {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(parseDatabaseDate(date));
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

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(value)}%`;
}

export function HomeDashboard({
  data,
  costSummary,
}: HomeDashboardProps) {
  const constructionProgress =
    data.construction?.overallProgress ?? 0;

  const apartmentIdentification = [
    data.apartment.projectName,
    data.apartment.block,
    data.apartment.unit
      ? `Unidade ${data.apartment.unit}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      {/* Apresentação do apartamento */}
      <Card className="overflow-hidden rounded-2xl border-emerald-200 bg-emerald-50 shadow-sm">
        <CardContent className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center">
          <div>
            <Badge className="mb-3 bg-emerald-100 text-emerald-950">
              Nosso apartamento
            </Badge>

            <h2 className="text-3xl font-semibold tracking-tight text-emerald-950 sm:text-4xl">
              {data.apartment.name}
            </h2>

            {apartmentIdentification && (
              <p className="mt-2 text-emerald-800">
                {apartmentIdentification}
              </p>
            )}

            {data.apartment.deliveryDate && (
              <p className="mt-4 text-sm text-emerald-800">
                Previsão de entrega:{" "}
                <strong className="capitalize">
                  {formatMonthYear(
                    data.apartment.deliveryDate,
                  )}
                </strong>
              </p>
            )}
          </div>

          <Link
            href="/obra"
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-md bg-emerald-950 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-900 md:self-center"
          >
            Acompanhar obra
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Indicadores consolidados */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Evolução da obra"
          value={formatPercentage(
            constructionProgress,
          )}
          description={
            data.construction
              ? `Atualização de ${formatMonthYear(
                  data.construction.referenceMonth,
                )}.`
              : "Nenhuma atualização cadastrada."
          }
          icon={Building2}
        />

        <MetricCard
          title="Desembolso total"
          value={formatCurrency(
            costSummary.totalCashOutflow,
          )}
          description="Gastos, parcelas e amortizações efetivamente pagos."
          icon={CircleDollarSign}
        />

        <MetricCard
          title="Principal pago"
          value={formatCurrency(
            costSummary.acquisitionPrincipalPaid,
          )}
          description="Valores que aumentam a participação quitada no imóvel."
          icon={House}
        />

        <MetricCard
          title="Custos não patrimoniais"
          value={formatCurrency(
            costSummary.nonPrincipalCostsPaid,
          )}
          description="Juros, seguros, taxas e demais custos."
          icon={ReceiptText}
        />
      </div>

      {/* Progresso de quitação */}
      {costSummary.purchasePrice !== null &&
        costSummary.purchasePrincipalProgress !==
          null && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <CardTitle>
                    Quitação do valor de aquisição
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Percentual estimado do preço do
                    apartamento já coberto pelo
                    principal pago.
                  </CardDescription>
                </div>

                <Badge className="bg-emerald-100 text-emerald-950">
                  {formatPercentage(
                    costSummary.purchasePrincipalProgress,
                  )}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Progress
                value={
                  costSummary.purchasePrincipalProgress
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
                      costSummary.purchasePrice,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal pago
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(
                      costSummary
                        .acquisitionPrincipalPaid,
                    )}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal restante
                  </p>

                  <p className="mt-2 text-lg font-semibold">
                    {costSummary
                      .remainingPurchasePrincipal ===
                    null
                      ? "Não informado"
                      : formatCurrency(
                          costSummary
                            .remainingPurchasePrincipal,
                        )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Situação financeira */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>
              Situação financeira
            </CardTitle>

            <CardDescription>
              Resumo do financiamento, custos
              acumulados e próximos compromissos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {data.financing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                    <Landmark className="size-4" />
                    Valor financiado
                  </div>

                  <p className="text-xl font-semibold">
                    {formatCurrency(
                      data.financing.financedAmount,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {data.financing.bankName}
                  </p>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                    <ReceiptText className="size-4" />
                    Parcela-base
                  </div>

                  <p className="text-xl font-semibold">
                    {formatCurrency(
                      data.financing.basePayment,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prazo de{" "}
                    {
                      data.financing
                        .contractualTermMonths
                    }{" "}
                    meses
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                Nenhum financiamento ativo
                encontrado.
              </div>
            )}

            {/* Resumo de custos específicos */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <HardHat className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Taxa de obra
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {formatCurrency(
                    data.expenses
                      .constructionFeePaid,
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <PiggyBank className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Amortizações
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {formatCurrency(
                    costSummary
                      .extraAmortizationsPaid,
                  )}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <Landmark className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Parcelas pagas
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {formatCurrency(
                    costSummary
                      .financingPaymentsPaid,
                  )}
                </p>
              </div>
            </div>

            {/* Próximo vencimento */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="size-4 text-emerald-800" />
                  Próximo vencimento
                </div>

                {data.expenses.nextExpense ? (
                  <>
                    <p className="mt-2 font-medium">
                      {
                        data.expenses
                          .nextExpense.title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Vence em{" "}
                      {formatDate(
                        data.expenses
                          .nextExpense.dueDate,
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Nenhum vencimento pendente.
                  </p>
                )}
              </div>

              {data.expenses.nextExpense && (
                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Valor previsto
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {data.expenses
                      .nextExpense
                      .plannedAmount === null
                      ? "A informar"
                      : formatCurrency(
                          data.expenses
                            .nextExpense
                            .plannedAmount,
                        )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">
                  Valores previstos pendentes
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatCurrency(
                    data.expenses
                      .pendingPlanned,
                  )}
                </p>
              </div>

              <Link
                href="/gastos"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-900 hover:underline"
              >
                Ver custo completo
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Última imagem */}
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  Última imagem
                </CardTitle>

                <CardDescription className="mt-1">
                  Registro mais recente da
                  construção.
                </CardDescription>
              </div>

              <Camera className="size-5 text-emerald-800" />
            </div>
          </CardHeader>

          <CardContent>
            {data.latestMedia ? (
              <div className="space-y-4">
                <Link
                  href="/obra"
                  className="block aspect-4/3 overflow-hidden rounded-xl bg-slate-100"
                >
                  <img
                    src={
                      data.latestMedia.signedUrl
                    }
                    alt={
                      data.latestMedia.title ||
                      data.latestMedia.stageName ||
                      "Última imagem da obra"
                    }
                    className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                </Link>

                <div>
                  <p className="font-medium">
                    {data.latestMedia.title ||
                      data.latestMedia.stageName ||
                      "Evolução da obra"}
                  </p>

                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {formatMonthYear(
                      data.latestMedia
                        .referenceMonth,
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex aspect-4/3 flex-col items-center justify-center rounded-xl border border-dashed text-center">
                <Camera className="mb-3 size-8 text-slate-400" />

                <p className="text-sm font-medium">
                  Nenhuma imagem adicionada
                </p>

                <Link
                  href="/obra"
                  className="mt-2 text-sm text-emerald-900 hover:underline"
                >
                  Abrir galeria da obra
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acesso rápido */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Acesso rápido
          </CardTitle>

          <CardDescription>
            Principais áreas do Apê 13-01.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link
            href="/financiamento"
            className="group rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Landmark className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Financiamento
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Simulações, parcelas e
              amortizações.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/gastos"
            className="group rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <ReceiptText className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Gastos
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Custos consolidados e taxa de obra.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/obra"
            className="group rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Building2 className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Evolução da obra
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Percentuais, histórico e galeria.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}