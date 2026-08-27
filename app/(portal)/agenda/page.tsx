import {
  connection,
} from "next/server";

import {
  AlertTriangle,
  CalendarClock,
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
  AgendaDashboard,
} from "@/features/agenda/components/agenda-dashboard";

import {
  getAgendaPageData,
} from "@/features/agenda/services/get-agenda-page-data";

export default async function AgendaPage() {
  await connection();

  try {
    const data =
      await getAgendaPageData();

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
            Prazos e compromissos
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <CalendarClock className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Agenda
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Acompanhe vencimentos,
                compromissos e prazos do
                Apê 13-01.
              </p>
            </div>
          </div>
        </div>

        <AgendaDashboard
          data={data}
        />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro na agenda:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar
              a agenda
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique a tabela de
              lembretes e as permissões
              do apartamento.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}