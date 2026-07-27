"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_EXTRA_AMORTIZATION_STATE } from "@/features/financiamento/actions/extra-amortization-action-state";
import { createExtraAmortization } from "@/features/financiamento/actions/create-extra-amortization";

interface ExtraAmortizationDialogProps {
  contractId: string;
}

interface FieldErrorProps {
  errors?: string[];
}

function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-xs text-red-700">
      {errors[0]}
    </p>
  );
}

export function ExtraAmortizationDialog({
  contractId,
}: ExtraAmortizationDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [open, setOpen] = useState(false);

  const [state, formAction, isPending] =
    useActionState(
      createExtraAmortization,
      INITIAL_EXTRA_AMORTIZATION_STATE,
    );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    setOpen(false);
    router.refresh();
  }, [router, state.status]);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950/40">
        <Plus className="size-4" />
        Registrar amortização
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Registrar amortização
          </DialogTitle>

          <DialogDescription>
            Cadastre uma amortização efetivamente
            realizada no contrato.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="space-y-5"
        >
          <input
            type="hidden"
            name="contractId"
            value={contractId}
          />

          <div className="space-y-2">
            <Label htmlFor="amortizationDate">
              Data da amortização
            </Label>

            <Input
              id="amortizationDate"
              name="amortizationDate"
              type="date"
              required
              aria-invalid={
                Boolean(
                  state.fieldErrors?.amortizationDate,
                )
              }
            />

            <FieldError
              errors={
                state.fieldErrors?.amortizationDate
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Valor amortizado
            </Label>

            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex.: 10000"
              required
              aria-invalid={
                Boolean(state.fieldErrors?.amount)
              }
            />

            <p className="text-xs text-slate-500">
              Informe somente o valor destinado à
              redução do saldo devedor.
            </p>

            <FieldError
              errors={state.fieldErrors?.amount}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reductionType">
              Tipo de redução
            </Label>

            <NativeSelect
              id="reductionType"
              name="reductionType"
              defaultValue="term"
              required
              aria-invalid={
                Boolean(
                  state.fieldErrors?.reductionType,
                )
              }
            >
              <NativeSelectOption value="term">
                Redução de prazo
              </NativeSelectOption>

              <NativeSelectOption value="payment">
                Redução da prestação
              </NativeSelectOption>
            </NativeSelect>

            <p className="text-xs text-slate-500">
              Para economizar mais juros, normalmente
              utilizaremos redução de prazo.
            </p>

            <FieldError
              errors={
                state.fieldErrors?.reductionType
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Observação
            </Label>

            <Textarea
              id="notes"
              name="notes"
              maxLength={500}
              placeholder="Ex.: amortização realizada com o décimo terceiro."
            />

            <FieldError
              errors={state.fieldErrors?.notes}
            />
          </div>

          {state.status === "error" && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {state.message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-950 hover:bg-emerald-900"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Salvando
                </>
              ) : (
                "Registrar amortização"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}