import { AlertTriangle, Database } from "lucide-react";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { FinancingSimulator } from "@/features/financiamento/components/financing-simulator";
import { getActiveFinancingContract } from "@/features/financiamento/services/get-active-financing-contract";

import { FinancingPaymentDialog } from "@/features/financiamento/components/financing-payment-dialog";
import { FinancingPaymentHistory } from "@/features/financiamento/components/financing-payment-history";
import { getFinancingPayments } from "@/features/financiamento/services/get-financing-payments";
import type {
  ExtraAmortization,
  FinancingContract,
  FinancingPayment,
} from "@/features/financiamento/types";

import { ExtraAmortizationDialog } from "@/features/financiamento/components/extra-amortization-dialog";
import { ExtraAmortizationHistory } from "@/features/financiamento/components/extra-amortization-history";
import { getExtraAmortizations } from "@/features/financiamento/services/get-extra-amortizations";

export default async function FinanciamentoPage() {
  await connection();
  let contract: FinancingContract | null = null;
  let amortizations: ExtraAmortization[] = [];
  let payments: FinancingPayment[] = [];

  try {
    contract = await getActiveFinancingContract();

    if (contract) {
      [amortizations, payments] = await Promise.all([
        getExtraAmortizations(contract.id),
        getFinancingPayments(contract.id),
      ]);
    }
  } catch (error) {
    console.error(error);

    return (
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3 bg-red-100 text-red-900">
            Erro de conexão
          </Badge>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Financiamento
          </h2>
        </div>

        <Card className="rounded-2xl border-red-200 bg-red-50 shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-800">
              <AlertTriangle className="size-5" />
            </div>

            <CardTitle className="text-red-950">
              Não foi possível carregar o contrato
            </CardTitle>

            <CardDescription className="text-red-800">
              Ocorreu um problema ao consultar os dados no Supabase.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-red-800">
              Verifique as variáveis de ambiente, a sessão do usuário e as
              políticas de segurança do banco.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!contract) {
    return (
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Badge
            variant="secondary"
            className="mb-3 bg-amber-100 text-amber-900"
          >
            Configuração necessária
          </Badge>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Financiamento
          </h2>
        </div>

        <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Database className="size-5" />
            </div>

            <CardTitle className="text-amber-950">
              Nenhum contrato ativo encontrado
            </CardTitle>

            <CardDescription className="text-amber-800">
              O usuário autenticado não possui acesso a um contrato ativo.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-amber-800">
              Confirme se o usuário está associado ao Apê 13-01 na tabela
              apartment_members e se o contrato está marcado como ativo.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const nextInstallmentNumber =
    payments.length === 0
      ? 1
      : Math.max(...payments.map((payment) => payment.installmentNumber)) + 1;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge
            variant="secondary"
            className="mb-3 bg-emerald-100 text-emerald-950"
          >
            {contract.amortizationSystem} + TR
          </Badge>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Financiamento
          </h2>

          <p className="mt-2 max-w-3xl text-slate-500">
            Contrato com {contract.bankName}. Acompanhe o histórico real e
            simule novas estratégias de amortização.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <FinancingPaymentDialog
            contractId={contract.id}
            nextInstallmentNumber={nextInstallmentNumber}
          />

          <ExtraAmortizationDialog contractId={contract.id} />
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <div className="mb-5">
            <h3 className="text-2xl font-semibold tracking-tight">
              Pagamentos do financiamento
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Parcelas efetivamente pagas e composição dos valores cobrados.
            </p>
          </div>

          <FinancingPaymentHistory
            contractId={contract.id}
            payments={payments}
            nextInstallmentNumber={nextInstallmentNumber}
          />
        </div>

        <div>
          <div className="mb-5">
            <h3 className="text-2xl font-semibold tracking-tight">
              Amortizações extraordinárias
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Valores pagos além das parcelas mensais para reduzir o saldo ou o
              prazo.
            </p>
          </div>

          <ExtraAmortizationHistory amortizations={amortizations} />
        </div>

        <div>
          <div className="mb-5">
            <h3 className="text-2xl font-semibold tracking-tight">
              Simulador de estratégia
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Compare cenários futuros sem alterar os registros reais do
              contrato.
            </p>
          </div>

          <FinancingSimulator contract={contract} />
        </div>
      </div>
    </section>
  );
}
