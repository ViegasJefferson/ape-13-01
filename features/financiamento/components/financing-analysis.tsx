import { BarChart3, TableProperties } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FinancingEvolutionChart } from "@/features/financiamento/components/financing-evolution-chart";
import { FinancingScheduleTable } from "@/features/financiamento/components/financing-schedule-table";
import type { FinancingSimulationResult } from "@/features/financiamento/types";

interface FinancingAnalysisProps {
  baseline: FinancingSimulationResult;
  scenario: FinancingSimulationResult;
}

export function FinancingAnalysis({
  baseline,
  scenario,
}: FinancingAnalysisProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle>Evolução do saldo devedor</CardTitle>

        <CardDescription>
          Visualize a redução do saldo e consulte o demonstrativo
          mensal da estratégia simulada.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="chart">
              <BarChart3 className="size-4" />
              Evolução
            </TabsTrigger>

            <TabsTrigger value="schedule">
              <TableProperties className="size-4" />
              Demonstrativo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-6">
            <FinancingEvolutionChart
              baselineSchedule={baseline.schedule}
              scenarioSchedule={scenario.schedule}
            />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <FinancingScheduleTable
              schedule={scenario.schedule}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}