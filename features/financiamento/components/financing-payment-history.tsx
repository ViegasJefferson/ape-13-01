import {
  BadgeDollarSign,
  Landmark,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
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
import { FinancingPaymentDialog } from "@/features/financiamento/components/financing-payment-dialog";
import type { FinancingPayment } from "@/features/financiamento/types";

import { DocumentUploadDialog } from "@/features/documentos/components/document-upload-dialog";
import { LinkedDocumentsButton } from "@/features/documentos/components/linked-documents-button";
import type { LinkedDocument } from "@/features/documentos/types";

interface FinancingPaymentHistoryProps {
  contractId: string;
  apartmentId: string;
  payments: FinancingPayment[];
  nextInstallmentNumber: number;
  documentsByPaymentId: Record<string, LinkedDocument[]>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDatabaseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year, month - 1, day),
  );
}

export function FinancingPaymentHistory({
  contractId,
  apartmentId,
  payments,
  nextInstallmentNumber,
  documentsByPaymentId,
}: FinancingPaymentHistoryProps) {
  const totalPaid = payments.reduce(
    (total, payment) => total + payment.totalPaid,
    0,
  );

  const totalPrincipal = payments.reduce(
    (total, payment) => total + payment.principalAmount,
    0,
  );

  const totalInterest = payments.reduce(
    (total, payment) => total + payment.interestAmount,
    0,
  );

  const totalFees = payments.reduce(
    (total, payment) =>
      total +
      payment.trAdjustment +
      payment.mioAmount +
      payment.dfiAmount +
      payment.administrativeFee +
      payment.otherFees,
    0,
  );

  const latestPayment = payments[0];

  if (payments.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed shadow-sm">
        <CardContent className="flex flex-col items-center justify-center px-6 py-10 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-950">
            <ReceiptText className="size-6" />
          </div>

          <p className="font-medium">Nenhuma parcela paga registrada</p>

          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            O financiamento está previsto para começar em 2028. Quando a
            primeira parcela for paga, registre os valores apresentados pelo
            banco.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total pago"
          value={formatCurrency(totalPaid)}
          description={`${payments.length} parcela(s) registrada(s).`}
          icon={BadgeDollarSign}
        />

        <MetricCard
          title="Principal amortizado"
          value={formatCurrency(totalPrincipal)}
          description="Redução do saldo pelas parcelas."
          icon={Landmark}
        />

        <MetricCard
          title="Juros pagos"
          value={formatCurrency(totalInterest)}
          description="Juros incluídos nas prestações."
          icon={ReceiptText}
        />

        <MetricCard
          title="Seguros e encargos"
          value={formatCurrency(totalFees)}
          description="TR, seguros, tarifas e outros encargos."
          icon={ShieldCheck}
        />
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle>Parcelas pagas</CardTitle>

          <CardDescription>
            Histórico real dos pagamentos do financiamento.
            {latestPayment?.remainingBalance !== null &&
              latestPayment?.remainingBalance !== undefined && (
                <>
                  {" "}
                  Último saldo informado:{" "}
                  <strong>
                    {formatCurrency(latestPayment.remainingBalance)}
                  </strong>
                  .
                </>
              )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto rounded-xl border">
            <Table className="min-w-312.5">
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>

                  <TableHead className="text-right">Principal</TableHead>

                  <TableHead className="text-right">Juros</TableHead>

                  <TableHead className="text-right">Encargos</TableHead>

                  <TableHead className="text-right">Total</TableHead>

                  <TableHead className="text-right">Saldo</TableHead>

                  <TableHead>Documentos</TableHead>

                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map((payment) => {
                  const fees =
                    payment.trAdjustment +
                    payment.mioAmount +
                    payment.dfiAmount +
                    payment.administrativeFee +
                    payment.otherFees;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.installmentNumber}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {formatDatabaseDate(payment.dueDate)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {payment.paidAt
                          ? formatDatabaseDate(payment.paidAt)
                          : "—"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {(documentsByPaymentId[payment.id]?.length ?? 0) >
                            0 && (
                            <LinkedDocumentsButton
                              documents={documentsByPaymentId[payment.id] ?? []}
                              title={`Documentos da parcela ${payment.installmentNumber}`}
                            />
                          )}

                          <DocumentUploadDialog
                            apartmentId={apartmentId}
                            expenseOptions={[]}
                            paymentOptions={[
                              {
                                id: payment.id,
                                installmentNumber: payment.installmentNumber,
                                dueDate: payment.dueDate,
                              },
                            ]}
                            defaultLink={{
                              type: "payment",
                              id: payment.id,
                            }}
                            lockLink
                            triggerLabel="Anexar"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(payment.principalAmount)}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(payment.interestAmount)}
                      </TableCell>

                      <TableCell className="text-right">
                        {formatCurrency(fees)}
                      </TableCell>

                      <TableCell className="text-right font-semibold">
                        {formatCurrency(payment.totalPaid)}
                      </TableCell>

                      <TableCell className="text-right">
                        {payment.remainingBalance === null
                          ? "—"
                          : formatCurrency(payment.remainingBalance)}
                      </TableCell>

                      <TableCell className="text-right">
                        <FinancingPaymentDialog
                          contractId={contractId}
                          nextInstallmentNumber={nextInstallmentNumber}
                          payment={payment}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
