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
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_FINANCING_PAYMENT_STATE } from "@/features/financiamento/actions/financing-payment-action-state";
import { saveFinancingPayment } from "@/features/financiamento/actions/save-financing-payment";
import type { FinancingPayment } from "@/features/financiamento/types";

interface FinancingPaymentDialogProps {
  contractId: string;
  nextInstallmentNumber: number;
  payment?: FinancingPayment;
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

export function FinancingPaymentDialog({
  contractId,
  nextInstallmentNumber,
  payment,
}: FinancingPaymentDialogProps) {
  const router = useRouter();

  const formRef =
    useRef<HTMLFormElement>(null);

  const [open, setOpen] =
    useState(false);

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    saveFinancingPayment,
    INITIAL_FINANCING_PAYMENT_STATE,
  );

  const isEditing = Boolean(payment);

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
        className={
          isEditing
            ? "inline-flex h-8 items-center justify-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-xs transition-colors hover:bg-accent"
            : "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-950 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-emerald-900"
        }
      >
        {isEditing ? (
          <>
            <Pencil className="size-3.5" />
            Editar
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Registrar parcela
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Editar parcela ${payment?.installmentNumber}`
              : "Registrar parcela paga"}
          </DialogTitle>

          <DialogDescription>
            Informe os valores apresentados no
            demonstrativo ou extrato do banco.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="contractId"
            value={contractId}
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="installmentNumber">
                Número da parcela
              </Label>

              <Input
                id="installmentNumber"
                name="installmentNumber"
                type="number"
                min="1"
                step="1"
                defaultValue={
                  payment?.installmentNumber ??
                  nextInstallmentNumber
                }
                readOnly={isEditing}
                required
              />

              <FieldError
                errors={
                  state.fieldErrors
                    ?.installmentNumber
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
                  payment?.dueDate ?? ""
                }
                required
              />

              <FieldError
                errors={
                  state.fieldErrors?.dueDate
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
                defaultValue={
                  payment?.paidAt ?? ""
                }
                required
              />

              <FieldError
                errors={
                  state.fieldErrors?.paidAt
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="mb-5">
              <p className="font-medium">
                Prestação-base
              </p>

              <p className="mt-1 text-sm text-slate-500">
                A prestação-base normalmente é
                composta pela amortização do
                principal e pelos juros.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="regularPayment">
                  Prestação-base paga
                </Label>

                <Input
                  id="regularPayment"
                  name="regularPayment"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.regularPayment ??
                    ""
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.regularPayment
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="principalAmount">
                  Amortização principal
                </Label>

                <Input
                  id="principalAmount"
                  name="principalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.principalAmount ??
                    ""
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.principalAmount
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interestAmount">
                  Juros
                </Label>

                <Input
                  id="interestAmount"
                  name="interestAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.interestAmount ??
                    ""
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.interestAmount
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="mb-5">
              <p className="font-medium">
                Seguros e encargos
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Informe zero nos campos que não
                aparecerem no demonstrativo.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="trAdjustment">
                  TR ou correção
                </Label>

                <Input
                  id="trAdjustment"
                  name="trAdjustment"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.trAdjustment ?? 0
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.trAdjustment
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mioAmount">
                  Seguro MIP/MIO
                </Label>

                <Input
                  id="mioAmount"
                  name="mioAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.mioAmount ?? 0
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.mioAmount
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dfiAmount">
                  Seguro DFI/DFC
                </Label>

                <Input
                  id="dfiAmount"
                  name="dfiAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.dfiAmount ?? 0
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.dfiAmount
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="administrativeFee">
                  Taxa administrativa
                </Label>

                <Input
                  id="administrativeFee"
                  name="administrativeFee"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment
                      ?.administrativeFee ?? 0
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.administrativeFee
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherFees">
                  Outros encargos
                </Label>

                <Input
                  id="otherFees"
                  name="otherFees"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment?.otherFees ?? 0
                  }
                  required
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.otherFees
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remainingBalance">
                  Saldo após pagamento
                </Label>

                <Input
                  id="remainingBalance"
                  name="remainingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    payment
                      ?.remainingBalance ?? ""
                  }
                  placeholder="Opcional"
                />

                <FieldError
                  errors={
                    state.fieldErrors
                      ?.remainingBalance
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentNotes">
              Observações
            </Label>

            <Textarea
              id="paymentNotes"
              name="notes"
              maxLength={500}
              defaultValue={
                payment?.notes ?? ""
              }
              placeholder="Ex.: pagamento realizado por débito automático."
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
                "Salvar parcela"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}