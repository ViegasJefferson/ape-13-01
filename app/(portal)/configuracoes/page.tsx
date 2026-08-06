import { connection } from "next/server";
import {
  AlertTriangle,
  Settings,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { MembersSettings } from "@/features/configuracoes/components/members-settings";
import { getMembersPageData } from "@/features/configuracoes/services/get-members-page-data";

export default async function ConfiguracoesPage() {
  await connection();

  try {
    const data =
      await getMembersPageData();

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
            Acesso compartilhado
          </Badge>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white">
              <Settings className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Configurações
              </h1>

              <p className="mt-1 max-w-3xl text-slate-500">
                Gerencie os membros e as
                permissões do Apê 13-01.
              </p>
            </div>
          </div>
        </div>

        <MembersSettings data={data} />
      </section>
    );
  } catch (error) {
    console.error(
      "Erro nas configurações:",
      error,
    );

    return (
      <section className="mx-auto max-w-7xl">
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardHeader>
            <AlertTriangle className="size-6 text-red-800" />

            <CardTitle className="text-red-950">
              Não foi possível carregar as
              configurações
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-red-800">
              Verifique as funções de membros e as
              permissões do banco de dados.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }
}