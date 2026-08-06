import { connection } from "next/server";
import {
  AlertTriangle,
  Hammer,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { RenovationDashboard } from "@/features/reforma/components/renovation-dashboard";
import { getRenovationPageData } from "@/features/reforma/services/get-renovation-page-data";

export default async function ReformaPage() {
  await connection();

  try {
    const data =
      await getRenovationPageData();

    if (!data) {
      return (
        <section className="mx-auto max-w-7xl">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-950">
                Nenhum apartamento encontrado
              </p>

              <p className="mt-2 text-sm text-amber-800">
                O usuário atual não está associado
                a um apartamento.
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
            Planejamento
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <Hammer className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Reforma
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Organize serviços, fornecedores,
                prazos e o orçamento da preparação
                do Apê 13-01.
              </p>
            </div>
          </div>
        </div>

        <RenovationDashboard data={data} />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro na página de reforma:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar a reforma
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique a tabela de reforma, as
              políticas RLS e a associação do
              usuário ao apartamento.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}