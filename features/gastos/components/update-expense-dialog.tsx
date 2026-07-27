"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Pencil,
} from "lucide-react";

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
import { INITIAL_EXPENSE_ACTION_STATE } from "@/features/gastos/actions/expense-action-state";
import { updateExpense } from "@/features/gastos/actions/expense-actions";
import type { Expense } from "@/features/gastos/types";

interface UpdateExpenseDialogProps {
  expense: Expense;
}

interface FieldErrorProps {
  errors?: string[];
}

function FieldError({
  errors,
}: FieldErrorProps) {
  if (!errors?.length) {
    return null;
  }

  return (
    <p className="text-xs text-red-700">
      {errors[0]}
    </p>
  );
}

export function UpdateExpenseDialog({
  expense,
}: UpdateExpenseDialogProps) {
  const router = useRouter();
  const formRef =
    useRef<HTMLFormElement>(null);

  const [open, setOpen] =
    useState(false);

  const [state, formAction, isPending] =
    useActionState(
      updateExpense,
      INITIAL_EXPENSE_ACTION_STATE,
    );

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    setOpen(false);
    router.refresh();
  }, [router, state]);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label={`Atualizar ${expense.title}`}
      >
        <Pencil className="size-3.5" />
        Atualizar
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Atualizar lançamento
          </DialogTitle>

          <DialogDescription>
            {expense.title}
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="space-y-5"
        >
          <input
            type="hidden"
            name="expenseId"
            value={expense.id}
          />

          <input
            type="hidden"
            name="apartmentId"
            value={expense.apartmentId}
          />

          <div className="space-y-2">
            <Label htmlFor={`plannedAmount-${expense.id}`}>
              Valor previsto
            </Label>

            <Input
              id={`plannedAmount-${expense.id}`}
              name="plannedAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                expense.plannedAmount ?? ""
              }
              aria-invalid={Boolean(
                state.fieldErrors?.plannedAmount,
              )}
            />

            <FieldError
              errors={
                state.fieldErrors
                  ?.plannedAmount
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`paidAmount-${expense.id}`}>
              Valor pago
            </Label>

            <Input
              id={`paidAmount-${expense.id}`}
              name="paidAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={
                expense.paidAmount
              }
              aria-invalid={Boolean(
                state.fieldErrors?.paidAmount,
              )}
            />

            <FieldError
              errors={
                state.fieldErrors?.paidAmount
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`paidAt-${expense.id}`}>
              Data do pagamento
            </Label>

            <Input
              id={`paidAt-${expense.id}`}
              name="paidAt"
              type="date"
              defaultValue={
                expense.paidAt ?? ""
              }
              aria-invalid={Boolean(
                state.fieldErrors?.paidAt,
              )}
            />

            <FieldError
              errors={
                state.fieldErrors?.paidAt
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`vendorName-${expense.id}`}>
              Fornecedor ou favorecido
            </Label>

            <Input
              id={`vendorName-${expense.id}`}
              name="vendorName"
              defaultValue={
                expense.vendorName ?? ""
              }
              placeholder="Ex.: Caixa ou construtora"
              aria-invalid={Boolean(
                state.fieldErrors?.vendorName,
              )}
            />

            <FieldError
              errors={
                state.fieldErrors?.vendorName
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`paymentMethod-${expense.id}`}>
              Forma de pagamento
            </Label>

            <Input
              id={`paymentMethod-${expense.id}`}
              name="paymentMethod"
              defaultValue={
                expense.paymentMethod ?? ""
              }
              placeholder="Ex.: débito automático"
              aria-invalid={Boolean(
                state.fieldErrors
                  ?.paymentMethod,
              )}
            />

            <FieldError
              errors={
                state.fieldErrors
                  ?.paymentMethod
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`statusMode-${expense.id}`}>
              Situação
            </Label>

            <NativeSelect
              id={`statusMode-${expense.id}`}
              name="statusMode"
              defaultValue={
                expense.status ===
                "cancelled"
                  ? "cancelled"
                  : "automatic"
              }
            >
              <NativeSelectOption value="automatic">
                Calcular pelo pagamento
              </NativeSelectOption>

              <NativeSelectOption value="cancelled">
                Cancelado
              </NativeSelectOption>
            </NativeSelect>

            <p className="text-xs leading-5 text-slate-500">
              O sistema marcará automaticamente
              como previsto, parcial ou pago.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${expense.id}`}>
              Observação
            </Label>

            <Textarea
              id={`notes-${expense.id}`}
              name="notes"
              maxLength={500}
              defaultValue={
                expense.notes ?? ""
              }
            />

            <FieldError
              errors={
                state.fieldErrors?.notes
              }
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
              onClick={() =>
                setOpen(false)
              }
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
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}