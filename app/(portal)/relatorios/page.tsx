import {
  connection,
} from "next/server";

import {
  AlertTriangle,
  FileSpreadsheet,
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
  ReportsDashboard,
} from "@/features/relatorios/components/reports-dashboard";

import {
  getReportsPageData,
} from "@/features/relatorios/services/get-reports-page-data";

export default async function RelatoriosPage() {
  await connection();

  try {
    const data =
      await getReportsPageData();

    if (!data) {
      return (
        <section className="mx-auto w-full max-w-[1680px]">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-950">
                Nenhum apartamento encontrado.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }

    return (
      <section className="mx-auto w-full max-w-[1680px]">
        <div className="mb-8">
          <Badge
            variant="secondary"
            className="mb-3 bg-emerald-100 text-emerald-950"
          >
            Dados e exportações
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <FileSpreadsheet className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Relatórios
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Consulte os principais
                números do apartamento e
                exporte os dados para
                planilhas.
              </p>
            </div>
          </div>
        </div>

        <ReportsDashboard
          data={data}
        />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro nos relatórios:",
      error,
    );

    return (
      <section className="mx-auto w-full max-w-[1680px]">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar
              os relatórios
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique os módulos de
              gastos, financiamento,
              reforma e enxoval.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}