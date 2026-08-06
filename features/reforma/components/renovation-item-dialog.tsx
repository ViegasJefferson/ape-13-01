"use client";

import {
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  Pencil,
  Plus,
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
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveRenovationItem } from "@/features/reforma/actions/renovation-actions";
import type {
  RenovationItem,
  RenovationItemPriority,
  RenovationItemStatus,
} from "@/features/reforma/types";

interface RenovationItemDialogProps {
  apartmentId: string;
  item?: RenovationItem;
}

export function RenovationItemDialog({
  apartmentId,
  item,
}: RenovationItemDialogProps) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [isPending, startTransition] =
    useTransition();

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const isEditing = Boolean(item);

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    setOpen(nextOpen);
    setErrorMessage(null);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const status = String(
      formData.get("status") ?? "planned",
    ) as RenovationItemStatus;

    const priority = String(
      formData.get("priority") ?? "medium",
    ) as RenovationItemPriority;

    setErrorMessage(null);

    startTransition(async () => {
      const result =
        await saveRenovationItem({
          id: item?.id,
          apartmentId,

          title: String(
            formData.get("title") ?? "",
          ),

          area:
            String(
              formData.get("area") ?? "",
            ) || null,

          status,
          priority,

          plannedAmount: Number(
            formData.get("plannedAmount") ??
              0,
          ),

          actualAmount: Number(
            formData.get("actualAmount") ??
              0,
          ),

          vendorName:
            String(
              formData.get("vendorName") ??
                "",
            ) || null,

          targetDate:
            String(
              formData.get("targetDate") ??
                "",
            ) || null,

          notes:
            String(
              formData.get("notes") ?? "",
            ) || null,
        });

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      if (!isEditing) {
        form.reset();
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        className={
          isEditing
            ? buttonVariants({
                variant: "outline",
                size: "sm",
              })
            : "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-900"
        }
      >
        {isEditing ? (
          <>
            <Pencil className="size-4" />
            Editar
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Adicionar item
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar item da reforma"
              : "Adicionar item à reforma"}
          </DialogTitle>

          <DialogDescription>
            Registre serviços, compras e etapas
            necessárias para preparar o
            apartamento.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`title-${item?.id ?? "new"}`}>
                Item ou serviço
              </Label>

              <Input
                id={`title-${item?.id ?? "new"}`}
                name="title"
                defaultValue={item?.title ?? ""}
                maxLength={150}
                required
                placeholder="Ex.: Projeto de marcenaria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`area-${item?.id ?? "new"}`}>
                Ambiente
              </Label>

              <Input
                id={`area-${item?.id ?? "new"}`}
                name="area"
                defaultValue={item?.area ?? ""}
                maxLength={100}
                placeholder="Ex.: Cozinha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`vendor-${item?.id ?? "new"}`}>
                Fornecedor
              </Label>

              <Input
                id={`vendor-${item?.id ?? "new"}`}
                name="vendorName"
                defaultValue={
                  item?.vendorName ?? ""
                }
                maxLength={150}
                placeholder="Ex.: Marcenaria Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`status-${item?.id ?? "new"}`}>
                Situação
              </Label>

              <NativeSelect
                id={`status-${item?.id ?? "new"}`}
                name="status"
                defaultValue={
                  item?.status ?? "planned"
                }
              >
                <NativeSelectOption value="planned">
                  Planejado
                </NativeSelectOption>

                <NativeSelectOption value="quoting">
                  Em orçamento
                </NativeSelectOption>

                <NativeSelectOption value="approved">
                  Aprovado
                </NativeSelectOption>

                <NativeSelectOption value="in_progress">
                  Em andamento
                </NativeSelectOption>

                <NativeSelectOption value="completed">
                  Concluído
                </NativeSelectOption>

                <NativeSelectOption value="cancelled">
                  Cancelado
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`priority-${item?.id ?? "new"}`}>
                Prioridade
              </Label>

              <NativeSelect
                id={`priority-${item?.id ?? "new"}`}
                name="priority"
                defaultValue={
                  item?.priority ?? "medium"
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
              <Label htmlFor={`planned-${item?.id ?? "new"}`}>
                Orçamento previsto
              </Label>

              <Input
                id={`planned-${item?.id ?? "new"}`}
                name="plannedAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  item?.plannedAmount ?? 0
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`actual-${item?.id ?? "new"}`}>
                Valor realizado
              </Label>

              <Input
                id={`actual-${item?.id ?? "new"}`}
                name="actualAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  item?.actualAmount ?? 0
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`target-${item?.id ?? "new"}`}>
                Prazo desejado
              </Label>

              <Input
                id={`target-${item?.id ?? "new"}`}
                name="targetDate"
                type="date"
                defaultValue={
                  item?.targetDate ?? ""
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`notes-${item?.id ?? "new"}`}>
                Observações
              </Label>

              <Textarea
                id={`notes-${item?.id ?? "new"}`}
                name="notes"
                defaultValue={item?.notes ?? ""}
                maxLength={2000}
                placeholder="Detalhes, medidas, materiais e condições do orçamento."
              />
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
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
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Adicionar item"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}