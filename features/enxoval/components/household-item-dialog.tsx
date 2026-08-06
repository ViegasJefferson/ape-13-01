"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/Button";
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
import { saveHouseholdItem } from "@/features/enxoval/actions/household-actions";
import type {
  HouseholdItem,
  HouseholdItemPriority,
  HouseholdListType,
} from "@/features/enxoval/types";

import { ProductImportFields } from "@/features/enxoval/components/product-import-fields";

interface HouseholdItemDialogProps {
  apartmentId: string;
  item?: HouseholdItem;
}

export function HouseholdItemDialog({
  apartmentId,
  item,
}: HouseholdItemDialogProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(item);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    setErrorMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const listType = String(
      formData.get("listType") ?? "trousseau",
    ) as HouseholdListType;

    const priority = String(
      formData.get("priority") ?? "medium",
    ) as HouseholdItemPriority;

    setErrorMessage(null);

    startTransition(async () => {
      const result = await saveHouseholdItem({
        id: item?.id,
        apartmentId,
        listType,

        title: String(formData.get("title") ?? ""),

        category: String(formData.get("category") ?? ""),

        room: String(formData.get("room") ?? "") || null,

        priority,

        desiredQuantity: Number(formData.get("desiredQuantity") ?? 1),

        purchasedQuantity: Number(formData.get("purchasedQuantity") ?? 0),

        receivedQuantity: Number(formData.get("receivedQuantity") ?? 0),

        estimatedUnitAmount: Number(formData.get("estimatedUnitAmount") ?? 0),

        actualTotalAmount: Number(formData.get("actualTotalAmount") ?? 0),

        storeName: String(formData.get("storeName") ?? "") || null,

        productUrl: String(formData.get("productUrl") ?? "") || null,

        productImageUrl: String(formData.get("productImageUrl") ?? "") || null,

        notes: String(formData.get("notes") ?? "") || null,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {isEditing ? "Editar item" : "Adicionar item"}
          </DialogTitle>

          <DialogDescription>
            Registre itens do enxoval, compras planejadas e presentes recebidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <ProductImportFields
              key={`${item?.id ?? "new"}-${open}`}
              fieldIdSuffix={item?.id ?? "new"}
              defaultTitle={item?.title ?? ""}
              defaultStoreName={item?.storeName ?? ""}
              defaultProductUrl={item?.productUrl ?? ""}
              defaultEstimatedUnitAmount={item?.estimatedUnitAmount ?? 0}
              defaultProductImageUrl={item?.productImageUrl ?? ""}
            />

            <div className="space-y-2">
              <Label htmlFor={`list-type-${item?.id ?? "new"}`}>Lista</Label>

              <NativeSelect
                id={`list-type-${item?.id ?? "new"}`}
                name="listType"
                defaultValue={item?.listType ?? "trousseau"}
              >
                <NativeSelectOption value="trousseau">
                  Enxoval
                </NativeSelectOption>

                <NativeSelectOption value="housewarming">
                  Chá de panela
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
                defaultValue={item?.priority ?? "medium"}
              >
                <NativeSelectOption value="low">Baixa</NativeSelectOption>

                <NativeSelectOption value="medium">Média</NativeSelectOption>

                <NativeSelectOption value="high">Alta</NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`category-${item?.id ?? "new"}`}>Categoria</Label>

              <Input
                id={`category-${item?.id ?? "new"}`}
                name="category"
                defaultValue={item?.category ?? ""}
                maxLength={100}
                required
                list="household-category-options"
                placeholder="Ex.: Utensílios"
              />

              <datalist id="household-category-options">
                <option value="Cama e banho" />
                <option value="Cozinha" />
                <option value="Eletrodomésticos" />
                <option value="Eletrônicos" />
                <option value="Limpeza" />
                <option value="Organização" />
                <option value="Decoração" />
                <option value="Móveis" />
                <option value="Utensílios" />
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`room-${item?.id ?? "new"}`}>Ambiente</Label>

              <Input
                id={`room-${item?.id ?? "new"}`}
                name="room"
                defaultValue={item?.room ?? ""}
                maxLength={100}
                placeholder="Ex.: Cozinha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`desired-${item?.id ?? "new"}`}>
                Quantidade desejada
              </Label>

              <Input
                id={`desired-${item?.id ?? "new"}`}
                name="desiredQuantity"
                type="number"
                min="1"
                step="1"
                defaultValue={item?.desiredQuantity ?? 1}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`purchased-${item?.id ?? "new"}`}>
                Quantidade comprada
              </Label>

              <Input
                id={`purchased-${item?.id ?? "new"}`}
                name="purchasedQuantity"
                type="number"
                min="0"
                step="1"
                defaultValue={item?.purchasedQuantity ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`received-${item?.id ?? "new"}`}>
                Presentes recebidos
              </Label>

              <Input
                id={`received-${item?.id ?? "new"}`}
                name="receivedQuantity"
                type="number"
                min="0"
                step="1"
                defaultValue={item?.receivedQuantity ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`actual-${item?.id ?? "new"}`}>
                Total efetivamente gasto
              </Label>

              <Input
                id={`actual-${item?.id ?? "new"}`}
                name="actualTotalAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={item?.actualTotalAmount ?? 0}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`notes-${item?.id ?? "new"}`}>Observações</Label>

              <Textarea
                id={`notes-${item?.id ?? "new"}`}
                name="notes"
                defaultValue={item?.notes ?? ""}
                maxLength={2000}
                placeholder="Modelo, tamanho, cor ou outras informações."
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
