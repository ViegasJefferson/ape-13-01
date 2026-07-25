import { Badge } from "@/components/ui/badge";
import { FinancingSimulator } from "@/features/financiamento/components/financing-simulator";

export default function FinanciamentoPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-8">
        <Badge
          variant="secondary"
          className="mb-3 bg-emerald-100 text-emerald-950"
        >
          Price + TR
        </Badge>

        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Financiamento
        </h2>

        <p className="mt-2 max-w-3xl text-slate-500">
          Simule o efeito das amortizações extraordinárias sobre o
          prazo, os juros e a data estimada de quitação do Apê 13-01.
        </p>
      </div>

      <FinancingSimulator />
    </section>
  );
}