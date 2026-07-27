import { AlertTriangle, Database } from "lucide-react";

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

export default async function FinanciamentoPage() {
  let contract;

  try {
    contract = await getActiveFinancingContract();
  } catch (error) {
    console.error(error);

    return (
      <section className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Badge
            variant="secondary"
            className="mb-3 bg-red-100 text-red-900"
          >
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
              Verifique as variáveis de ambiente, a sessão do usuário e
              as políticas de segurança do banco.
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
              O usuário autenticado não possui acesso a um contrato
              ativo.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-amber-800">
              Confirme se o usuário está associado ao Apê 13-01 na
              tabela apartment_members e se o contrato está marcado
              como ativo.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8">
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
          Contrato com {contract.bankName}. Simule o efeito das
          amortizações extraordinárias sobre o prazo, os juros e a
          data estimada de quitação.
        </p>
      </div>

      <FinancingSimulator contract={contract} />
    </section>
  );
}