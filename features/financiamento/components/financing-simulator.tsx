"use client";

import { FinancingAnalysis } from "@/features/financiamento/components/financing-analysis";
import {
  Calculator,
  CalendarCheck2,
  Clock3,
  Info,
  Landmark,
  PiggyBank,
  RotateCcw,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";

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
import { Label } from "@/components/ui/label";
import type {
  FinancingContract,
  FinancingSimulationInput,
} from "@/features/financiamento/types";
import {
  compareFinancing,
  formatCurrency,
  formatMonthYear,
  formatTerm,
} from "@/features/financiamento/utils/simulate-financing";

interface FinancingSimulatorProps {
  contract: FinancingContract;
}

interface ExtraPaymentState {
  initialExtraPayment: number;
  monthlyExtraPayment: number;
  annualExtraPayment: number;
  monthlyTrRate: number;
}

const DEFAULT_EXTRA_PAYMENTS: ExtraPaymentState = {
  initialExtraPayment: 50_000,
  monthlyExtraPayment: 1_500,
  annualExtraPayment: 20_000,
  monthlyTrRate: 0,
};

function formatPercentage(value: number | null) {
  if (value === null) {
    return "Não informado";
  }

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value)}% a.a.`;
}

function parseDatabaseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

interface NumberFieldProps {
  id: string;
  label: string;
  description: string;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}

function NumberField({
  id,
  label,
  description,
  value,
  step = 100,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <Input
        id={id}
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => {
          const parsedValue = Number(event.target.value);

          onChange(Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : 0);
        }}
      />

      <p className="text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

export function FinancingSimulator({ contract }: FinancingSimulatorProps) {
  const [extraPayments, setExtraPayments] = useState<ExtraPaymentState>(() => ({
    ...DEFAULT_EXTRA_PAYMENTS,
    monthlyTrRate: contract.monthlyTrRate,
  }));

  const simulationInput: FinancingSimulationInput = {
    financedAmount: contract.financedAmount,
    contractualTermMonths: contract.contractualTermMonths,
    basePayment: contract.basePayment,
    nominalAnnualRate: contract.nominalAnnualRate ?? 0,
    effectiveAnnualRate: contract.effectiveAnnualRate ?? 0,
    startDate: contract.startDate,
    ...extraPayments,
  };

  const comparison = useMemo(() => {
    try {
      return {
        result: compareFinancing(simulationInput),
        error: null,
      };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível realizar a simulação.",
      };
    }
  }, [
    extraPayments.initialExtraPayment,
    extraPayments.monthlyExtraPayment,
    extraPayments.annualExtraPayment,
    extraPayments.monthlyTrRate,
  ]);

  function updateValue(field: keyof ExtraPaymentState, value: number) {
    setExtraPayments((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function resetSimulation() {
    setExtraPayments({
      ...DEFAULT_EXTRA_PAYMENTS,
      monthlyTrRate: contract.monthlyTrRate,
    });
  }

  const result = comparison.result;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Valor financiado"
          value={formatCurrency(contract.financedAmount)}
          description={`Valor inicial contratado no sistema ${contract.amortizationSystem}.`}
          icon={Landmark}
        />

        <MetricCard
          title="Prazo contratado"
          value={`${contract.contractualTermMonths} meses`}
          description={formatTerm(contract.contractualTermMonths)}
          icon={Clock3}
        />

        <MetricCard
          title="Parcela-base"
          value={formatCurrency(contract.basePayment)}
          description="Sem seguros, taxa administrativa e TR."
          icon={Calculator}
        />

        <MetricCard
          title="Taxa efetiva"
          value={formatPercentage(contract.effectiveAnnualRate)}
          description={`Contrato com ${contract.bankName}.`}
          icon={TrendingDown}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="grid items-start gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          {/* Coluna esquerda */}
          <div className="space-y-6">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>Estratégia de amortização</CardTitle>

                    <CardDescription className="mt-1">
                      Defina os aportes que serão usados para reduzir o prazo.
                    </CardDescription>
                  </div>

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
                    <PiggyBank className="size-5" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <NumberField
                  id="initial-extra-payment"
                  label="Amortização inicial"
                  description="Aplicada após o pagamento da primeira prestação."
                  value={extraPayments.initialExtraPayment}
                  step={1_000}
                  onChange={(value) =>
                    updateValue("initialExtraPayment", value)
                  }
                />

                <NumberField
                  id="monthly-extra-payment"
                  label="Amortização mensal"
                  description="Valor adicional pago após cada prestação."
                  value={extraPayments.monthlyExtraPayment}
                  step={100}
                  onChange={(value) =>
                    updateValue("monthlyExtraPayment", value)
                  }
                />

                <NumberField
                  id="annual-extra-payment"
                  label="Amortização anual"
                  description="Aporte adicional realizado a cada 12 prestações."
                  value={extraPayments.annualExtraPayment}
                  step={1_000}
                  onChange={(value) => updateValue("annualExtraPayment", value)}
                />

                <NumberField
                  id="monthly-tr-rate"
                  label="Estimativa mensal da TR (%)"
                  description="Mantenha zero para não projetar uma TR futura desconhecida."
                  value={extraPayments.monthlyTrRate}
                  step={0.01}
                  onChange={(value) => updateValue("monthlyTrRate", value)}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={resetSimulation}
                >
                  <RotateCcw className="size-4" />
                  Restaurar estratégia inicial
                </Button>
              </CardContent>
            </Card>

            {/* Resumo da estratégia abaixo dos campos */}
            {result && (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle>Com a estratégia</CardTitle>

                  <CardDescription>
                    Primeira amortização, aportes mensais e anuais.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Prazo</span>

                    <span className="text-right font-medium">
                      {formatTerm(result.scenario.months)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">Quitação</span>

                    <span className="text-right font-medium">
                      {formatMonthYear(result.scenario.endDate)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      Total amortizado por fora
                    </span>

                    <span className="text-right font-medium">
                      {formatCurrency(result.scenario.totalExtraPaid)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      Total estimado de juros
                    </span>

                    <span className="text-right font-medium">
                      {formatCurrency(result.scenario.totalInterest)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-500">
                      Total desembolsado
                    </span>

                    <span className="text-right font-medium">
                      {formatCurrency(result.scenario.totalPaid)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna direita */}
          <div className="min-w-0 space-y-6">
            {comparison.error && (
              <Card className="rounded-2xl border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <p className="font-medium text-red-900">
                    Não foi possível calcular
                  </p>

                  <p className="mt-2 text-sm text-red-700">
                    {comparison.error}
                  </p>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <CardTitle>Resultado estimado</CardTitle>

                        <CardDescription className="mt-1">
                          Comparação com o contrato sem amortizações
                          extraordinárias.
                        </CardDescription>
                      </div>

                      <Badge className="bg-emerald-950 text-white">
                        Redução de prazo
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <Clock3 className="mb-4 size-5 text-emerald-950" />

                        <p className="text-sm text-slate-500">
                          Prazo com a estratégia
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {formatTerm(result.scenario.months)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {result.scenario.months} prestações estimadas
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <CalendarCheck2 className="mb-4 size-5 text-emerald-950" />

                        <p className="text-sm text-slate-500">
                          Quitação estimada
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {formatMonthYear(result.scenario.endDate)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Início do contrato em{" "}
                          {formatMonthYear(
                            parseDatabaseDate(contract.startDate),
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <TrendingDown className="mb-4 size-5 text-emerald-950" />

                        <p className="text-sm text-slate-500">
                          Prazo eliminado
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {formatTerm(result.monthsSaved)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {result.monthsSaved} meses a menos
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-950 p-5 text-white">
                        <PiggyBank className="mb-4 size-5" />

                        <p className="text-sm text-emerald-100">
                          Juros economizados
                        </p>

                        <p className="mt-2 text-xl font-semibold">
                          {formatCurrency(result.interestSaved)}
                        </p>

                        <p className="mt-1 text-xs text-emerald-200">
                          Estimativa sem TR futura
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Sem amortizações extras</CardTitle>

                    <CardDescription>
                      Projeção do contrato original.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">Prazo</span>

                      <span className="text-right font-medium">
                        {formatTerm(result.baseline.months)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">Quitação</span>

                      <span className="text-right font-medium">
                        {formatMonthYear(result.baseline.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Total estimado de juros
                      </span>

                      <span className="text-right font-medium">
                        {formatCurrency(result.baseline.totalInterest)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Total desembolsado
                      </span>

                      <span className="text-right font-medium">
                        {formatCurrency(result.baseline.totalPaid)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Área de evolução fora da grade: ocupa toda a largura */}
        {result && (
          <FinancingAnalysis
            baseline={result.baseline}
            scenario={result.scenario}
          />
        )}

        {/* Aviso também ocupa toda a largura */}
        {result && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-amber-700" />

            <div>
              <p className="text-sm font-medium text-amber-950">
                Simulação financeira preliminar
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                O cálculo usa o sistema Price, mantém a prestação-base e
                direciona todas as amortizações para redução de prazo. Seguros,
                taxa administrativa, alterações contratuais e TR futura não
                estão incluídos quando o campo de TR permanece em zero.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
