import {
  connection,
} from "next/server";

import {
  AlertTriangle,
  Ruler,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

import {
  ArchitectureDashboard,
} from "@/features/arquitetura/components/architecture-dashboard";

import {
  getArchitecturePageData,
} from "@/features/arquitetura/services/get-architecture-page-data";

export default async function ArchitecturePage() {
  await connection();

  try {
    const data =
      await getArchitecturePageData();

    if (!data) {
      return (
        <section className="mx-auto max-w-7xl">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              Nenhum apartamento encontrado.
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
            Projeto e decisões
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <Ruler className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Arquitetura
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Acompanhe ambientes,
                versões, entregas,
                decisões e revisões do
                projeto do apartamento.
              </p>
            </div>
          </div>
        </div>

        <ArchitectureDashboard
          data={data}
        />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro em Arquitetura:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar Arquitetura
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique a tabela
              architecture_items e as
              permissões do apartamento.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}