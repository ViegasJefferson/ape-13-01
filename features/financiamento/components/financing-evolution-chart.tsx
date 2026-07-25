"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FinancingInstallment } from "@/features/financiamento/types";
import {
  formatCompactCurrency,
  formatCurrency,
} from "@/features/financiamento/utils/simulate-financing";

interface FinancingEvolutionChartProps {
  baselineSchedule: FinancingInstallment[];
  scenarioSchedule: FinancingInstallment[];
}

interface ChartDataPoint {
  month: number;
  baselineBalance: number;
  scenarioBalance: number | null;
}

export function FinancingEvolutionChart({
  baselineSchedule,
  scenarioSchedule,
}: FinancingEvolutionChartProps) {
  const data: ChartDataPoint[] = baselineSchedule.map(
    (installment, index) => ({
      month: installment.installmentNumber,
      baselineBalance: installment.closingBalance,
      scenarioBalance:
        scenarioSchedule[index]?.closingBalance ?? null,
    }),
  );

  return (
    <div className="h-95 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tickFormatter={(month) => {
              const year = Math.ceil(Number(month) / 12);

              return `${year}º ano`;
            }}
            minTickGap={45}
          />

          <YAxis
            tickFormatter={(value) =>
              formatCompactCurrency(Number(value))
            }
            width={90}
          />

          <Tooltip
            labelFormatter={(month) =>
              `Prestação ${Number(month)}`
            }
            formatter={(value, name) => {
              const label =
                name === "baselineBalance"
                  ? "Contrato original"
                  : "Com amortizações";

              return [formatCurrency(Number(value)), label];
            }}
          />

          <Legend
            formatter={(value) =>
              value === "baselineBalance"
                ? "Contrato original"
                : "Com amortizações"
            }
          />

          <Line
            type="monotone"
            dataKey="baselineBalance"
            stroke="#64748b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="scenarioBalance"
            stroke="#064e3b"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}