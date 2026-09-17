import Link from "next/link";

import {
  CalendarDays,
  ChevronRight,
  FileText,
  Hammer,
  Images,
  Package,
  Ruler,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

import {
  getProjectOverview,
} from "@/features/dashboard/services/get-project-overview";

interface OverviewCardProps {
  title: string;
  description: string;
  value?: string;
  href: string;

  icon:
    React.ComponentType<{
      className?: string;
    }>;
}

function OverviewCard({
  title,
  description,
  value,
  href,
  icon: Icon,
}: OverviewCardProps) {
  return (
    <Link
      href={href}
      className="group block"
    >
      <Card className="h-full rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="flex h-full min-w-0 items-center gap-4 p-4 sm:p-5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-950">
            <Icon className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div>
                <p className="break-words font-medium text-slate-950">
                  {title}
                </p>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {description}
                </p>
              </div>

              {value && (
                <div className="shrink-0 text-2xl font-semibold tracking-tight text-slate-950">
                  {value}
                </div>
              )}
            </div>
          </div>

          <ChevronRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}

export async function ProjectOverview() {
  const data =
    await getProjectOverview();

  if (!data) {
    return null;
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>
          Visão do projeto
        </CardTitle>

        <p className="text-sm text-slate-500">
          Acompanhe rapidamente as
          principais áreas do
          apartamento.
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          <OverviewCard
            title="Reforma"
            value={String(
              data.renovationPending,
            )}
            description={
              data.renovationPending ===
              1
                ? "item pendente"
                : "itens pendentes"
            }
            href="/reforma"
            icon={Hammer}
          />

          <OverviewCard
            title="Arquitetura"
            value={String(
              data.architecturePending,
            )}
            description={
              data.architecturePending ===
              1
                ? "item aguardando conclusão"
                : "itens aguardando conclusão"
            }
            href="/arquitetura"
            icon={Ruler}
          />

          <OverviewCard
            title="Chá e enxoval"
            value={String(
              data.householdPending,
            )}
            description={`${data.householdTotal} item(ns) cadastrados`}
            href="/enxoval"
            icon={Package}
          />

          <OverviewCard
            title="Galeria"
            value={String(
              data.galleryUploads,
            )}
            description="uploads próprios da galeria"
            href="/galeria"
            icon={Images}
          />

          <OverviewCard
            title="Documentos"
            value={String(
              data.documentsTotal,
            )}
            description="arquivos armazenados"
            href="/documentos"
            icon={FileText}
          />

          <OverviewCard
            title="Agenda"
            description="Prazos, pagamentos e compromissos"
            href="/agenda"
            icon={CalendarDays}
          />
        </div>
      </CardContent>
    </Card>
  );
}