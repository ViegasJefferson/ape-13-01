import { AlertTriangle, ReceiptText } from "lucide-react";

import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ExpenseDashboard } from "@/features/gastos/components/expense-dashboard";
import { getExpenseDashboardData } from "@/features/gastos/services/get-expense-dashboard-data";
import { CreateExpenseDialog } from "@/features/gastos/components/create-expense-dialog";
import { ApartmentCostSummary } from "@/features/gastos/components/apartment-cost-summary";
import { getApartmentCostSummary } from "@/features/gastos/services/get-apartment-cost-summary";

export default async function GastosPage() {
  await connection();

  try {
    const data = await getExpenseDashboardData();

    if (!data) {
      return (
        <section className="mx-auto max-w-7xl">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-950">
                Nenhum apartamento encontrado
              </p>

              <p className="mt-2 text-sm text-amber-800">
                O usuário atual não está associado a um apartamento.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }

    const costSummary = await getApartmentCostSummary(data.apartmentId);

    return (
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge
              variant="secondary"
              className="mb-3 bg-emerald-100 text-emerald-950"
            >
              Controle financeiro
            </Badge>

            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
                <ReceiptText className="size-5" />
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Gastos
                </h2>

                <p className="mt-1 max-w-3xl text-slate-500">
                  Acompanhe os gastos previstos e realizados relacionados ao
                  apartamento.
                </p>
              </div>
            </div>
          </div>

          <CreateExpenseDialog
            apartmentId={data.apartmentId}
            categories={data.categories}
          />
        </div>

        <div className="space-y-10">
          <ExpenseDashboard data={data} />

          <ApartmentCostSummary summary={costSummary} />
        </div>
      </section>
    );
  } catch (error) {
    console.error(error);

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-800">
              <AlertTriangle className="size-5" />
            </div>

            <CardTitle className="text-red-950">
              Não foi possível carregar os gastos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique a conexão com o Supabase e as políticas de acesso das
              novas tabelas.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}
