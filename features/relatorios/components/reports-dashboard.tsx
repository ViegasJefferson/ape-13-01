"use client";

import {
  Banknote,
  Download,
  Gift,
  HardHat,
  Landmark,
  ReceiptText,
  WalletCards,
} from "lucide-react";

import {
  MetricCard,
} from "@/components/dashboard/metric-card";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

import type {
  ReportsPageData,
} from "@/features/relatorios/types";

interface ReportsDashboardProps {
  data: ReportsPageData;
}

type CsvValue =
  | string
  | number
  | null
  | undefined;

type CsvRow =
  Record<string, CsvValue>;

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

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const datePart =
    value.slice(0, 10);

  const [
    year,
    month,
    day,
  ] = datePart.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function csvNumber(
  value: number,
) {
  return value
    .toFixed(2)
    .replace(".", ",");
}

function escapeCsvValue(
  value: CsvValue,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  const text =
    String(value);

  if (
    text.includes(";") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(
      /"/g,
      '""',
    )}"`;
  }

  return text;
}

function downloadCsv(
  filename: string,
  rows: CsvRow[],
) {
  if (rows.length === 0) {
    window.alert(
      "Não há dados para exportar.",
    );

    return;
  }

  const headers =
    Object.keys(rows[0]);

  const lines = [
    headers
      .map(escapeCsvValue)
      .join(";"),

    ...rows.map((row) =>
      headers
        .map((header) =>
          escapeCsvValue(
            row[header],
          ),
        )
        .join(";"),
    ),
  ];

  const csv =
    `\uFEFF${lines.join("\r\n")}`;

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;",
      },
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    filename;

  document.body.appendChild(
    link,
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

function sanitizeFilename(
  value: string,
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function ReportsDashboard({
  data,
}: ReportsDashboardProps) {
  const paidExpenses =
    data.expenses.filter(
      (expense) =>
        expense.status ===
        "paid",
    );

  const paidFinancingPayments =
    data.financingPayments.filter(
      (payment) =>
        payment.paymentStatus ===
        "paid",
    );

  const renovationItems =
    data.renovation?.items ??
    [];

  const householdItems =
    data.household?.items ??
    [];

  const filenamePrefix =
    sanitizeFilename(
      data.apartmentName ||
        "ape-13-01",
    );

  function exportExpenses() {
    const rows: CsvRow[] =
      data.expenses.map(
        (expense) => ({
          Referencia:
            expense.referenceMonth,

          Vencimento:
            formatDate(
              expense.dueDate,
            ),

          Descricao:
            expense.title,

          Categoria:
            expense.category.name,

          Grupo:
            expense.category
              .financialGroup,

          "Natureza do custo":
            expense.category
              .costNature,

          "Valor previsto":
            expense.plannedAmount ===
            null
              ? ""
              : csvNumber(
                  expense.plannedAmount,
                ),

          "Valor pago":
            csvNumber(
              expense.paidAmount,
            ),

          "Data do pagamento":
            formatDate(
              expense.paidAt,
            ),

          Status:
            expense.status,

          Fornecedor:
            expense.vendorName,

          "Forma de pagamento":
            expense.paymentMethod,

          Observacoes:
            expense.notes,
        }),
      );

    downloadCsv(
      `${filenamePrefix}-gastos.csv`,
      rows,
    );
  }

  function exportFinancing() {
    if (
      !data.financingContract
    ) {
      window.alert(
        "Não há contrato de financiamento cadastrado.",
      );

      return;
    }

    const rows: CsvRow[] =
      data.financingPayments.map(
        (payment) => ({
          Parcela:
            payment.installmentNumber,

          Vencimento:
            formatDate(
              payment.dueDate,
            ),

          "Data do pagamento":
            formatDate(
              payment.paidAt,
            ),

          "Parcela regular":
            csvNumber(
              payment.regularPayment,
            ),

          Juros:
            csvNumber(
              payment.interestAmount,
            ),

          Principal:
            csvNumber(
              payment.principalAmount,
            ),

          TR:
            csvNumber(
              payment.trAdjustment,
            ),

          MIO:
            csvNumber(
              payment.mioAmount,
            ),

          DFI:
            csvNumber(
              payment.dfiAmount,
            ),

          "Taxa administrativa":
            csvNumber(
              payment.administrativeFee,
            ),

          "Outros encargos":
            csvNumber(
              payment.otherFees,
            ),

          "Total pago":
            csvNumber(
              payment.totalPaid,
            ),

          "Saldo devedor":
            payment.remainingBalance ===
            null
              ? ""
              : csvNumber(
                  payment.remainingBalance,
                ),

          Status:
            payment.paymentStatus,

          Observacoes:
            payment.notes,
        }),
      );

    downloadCsv(
      `${filenamePrefix}-financiamento.csv`,
      rows,
    );
  }

  function exportAmortizations() {
    const rows: CsvRow[] =
      data.extraAmortizations.map(
        (amortization) => ({
          Data:
            formatDate(
              amortization
                .amortizationDate,
            ),

          Valor:
            csvNumber(
              amortization.amount,
            ),

          "Tipo de reducao":
            amortization.reductionType ===
            "term"
              ? "Prazo"
              : "Parcela",

          Observacoes:
            amortization.notes,
        }),
      );

    downloadCsv(
      `${filenamePrefix}-amortizacoes.csv`,
      rows,
    );
  }

  function exportRenovation() {
    const rows: CsvRow[] =
      renovationItems.map(
        (item) => ({
          Item:
            item.title,

          Ambiente:
            item.area,

          Status:
            item.status,

          Prioridade:
            item.priority,

          "Valor planejado":
            csvNumber(
              item.plannedAmount,
            ),

          "Valor realizado":
            csvNumber(
              item.actualAmount,
            ),

          Fornecedor:
            item.vendorName,

          Prazo:
            formatDate(
              item.targetDate,
            ),

          Concluido:
            formatDate(
              item.completedAt,
            ),

          Observacoes:
            item.notes,
        }),
      );

    downloadCsv(
      `${filenamePrefix}-reforma.csv`,
      rows,
    );
  }

  function exportHousehold() {
    const rows: CsvRow[] =
      householdItems.map(
        (item) => ({
          Lista:
            item.listType ===
            "trousseau"
              ? "Enxoval"
              : "Cha de panela",

          Item:
            item.title,

          Categoria:
            item.category,

          Ambiente:
            item.room,

          Prioridade:
            item.priority,

          "Quantidade desejada":
            item.desiredQuantity,

          Comprados:
            item.purchasedQuantity,

          Recebidos:
            item.receivedQuantity,

          "Valor unitario estimado":
            csvNumber(
              item.estimatedUnitAmount,
            ),

          "Valor total realizado":
            csvNumber(
              item.actualTotalAmount,
            ),

          Loja:
            item.storeName,

          "Link do produto":
            item.productUrl,

          "Link da imagem":
            item.productImageUrl,

          Observacoes:
            item.notes,
        }),
      );

    downloadCsv(
      `${filenamePrefix}-enxoval.csv`,
      rows,
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Desembolso total"
          value={formatCurrency(
            data.costSummary
              .totalCashOutflow,
          )}
          description="Tudo que efetivamente saiu do caixa."
          icon={WalletCards}
        />

        <MetricCard
          title="Gastos pagos"
          value={String(
            paidExpenses.length,
          )}
          description={`${data.expenses.length} lançamentos cadastrados.`}
          icon={ReceiptText}
        />

        <MetricCard
          title="Parcelas pagas"
          value={String(
            paidFinancingPayments.length,
          )}
          description={`${data.financingPayments.length} parcelas registradas.`}
          icon={Landmark}
        />

        <MetricCard
          title="Amortizações"
          value={formatCurrency(
            data.costSummary
              .extraAmortizationsPaid,
          )}
          description="Total amortizado extraordinariamente."
          icon={Banknote}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <ReceiptText className="size-5" />
            </div>

            <CardTitle>
              Gastos
            </CardTitle>

            <CardDescription>
              Exporta todos os lançamentos,
              valores previstos e realizados,
              datas, categorias e fornecedores.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">
                  Lançamentos
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {data.expenses.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Total pago
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    data.costSummary
                      .generalExpensesPaid,
                  )}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={
                exportExpenses
              }
            >
              <Download className="size-4" />
              Exportar gastos
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <Landmark className="size-5" />
            </div>

            <CardTitle>
              Financiamento
            </CardTitle>

            <CardDescription>
              Parcelas, juros, principal,
              seguros, TR, encargos e
              amortizações extraordinárias.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">
                  Parcelas
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {
                    data
                      .financingPayments
                      .length
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Pago
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    data.costSummary
                      .financingPaymentsPaid,
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={
                  exportFinancing
                }
              >
                <Download className="size-4" />
                Exportar parcelas
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={
                  exportAmortizations
                }
              >
                <Download className="size-4" />
                Exportar amortizações
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <HardHat className="size-5" />
            </div>

            <CardTitle>
              Reforma
            </CardTitle>

            <CardDescription>
              Planejamento, orçamento,
              execução, fornecedores e
              prazos da reforma.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">
                  Itens
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {renovationItems.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Realizado
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    data.renovation
                      ?.actualAmount ??
                      0,
                  )}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={
                exportRenovation
              }
            >
              <Download className="size-4" />
              Exportar reforma
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
              <Gift className="size-5" />
            </div>

            <CardTitle>
              Chá e enxoval
            </CardTitle>

            <CardDescription>
              Produtos, quantidades,
              presentes, valores, lojas
              e links cadastrados.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">
                  Itens
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {householdItems.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Estimado
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(
                    data.household
                      ?.estimatedBudget ??
                      0,
                  )}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={
                exportHousehold
              }
            >
              <Download className="size-4" />
              Exportar enxoval
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}