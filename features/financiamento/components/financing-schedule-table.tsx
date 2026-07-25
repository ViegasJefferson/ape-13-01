"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FinancingInstallment } from "@/features/financiamento/types";
import { formatCurrency } from "@/features/financiamento/utils/simulate-financing";

interface FinancingScheduleTableProps {
  schedule: FinancingInstallment[];
}

const ROWS_PER_PAGE = 12;

function formatInstallmentDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function FinancingScheduleTable({
  schedule,
}: FinancingScheduleTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    Math.ceil(schedule.length / ROWS_PER_PAGE),
    1,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [schedule]);

  const visibleInstallments = useMemo(() => {
    const firstIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const lastIndex = firstIndex + ROWS_PER_PAGE;

    return schedule.slice(firstIndex, lastIndex);
  }, [currentPage, schedule]);

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(page - 1, 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  }

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto rounded-xl border">
        <Table className="min-w-250">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">
                Parcela
              </TableHead>

              <TableHead className="whitespace-nowrap">
                Mês
              </TableHead>

              <TableHead className="whitespace-nowrap text-right">
                Saldo inicial
              </TableHead>

              <TableHead className="whitespace-nowrap text-right">
                Juros
              </TableHead>

              <TableHead className="whitespace-nowrap text-right">
                Amortização
              </TableHead>

              <TableHead className="whitespace-nowrap text-right">
                Extra
              </TableHead>

              <TableHead className="whitespace-nowrap text-right">
                Saldo final
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleInstallments.map((installment) => (
              <TableRow key={installment.installmentNumber}>
                <TableCell className="font-medium">
                  {installment.installmentNumber}
                </TableCell>

                <TableCell className="whitespace-nowrap capitalize">
                  {formatInstallmentDate(installment.dueDate)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right">
                  {formatCurrency(installment.openingBalance)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right">
                  {formatCurrency(installment.interest)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right">
                  {formatCurrency(installment.principalPayment)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right font-medium text-emerald-800">
                  {formatCurrency(installment.extraPayment)}
                </TableCell>

                <TableCell className="whitespace-nowrap text-right font-medium">
                  {formatCurrency(installment.closingBalance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">
          Exibindo {visibleInstallments.length} de{" "}
          {schedule.length} prestações
        </p>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={goToPreviousPage}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>

          <span className="min-w-24 text-center text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={goToNextPage}
          >
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}