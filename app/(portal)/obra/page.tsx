import { AlertTriangle, Building2 } from "lucide-react";
import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ConstructionDashboard } from "@/features/obra/components/construction-dashboard";
import { ConstructionUpdateDialog } from "@/features/obra/components/construction-update-dialog";
import { getConstructionDashboardData } from "@/features/obra/services/get-construction-dashboard-data";
import { ConstructionGallerySection } from "@/features/obra/components/construction-gallery-section";
import { getConstructionMedia } from "@/features/obra/services/get-construction-media";

export default async function ObraPage() {
  await connection();

  try {
    const data = await getConstructionDashboardData();

    if (!data) {
      return (
        <section className="mx-auto max-w-7xl">
          <Card className="rounded-2xl border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <p className="font-medium text-amber-950">
                Nenhum apartamento encontrado
              </p>

              <p className="mt-2 text-sm text-amber-800">
                O usuário não está associado a um apartamento.
              </p>
            </CardContent>
          </Card>
        </section>
      );
    }

    const media = await getConstructionMedia(data.apartmentId);

    return (
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge
              variant="secondary"
              className="mb-3 bg-emerald-100 text-emerald-950"
            >
              Acompanhamento da construção
            </Badge>

            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
                <Building2 className="size-5" />
              </div>

              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Evolução da obra
                </h2>

                <p className="mt-1 max-w-3xl text-slate-500">
                  Acompanhe o progresso geral, as etapas e o histórico mensal do
                  empreendimento.
                </p>
              </div>
            </div>
          </div>

          <ConstructionUpdateDialog
            apartmentId={data.apartmentId}
            stages={data.stages}
            currentUpdate={data.currentUpdate}
          />
        </div>

        <div className="space-y-6">
          <ConstructionDashboard data={data} />

          <ConstructionGallerySection
            apartmentId={data.apartmentId}
            stages={data.stages}
            media={media}
            defaultReferenceMonth={
              data.currentUpdate?.referenceMonth.slice(0, 7) ?? "2026-07"
            }
          />
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
              Não foi possível carregar a obra
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique as tabelas, os registros e as políticas RLS no Supabase.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}
