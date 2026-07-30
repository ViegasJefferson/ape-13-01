/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Camera,
  CircleDollarSign,
  HardHat,
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

interface HomeDashboardProps {
  data: HomeDashboardData;
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
      maximumFractionDigits: 2,
    },
  ).format(value)}%`;
}

export function HomeDashboard({
  data,
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
                    data.apartment
                      .deliveryDate,
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          title="Gastos pagos"
          value={formatCurrency(
            data.expenses.totalPaid,
          )}
          description="Valores pagos no módulo de gastos."
          icon={CircleDollarSign}
        />

        <MetricCard
          title="Taxa de obra"
          value={formatCurrency(
            data.expenses
              .constructionFeePaid,
          )}
          description="Total acumulado da evolução de obra."
          icon={HardHat}
        />

        <MetricCard
          title="Amortizações"
          value={formatCurrency(
            data.amortizations.totalAmount,
          )}
          description={`${data.amortizations.count} amortização(ões) registrada(s).`}
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle>
              Situação financeira
            </CardTitle>

            <CardDescription>
              Resumo do financiamento e dos
              próximos compromissos.
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
                      data.financing
                        .financedAmount,
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
                Nenhum financiamento ativo
                encontrado.
              </div>
            )}

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
                          .nextExpense
                          .dueDate,
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
                Ver todos os gastos
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

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
                  className="block aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"
                >
                  <img
                    src={
                      data.latestMedia
                        .signedUrl
                    }
                    alt={
                      data.latestMedia.title ||
                      data.latestMedia
                        .stageName ||
                      "Última imagem da obra"
                    }
                    className="size-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                </Link>

                <div>
                  <p className="font-medium">
                    {data.latestMedia.title ||
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
              <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border border-dashed text-center">
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
              Simulações, amortizações e
              histórico.
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
              Taxa de obra e demais
              pagamentos.
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
              Percentuais, histórico e
              galeria.
            </p>

            <ArrowRight className="mt-4 size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}