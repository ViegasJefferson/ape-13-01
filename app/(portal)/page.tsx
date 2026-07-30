import { connection } from "next/server";
import {
  AlertTriangle,
  Home,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { HomeDashboard } from "@/features/dashboard/components/home-dashboard";
import { getHomeDashboardData } from "@/features/dashboard/services/get-home-dashboard-data";

export default async function HomePage() {
  await connection();

  try {
    const data =
      await getHomeDashboardData();

    if (!data) {
      return (
        <section className="mx-auto max-w-7xl">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-950">
                Nenhum apartamento encontrado
              </p>

              <p className="mt-2 text-sm text-amber-800">
                O usuário atual não está
                associado a um apartamento.
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
            Visão geral
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <Home className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Painel do apartamento
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Acompanhe obra, financiamento,
                gastos e os próximos compromissos
                do Apê 13-01.
              </p>
            </div>
          </div>
        </div>

        <HomeDashboard data={data} />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro no dashboard:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-800">
              <AlertTriangle className="size-5" />
            </div>

            <CardTitle className="text-red-950">
              Não foi possível carregar o
              dashboard
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-red-800">
              Verifique a sessão do usuário, as
              consultas ao Supabase e as políticas
              de acesso.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}