"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
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
import { INITIAL_CONSTRUCTION_UPDATE_STATE } from "@/features/obra/actions/construction-update-action-state";
import { saveConstructionUpdate } from "@/features/obra/actions/save-construction-update";
import type {
  ConstructionStage,
  ConstructionUpdate,
} from "@/features/obra/types";

interface ConstructionUpdateDialogProps {
  apartmentId: string;
  stages: ConstructionStage[];
  currentUpdate:
    | ConstructionUpdate
    | null;
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

function getNextReferenceMonth(
  referenceMonth: string | null,
) {
  if (!referenceMonth) {
    const now = new Date();

    return [
      now.getFullYear(),
      String(
        now.getMonth() + 1,
      ).padStart(2, "0"),
    ].join("-");
  }

  const [year, month] =
    referenceMonth
      .split("-")
      .map(Number);

  const nextMonth = new Date(
    year,
    month,
    1,
  );

  return [
    nextMonth.getFullYear(),
    String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0"),
  ].join("-");
}

export function ConstructionUpdateDialog({
  apartmentId,
  stages,
  currentUpdate,
}: ConstructionUpdateDialogProps) {
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
    saveConstructionUpdate,
    INITIAL_CONSTRUCTION_UPDATE_STATE,
  );

  const defaultReferenceMonth =
    getNextReferenceMonth(
      currentUpdate?.referenceMonth ??
        null,
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
        Registrar atualização
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Atualizar evolução da obra
          </DialogTitle>

          <DialogDescription>
            Registre os percentuais informados
            pela construtora para o mês.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          action={formAction}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="apartmentId"
            value={apartmentId}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="referenceMonth">
                Mês de referência
              </Label>

              <Input
                id="referenceMonth"
                name="referenceMonth"
                type="month"
                defaultValue={
                  defaultReferenceMonth
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
              <Label htmlFor="overallProgress">
                Progresso geral
              </Label>

              <div className="relative">
                <Input
                  id="overallProgress"
                  name="overallProgress"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={
                    currentUpdate
                      ?.overallProgress ?? 0
                  }
                  className="pr-10"
                  required
                  aria-invalid={Boolean(
                    state.fieldErrors
                      ?.overallProgress,
                  )}
                />

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
                  %
                </span>
              </div>

              <FieldError
                errors={
                  state.fieldErrors
                    ?.overallProgress
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="constructionStatus">
                Situação
              </Label>

              <NativeSelect
                id="constructionStatus"
                name="constructionStatus"
                defaultValue={
                  currentUpdate?.status ??
                  "in_progress"
                }
                required
              >
                <NativeSelectOption value="not_started">
                  Não iniciada
                </NativeSelectOption>

                <NativeSelectOption value="in_progress">
                  Em andamento
                </NativeSelectOption>

                <NativeSelectOption value="paused">
                  Pausada
                </NativeSelectOption>

                <NativeSelectOption value="completed">
                  Concluída
                </NativeSelectOption>
              </NativeSelect>

              <FieldError
                errors={
                  state.fieldErrors
                    ?.constructionStatus
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceName">
                Fonte da atualização
              </Label>

              <Input
                id="sourceName"
                name="sourceName"
                defaultValue={
                  currentUpdate
                    ?.sourceName ??
                  "Aplicativo da construtora"
                }
                maxLength={150}
                placeholder="Ex.: aplicativo da construtora"
              />

              <FieldError
                errors={
                  state.fieldErrors
                    ?.sourceName
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
                <Building2 className="size-5" />
              </div>

              <div>
                <p className="font-medium">
                  Etapas da obra
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Os valores atuais foram
                  utilizados como ponto de
                  partida. Altere conforme a
                  nova atualização.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {stages.map((stage) => (
                <div
                  key={stage.id}
                  className="space-y-2"
                >
                  <Label
                    htmlFor={`stage-${stage.id}`}
                  >
                    {stage.name}
                  </Label>

                  <div className="relative">
                    <Input
                      id={`stage-${stage.id}`}
                      name={`stage-${stage.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={
                        stage.progress
                      }
                      className="pr-10"
                      required
                      aria-invalid={Boolean(
                        state.fieldErrors
                          ?.stages?.[
                          stage.id
                        ],
                      )}
                    />

                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
                      %
                    </span>
                  </div>

                  <FieldError
                    errors={
                      state.fieldErrors
                        ?.stages?.[
                        stage.id
                      ]
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Observações
            </Label>

            <Textarea
              id="notes"
              name="notes"
              maxLength={1000}
              defaultValue={
                currentUpdate?.notes ?? ""
              }
              placeholder="Informações adicionais divulgadas pela construtora."
            />

            <FieldError
              errors={
                state.fieldErrors?.notes
              }
            />
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
            Ao selecionar um mês que já
            possui atualização, os dados
            daquele mês serão substituídos
            pelos novos valores.
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
                "Salvar atualização"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}