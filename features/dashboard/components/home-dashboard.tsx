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

import {
  MetricCard,
} from "@/components/dashboard/metric-card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

import {
  Progress,
} from "@/components/ui/progress";

import type {
  HomeDashboardData,
} from "@/features/dashboard/types";

import type {
  ApartmentCostSummary as ApartmentCostSummaryData,
} from "@/features/gastos/types";

interface HomeDashboardProps {
  data: HomeDashboardData;
  costSummary: ApartmentCostSummaryData;
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(value);
}

function parseDatabaseDate(
  date: string,
) {
  const [
    year,
    month,
    day,
  ] = date
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(
    parseDatabaseDate(
      date,
    ),
  );
}

function formatMonthYear(
  date: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  ).format(
    parseDatabaseDate(
      date,
    ),
  );
}

function formatPercentage(
  value: number,
) {
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
    data.construction
      ?.overallProgress ??
    0;

  const apartmentIdentification =
    [
      data.apartment
        .projectName,

      data.apartment.block,

      data.apartment.unit
        ? `Unidade ${data.apartment.unit}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="min-w-0 space-y-6">
      {/* APRESENTAÇÃO DO APARTAMENTO */}
      <Card className="overflow-hidden rounded-2xl border-emerald-200 bg-emerald-50 shadow-sm">
        <CardContent className="flex min-w-0 flex-col justify-between gap-6 p-5 sm:p-6 md:flex-row md:items-center">
          <div className="min-w-0">
            <Badge className="mb-3 bg-emerald-100 text-emerald-950">
              Nosso apartamento
            </Badge>

            <h2 className="break-words text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl lg:text-4xl">
              {
                data.apartment
                  .name
              }
            </h2>

            {apartmentIdentification && (
              <p className="mt-2 break-words text-sm text-emerald-800 sm:text-base">
                {
                  apartmentIdentification
                }
              </p>
            )}

            {data.apartment
              .deliveryDate && (
              <p className="mt-4 text-sm text-emerald-800">
                Previsão de
                entrega:{" "}
                <strong className="capitalize">
                  {formatMonthYear(
                    data.apartment
                      .deliveryDate,
                  )}
                </strong>
              </p>
            )}
          </div>

          <Link
            href="/obra"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-900 sm:w-auto md:self-center"
          >
            Acompanhar obra

            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {/* INDICADORES CONSOLIDADOS */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <MetricCard
          title="Evolução da obra"
          value={formatPercentage(
            constructionProgress,
          )}
          description={
            data.construction
              ? `Atualização de ${formatMonthYear(
                  data.construction
                    .referenceMonth,
                )}.`
              : "Nenhuma atualização cadastrada."
          }
          icon={Building2}
        />

        <MetricCard
          title="Desembolso total"
          value={formatCurrency(
            costSummary
              .totalCashOutflow,
          )}
          description="Gastos, parcelas e amortizações efetivamente pagos."
          icon={
            CircleDollarSign
          }
        />

        <MetricCard
          title="Principal pago"
          value={formatCurrency(
            costSummary
              .acquisitionPrincipalPaid,
          )}
          description="Valores que aumentam a participação quitada no imóvel."
          icon={House}
        />

        <MetricCard
          title="Custos não patrimoniais"
          value={formatCurrency(
            costSummary
              .nonPrincipalCostsPaid,
          )}
          description="Juros, seguros, taxas e demais custos."
          icon={ReceiptText}
        />
      </div>

      {/* PROGRESSO DE QUITAÇÃO */}
      {costSummary.purchasePrice !==
        null &&
        costSummary.purchasePrincipalProgress !==
          null && (
          <Card className="min-w-0 rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <CardTitle>
                    Quitação do valor
                    de aquisição
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Percentual
                    estimado do preço
                    do apartamento já
                    coberto pelo
                    principal pago.
                  </CardDescription>
                </div>

                <Badge className="w-fit shrink-0 bg-emerald-100 text-emerald-950">
                  {formatPercentage(
                    costSummary
                      .purchasePrincipalProgress,
                  )}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Progress
                value={
                  costSummary
                    .purchasePrincipalProgress
                }
                className="h-3"
              />

              <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
                <div className="min-w-0 rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Valor de
                    aquisição
                  </p>

                  <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                    {formatCurrency(
                      costSummary
                        .purchasePrice,
                    )}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal pago
                  </p>

                  <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                    {formatCurrency(
                      costSummary
                        .acquisitionPrincipalPaid,
                    )}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border p-4">
                  <p className="text-sm text-slate-500">
                    Principal
                    restante
                  </p>

                  <p className="mt-2 break-words text-lg font-semibold tabular-nums">
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

      {/* FINANCEIRO + ÚLTIMA IMAGEM */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* SITUAÇÃO FINANCEIRA */}
        <Card className="min-w-0 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>
              Situação financeira
            </CardTitle>

            <CardDescription>
              Resumo do
              financiamento, custos
              acumulados e próximos
              compromissos.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {data.financing ? (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                <div className="min-w-0 rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                    <Landmark className="size-4 shrink-0" />

                    Valor financiado
                  </div>

                  <p className="break-words text-xl font-semibold tabular-nums">
                    {formatCurrency(
                      data.financing
                        .financedAmount,
                    )}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      data.financing
                        .bankName
                    }
                  </p>
                </div>

                <div className="min-w-0 rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
                    <ReceiptText className="size-4 shrink-0" />

                    Parcela-base
                  </div>

                  <p className="break-words text-xl font-semibold tabular-nums">
                    {formatCurrency(
                      data.financing
                        .basePayment,
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
                Nenhum
                financiamento ativo
                encontrado.
              </div>
            )}

            {/* RESUMO DE CUSTOS */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4">
              <div className="min-w-0 rounded-xl border p-4">
                <HardHat className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Taxa de obra
                </p>

                <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                  {formatCurrency(
                    data.expenses
                      .constructionFeePaid,
                  )}
                </p>
              </div>

              <div className="min-w-0 rounded-xl border p-4">
                <PiggyBank className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Amortizações
                </p>

                <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                  {formatCurrency(
                    costSummary
                      .extraAmortizationsPaid,
                  )}
                </p>
              </div>

              <div className="min-w-0 rounded-xl border p-4">
                <Landmark className="mb-3 size-5 text-emerald-900" />

                <p className="text-sm text-slate-500">
                  Parcelas pagas
                </p>

                <p className="mt-2 break-words text-lg font-semibold tabular-nums">
                  {formatCurrency(
                    costSummary
                      .financingPaymentsPaid,
                  )}
                </p>
              </div>
            </div>

            {/* PRÓXIMO VENCIMENTO */}
            <div className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarClock className="size-4 shrink-0 text-emerald-800" />

                  Próximo vencimento
                </div>

                {data.expenses
                  .nextExpense ? (
                  <>
                    <p className="mt-2 break-words font-medium">
                      {
                        data.expenses
                          .nextExpense
                          .title
                      }
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Vence em{" "}
                      {formatDate(
                        data.expenses
                          .nextExpense
                          .dueDate,
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">
                    Nenhum vencimento
                    pendente.
                  </p>
                )}
              </div>

              {data.expenses
                .nextExpense && (
                <div className="shrink-0 sm:text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Valor previsto
                  </p>

                  <p className="mt-1 break-words text-xl font-semibold tabular-nums">
                    {data.expenses
                      .nextExpense
                      .plannedAmount ===
                    null
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

            <div className="flex min-w-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">
                  Valores previstos
                  pendentes
                </p>

                <p className="mt-1 break-words text-xl font-semibold tabular-nums">
                  {formatCurrency(
                    data.expenses
                      .pendingPlanned,
                  )}
                </p>
              </div>

              <Link
                href="/gastos"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-emerald-900 hover:underline"
              >
                Ver custo completo

                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ÚLTIMA IMAGEM */}
        <Card className="min-w-0 overflow-hidden rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex min-w-0 items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>
                  Última imagem
                </CardTitle>

                <CardDescription className="mt-1">
                  Registro mais
                  recente da
                  construção.
                </CardDescription>
              </div>

              <Camera className="size-5 shrink-0 text-emerald-800" />
            </div>
          </CardHeader>

          <CardContent>
            {data.latestMedia ? (
              <div className="space-y-4">
                <Link
                  href="/obra"
                  className="block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                >
                  <img
                    src={
                      data.latestMedia
                        .signedUrl
                    }
                    alt={
                      data.latestMedia
                        .title ||
                      data.latestMedia
                        .stageName ||
                      "Última imagem da obra"
                    }
                    className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                </Link>

                <div className="min-w-0">
                  <p className="break-words font-medium">
                    {data.latestMedia
                      .title ||
                      data.latestMedia
                        .stageName ||
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
              <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center">
                <Camera className="mb-3 size-8 text-slate-400" />

                <p className="text-sm font-medium">
                  Nenhuma imagem
                  adicionada
                </p>

                <Link
                  href="/obra"
                  className="mt-2 text-sm text-emerald-900 hover:underline"
                >
                  Abrir galeria da
                  obra
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ACESSO RÁPIDO */}
      <Card className="min-w-0 rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>
            Acesso rápido
          </CardTitle>

          <CardDescription>
            Principais áreas do
            Apê 13-01.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          <Link
            href="/financiamento"
            className="group min-w-0 rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Landmark className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Financiamento
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Simulações, parcelas
              e amortizações.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/gastos"
            className="group min-w-0 rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <ReceiptText className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Gastos
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Custos consolidados
              e taxa de obra.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/obra"
            className="group min-w-0 rounded-xl border p-5 transition-colors hover:border-emerald-300 hover:bg-emerald-50"
          >
            <Building2 className="mb-4 size-5 text-emerald-900" />

            <p className="font-medium">
              Evolução da obra
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Percentuais,
              histórico e
              galeria.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}