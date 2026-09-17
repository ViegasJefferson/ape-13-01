"use client";

import {
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  LoaderCircle,
  Pencil,
  Ruler,
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
  saveArchitectureItem,
} from "@/features/arquitetura/actions/architecture-actions";

import type {
  ArchitectureItem,
  ArchitectureItemType,
  ArchitecturePriority,
  ArchitectureStatus,
} from "@/features/arquitetura/types";

interface ArchitectureItemDialogProps {
  apartmentId: string;
  item?: ArchitectureItem;
}

export function ArchitectureItemDialog({
  apartmentId,
  item,
}: ArchitectureItemDialogProps) {
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
    Boolean(item);

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    setErrorMessage(null);

    startTransition(
      async () => {
        const result =
          await saveArchitectureItem({
            id:
              item?.id,

            apartmentId,

            title:
              String(
                formData.get(
                  "title",
                ) ?? "",
              ),

            room:
              String(
                formData.get(
                  "room",
                ) ?? "",
              ) || null,

            itemType:
              String(
                formData.get(
                  "itemType",
                ) ?? "deliverable",
              ) as ArchitectureItemType,

            status:
              String(
                formData.get(
                  "status",
                ) ?? "planned",
              ) as ArchitectureStatus,

            priority:
              String(
                formData.get(
                  "priority",
                ) ?? "medium",
              ) as ArchitecturePriority,

            versionLabel:
              String(
                formData.get(
                  "versionLabel",
                ) ?? "",
              ) || null,

            professionalName:
              String(
                formData.get(
                  "professionalName",
                ) ?? "",
              ) || null,

            targetDate:
              String(
                formData.get(
                  "targetDate",
                ) ?? "",
              ) || null,

            description:
              String(
                formData.get(
                  "description",
                ) ?? "",
              ) || null,

            notes:
              String(
                formData.get(
                  "notes",
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
            <Ruler className="size-4" />
            Novo registro
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar Arquitetura"
              : "Adicionar à Arquitetura"}
          </DialogTitle>

          <DialogDescription>
            Registre entregas,
            versões, decisões e
            pendências do projeto.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="architectureTitle">
              Título
            </Label>

            <Input
              id="architectureTitle"
              name="title"
              required
              maxLength={150}
              defaultValue={
                item?.title ??
                ""
              }
              placeholder="Ex.: Projeto executivo da cozinha"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="architectureRoom">
                Ambiente
              </Label>

              <Input
                id="architectureRoom"
                name="room"
                maxLength={100}
                defaultValue={
                  item?.room ??
                  ""
                }
                placeholder="Ex.: Cozinha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="architectureType">
                Tipo
              </Label>

              <NativeSelect
                id="architectureType"
                name="itemType"
                defaultValue={
                  item?.itemType ??
                  "deliverable"
                }
              >
                <NativeSelectOption value="deliverable">
                  Entrega
                </NativeSelectOption>

                <NativeSelectOption value="version">
                  Versão do projeto
                </NativeSelectOption>

                <NativeSelectOption value="decision">
                  Decisão
                </NativeSelectOption>

                <NativeSelectOption value="meeting">
                  Reunião
                </NativeSelectOption>

                <NativeSelectOption value="task">
                  Pendência / tarefa
                </NativeSelectOption>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="architectureStatus">
                Status
              </Label>

              <NativeSelect
                id="architectureStatus"
                name="status"
                defaultValue={
                  item?.status ??
                  "planned"
                }
              >
                <NativeSelectOption value="planned">
                  Planejado
                </NativeSelectOption>

                <NativeSelectOption value="in_progress">
                  Em andamento
                </NativeSelectOption>

                <NativeSelectOption value="review">
                  Em revisão
                </NativeSelectOption>

                <NativeSelectOption value="approved">
                  Aprovado
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
              <Label htmlFor="architecturePriority">
                Prioridade
              </Label>

              <NativeSelect
                id="architecturePriority"
                name="priority"
                defaultValue={
                  item?.priority ??
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
              <Label htmlFor="architectureVersion">
                Versão
              </Label>

              <Input
                id="architectureVersion"
                name="versionLabel"
                maxLength={50}
                defaultValue={
                  item?.versionLabel ??
                  ""
                }
                placeholder="Ex.: V2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="architectureProfessional">
                Arquiteto / profissional
              </Label>

              <Input
                id="architectureProfessional"
                name="professionalName"
                maxLength={150}
                defaultValue={
                  item?.professionalName ??
                  ""
                }
                placeholder="Nome do profissional"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="architectureDate">
                Prazo
              </Label>

              <Input
                id="architectureDate"
                name="targetDate"
                type="date"
                defaultValue={
                  item?.targetDate ??
                  ""
                }
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="architectureDescription">
                Descrição
              </Label>

              <Textarea
                id="architectureDescription"
                name="description"
                maxLength={2000}
                defaultValue={
                  item?.description ??
                  ""
                }
                placeholder="O que deve ser entregue ou decidido?"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="architectureNotes">
                Observações
              </Label>

              <Textarea
                id="architectureNotes"
                name="notes"
                maxLength={3000}
                defaultValue={
                  item?.notes ??
                  ""
                }
                placeholder="Ajustes solicitados, decisões e informações adicionais."
              />
            </div>
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