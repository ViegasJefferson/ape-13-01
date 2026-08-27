"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarPlus,
  LoaderCircle,
  Pencil,
} from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/Button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Input,
} from "@/components/ui/Input";

import {
  Label,
} from "@/components/ui/label";

import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  saveReminder,
} from "@/features/agenda/actions/reminder-actions";

import type {
  ApartmentReminder,
  ReminderEventType,
  ReminderPriority,
} from "@/features/agenda/types";

interface ReminderDialogProps {
  apartmentId: string;
  reminder?: ApartmentReminder;
}

export function ReminderDialog({
  apartmentId,
  reminder,
}: ReminderDialogProps) {
  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<
    string | null
  >(null);

  const isEditing =
    Boolean(reminder);

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const eventType =
      String(
        formData.get(
          "eventType",
        ) ?? "reminder",
      ) as ReminderEventType;

    const priority =
      String(
        formData.get(
          "priority",
        ) ?? "medium",
      ) as ReminderPriority;

    setErrorMessage(null);

    startTransition(
      async () => {
        const result =
          await saveReminder({
            id:
              reminder?.id,

            apartmentId,

            title:
              String(
                formData.get(
                  "title",
                ) ?? "",
              ),

            description:
              String(
                formData.get(
                  "description",
                ) ?? "",
              ) || null,

            eventType,

            priority,

            eventDate:
              String(
                formData.get(
                  "eventDate",
                ) ?? "",
              ),

            eventTime:
              String(
                formData.get(
                  "eventTime",
                ) ?? "",
              ) || null,
          });

        if (
          result.status ===
          "error"
        ) {
          setErrorMessage(
            result.message,
          );

          return;
        }

        setOpen(false);

        router.refresh();
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        setOpen
      }
    >
      <DialogTrigger
        className={
          isEditing
            ? buttonVariants({
                variant:
                  "outline",
                size: "sm",
              })
            : "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-medium text-white hover:bg-emerald-900"
        }
      >
        {isEditing ? (
          <>
            <Pencil className="size-4" />

            Editar
          </>
        ) : (
          <>
            <CalendarPlus className="size-4" />

            Novo lembrete
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar lembrete"
              : "Adicionar à agenda"}
          </DialogTitle>

          <DialogDescription>
            Registre compromissos,
            prazos e vencimentos
            relacionados ao apartamento.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="reminder-title">
              Título
            </Label>

            <Input
              id="reminder-title"
              name="title"
              required
              maxLength={150}
              defaultValue={
                reminder?.title ??
                ""
              }
              placeholder="Ex.: Reunião com arquiteto"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-type">
                Tipo
              </Label>

              <NativeSelect
                id="reminder-type"
                name="eventType"
                defaultValue={
                  reminder?.eventType ??
                  "reminder"
                }
              >
                <NativeSelectOption value="reminder">
                  Lembrete
                </NativeSelectOption>

                <NativeSelectOption value="payment">
                  Pagamento
                </NativeSelectOption>

                <NativeSelectOption value="financing">
                  Financiamento
                </NativeSelectOption>

                <NativeSelectOption value="construction">
                  Obra
                </NativeSelectOption>

                <NativeSelectOption value="renovation">
                  Reforma
                </NativeSelectOption>

                <NativeSelectOption value="document">
                  Documento
                </NativeSelectOption>

                <NativeSelectOption value="appointment">
                  Compromisso
                </NativeSelectOption>

                <NativeSelectOption value="other">
                  Outro
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-priority">
                Prioridade
              </Label>

              <NativeSelect
                id="reminder-priority"
                name="priority"
                defaultValue={
                  reminder?.priority ??
                  "medium"
                }
              >
                <NativeSelectOption value="low">
                  Baixa
                </NativeSelectOption>

                <NativeSelectOption value="medium">
                  Média
                </NativeSelectOption>

                <NativeSelectOption value="high">
                  Alta
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-date">
                Data
              </Label>

              <Input
                id="reminder-date"
                name="eventDate"
                type="date"
                required
                defaultValue={
                  reminder?.eventDate ??
                  ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-time">
                Horário
              </Label>

              <Input
                id="reminder-time"
                name="eventTime"
                type="time"
                defaultValue={
                  reminder?.eventTime
                    ?.slice(
                      0,
                      5,
                    ) ?? ""
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-description">
              Observações
            </Label>

            <Textarea
              id="reminder-description"
              name="description"
              maxLength={2000}
              defaultValue={
                reminder?.description ??
                ""
              }
              placeholder="Informações adicionais."
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={
                isPending
              }
              onClick={() =>
                setOpen(false)
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isPending
              }
              className="bg-emerald-950 hover:bg-emerald-900"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />

                  Salvando
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}