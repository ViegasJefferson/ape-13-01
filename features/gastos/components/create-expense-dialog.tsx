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
  Plus,
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
import { createExpense } from "@/features/gastos/actions/expense-actions";
import type { ExpenseCategory } from "@/features/gastos/types";

interface CreateExpenseDialogProps {
  apartmentId: string;
  categories: ExpenseCategory[];
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

function getBrazilDateParts() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year",
  )?.value;

  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  const day = parts.find(
    (part) => part.type === "day",
  )?.value;

  return {
    date: `${year}-${month}-${day}`,
    month: `${year}-${month}`,
  };
}

export function CreateExpenseDialog({
  apartmentId,
  categories,
}: CreateExpenseDialogProps) {
  const router = useRouter();
  const formRef =
    useRef<HTMLFormElement>(null);

  const [open, setOpen] =
    useState(false);

  const [state, formAction, isPending] =
    useActionState(
      createExpense,
      INITIAL_EXPENSE_ACTION_STATE,
    );

  const currentDate =
    getBrazilDateParts();

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    setOpen(false);
    router.refresh();
  }, [router, state]);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-950/40">
        <Plus className="size-4" />
        Registrar gasto
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Registrar gasto
          </DialogTitle>

          <DialogDescription>
            Cadastre um gasto previsto ou já
            realizado relacionado ao apartamento.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="space-y-5"
        >
          <input
            type="hidden"
            name="apartmentId"
            value={apartmentId}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">
                Descrição
              </Label>

              <Input
                id="title"
                name="title"
                placeholder="Ex.: Taxa de obra de agosto"
                required
                aria-invalid={Boolean(
                  state.fieldErrors?.title,
                )}
              />

              <FieldError
                errors={
                  state.fieldErrors?.title
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Categoria
              </Label>

              <NativeSelect
                id="categoryId"
                name="categoryId"
                defaultValue=""
                required
                aria-invalid={Boolean(
                  state.fieldErrors?.categoryId,
                )}
              >
                <NativeSelectOption
                  value=""
                  disabled
                >
                  Selecione
                </NativeSelectOption>

                {categories.map(
                  (category) => (
                    <NativeSelectOption
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </NativeSelectOption>
                  ),
                )}
              </NativeSelect>

              <FieldError
                errors={
                  state.fieldErrors?.categoryId
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceMonth">
                Mês de referência
              </Label>

              <Input
                id="referenceMonth"
                name="referenceMonth"
                type="month"
                defaultValue={
                  currentDate.month
                }
                required
                aria-invalid={Boolean(
                  state.fieldErrors
                    ?.referenceMonth,
                )}
              />

              <FieldError
                errors={
                  state.fieldErrors
                    ?.referenceMonth
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Vencimento
              </Label>

              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={
                  currentDate.date
                }
                required
                aria-invalid={Boolean(
                  state.fieldErrors?.dueDate,
                )}
              />

              <FieldError
                errors={
                  state.fieldErrors?.dueDate
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plannedAmount">
                Valor previsto
              </Label>

              <Input
                id="plannedAmount"
                name="plannedAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex.: 1500,00"
                aria-invalid={Boolean(
                  state.fieldErrors
                    ?.plannedAmount,
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
              <Label htmlFor="paidAmount">
                Valor pago
              </Label>

              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                aria-invalid={Boolean(
                  state.fieldErrors?.paidAmount,
                )}
              />

              <FieldError
                errors={
                  state.fieldErrors
                    ?.paidAmount
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAt">
                Data do pagamento
              </Label>

              <Input
                id="paidAt"
                name="paidAt"
                type="date"
                aria-invalid={Boolean(
                  state.fieldErrors?.paidAt,
                )}
              />

              <p className="text-xs text-slate-500">
                Obrigatória somente quando
                houver valor pago.
              </p>

              <FieldError
                errors={
                  state.fieldErrors?.paidAt
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName">
                Fornecedor ou favorecido
              </Label>

              <Input
                id="vendorName"
                name="vendorName"
                placeholder="Ex.: Caixa ou construtora"
                aria-invalid={Boolean(
                  state.fieldErrors
                    ?.vendorName,
                )}
              />

              <FieldError
                errors={
                  state.fieldErrors
                    ?.vendorName
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Forma de pagamento
              </Label>

              <Input
                id="paymentMethod"
                name="paymentMethod"
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

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">
                Observação
              </Label>

              <Textarea
                id="notes"
                name="notes"
                maxLength={500}
                placeholder="Informações adicionais sobre o gasto."
              />

              <FieldError
                errors={
                  state.fieldErrors?.notes
                }
              />
            </div>
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
                "Registrar gasto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}