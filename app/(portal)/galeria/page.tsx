import {
  connection,
} from "next/server";

import {
  AlertTriangle,
  Images,
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
  GalleryDashboard,
} from "@/features/galeria/components/gallery-dashboard";

import {
  getGalleryPageData,
} from "@/features/galeria/services/get-gallery-page-data";

export default async function GalleryPage() {
  await connection();

  try {
    const data =
      await getGalleryPageData();

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
            Central de imagens
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <Images className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Galeria
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Todas as imagens do
                apartamento reunidas em
                um só lugar.
              </p>
            </div>
          </div>
        </div>

        <GalleryDashboard
          data={data}
        />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro na galeria:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar
              a galeria
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique as tabelas de
              mídia, o Storage e as
              permissões do apartamento.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}