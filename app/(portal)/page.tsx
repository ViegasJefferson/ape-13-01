import {
  Building2,
  CalendarDays,
  Gift,
  Landmark,
  PiggyBank,
  WalletCards,
} from "lucide-react";

import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";

const modules = [
  {
    title: "Financiamento",
    description: "Parcelas, saldo devedor e amortizações.",
    icon: Landmark,
  },
  {
    title: "Obra",
    description: "Cronograma e evolução do empreendimento.",
    icon: Building2,
  },
  {
    title: "Chá e enxoval",
    description: "Lista de presentes e itens para o novo lar.",
    icon: Gift,
  },
];

export default function Home() {
  return (
     <section className="mx-auto max-w-7xl">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <Badge
                    variant="secondary"
                    className="mb-3 bg-emerald-100 text-emerald-950"
                  >
                    Apê 13-01
                  </Badge>

                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Boa noite, Jefferson.
                  </h2>

                  <p className="mt-2 max-w-2xl text-slate-500">
                    Acompanhe a obra, o financiamento e os preparativos para o
                    novo apartamento.
                  </p>
                </div>

                <Button className="bg-emerald-950 hover:bg-emerald-900">
                  Adicionar atualização
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  title="Valor do imóvel"
                  value="R$ 503.105,70"
                  description="Valor total previsto no contrato."
                  icon={WalletCards}
                />

                <MetricCard
                  title="Valor financiado"
                  value="R$ 398.619,60"
                  description="Financiamento contratado em 360 meses."
                  icon={Landmark}
                />

                <MetricCard
                  title="Meta de amortização"
                  value="R$ 50.000"
                  description="Planejamento para o primeiro ano."
                  icon={PiggyBank}
                />

                <MetricCard
                  title="Entrega prevista"
                  value="Janeiro de 2028"
                  description="Previsão atual para o Bloco 02."
                  icon={CalendarDays}
                />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <CardTitle>Jornada do apartamento</CardTitle>
                        <CardDescription>
                          Progresso geral até a entrega das chaves.
                        </CardDescription>
                      </div>

                      <Badge variant="outline">Em andamento</Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-3 flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-semibold">32%</p>
                        <p className="text-sm text-slate-500">
                          Progresso demonstrativo
                        </p>
                      </div>

                      <Building2 className="size-8 text-emerald-950" />
                    </div>

                    <Progress value={32} className="h-3" />

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Etapa atual
                        </p>
                        <p className="mt-2 font-medium">Construção</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Próximo marco
                        </p>
                        <p className="mt-2 font-medium">Acabamentos</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Unidade
                        </p>
                        <p className="mt-2 font-medium">Bloco 02 · 1301</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Próximas etapas</CardTitle>
                    <CardDescription>
                      Atividades prioritárias do projeto.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {[
                      "Cadastrar dados completos do financiamento",
                      "Importar o cronograma da obra",
                      "Montar a primeira lista do enxoval",
                      "Organizar contratos e plantas",
                    ].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 rounded-xl border p-3"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-950">
                          {index + 1}
                        </div>

                        <p className="text-sm leading-6 text-slate-700">
                          {item}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <section className="mt-8">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">Módulos</h3>
                  <p className="text-sm text-slate-500">
                    Acesse as principais áreas do portal.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {modules.map((module) => {
                    const Icon = module.icon;

                    return (
                      <Card
                        key={module.title}
                        className="rounded-2xl transition-transform hover:-translate-y-1"
                      >
                        <CardHeader>
                          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-emerald-950 text-white">
                            <Icon className="size-5" />
                          </div>

                          <CardTitle>{module.title}</CardTitle>
                          <CardDescription>
                            {module.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent>
                          <Button variant="outline" className="w-full">
                            Acessar módulo
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            </section>
  );
}