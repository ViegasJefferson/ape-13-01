"use client";

import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Crown,
  Eye,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
import {
  addApartmentMember,
  removeApartmentMember,
  updateApartmentMemberRole,
} from "@/features/configuracoes/actions/member-actions";
import type {
  ApartmentMember,
  ApartmentMemberRole,
  MembersPageData,
} from "@/features/configuracoes/types";

interface MembersSettingsProps {
  data: MembersPageData;
}

const roleLabels: Record<
  ApartmentMemberRole,
  string
> = {
  owner: "Proprietário",
  editor: "Editor",
  viewer: "Visualizador",
};

const roleDescriptions: Record<
  ApartmentMemberRole,
  string
> = {
  owner:
    "Acesso total, inclusive gerenciamento de membros.",
  editor:
    "Pode cadastrar e atualizar os dados do apartamento.",
  viewer:
    "Pode consultar os dados, sem realizar alterações.",
};

function RoleIcon({
  role,
}: {
  role: ApartmentMemberRole;
}) {
  if (role === "owner") {
    return <Crown className="size-5" />;
  }

  if (role === "editor") {
    return <Pencil className="size-5" />;
  }

  return <Eye className="size-5" />;
}

export function MembersSettings({
  data,
}: MembersSettingsProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [addDialogOpen, setAddDialogOpen] =
    useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [
    selectedRoles,
    setSelectedRoles,
  ] = useState<
    Record<string, ApartmentMemberRole>
  >(() =>
    Object.fromEntries(
      data.members.map((member) => [
        member.memberId,
        member.role,
      ]),
    ),
  );

  useEffect(() => {
    setSelectedRoles(
      Object.fromEntries(
        data.members.map((member) => [
          member.memberId,
          member.role,
        ]),
      ),
    );
  }, [data.members]);

  const ownerCount = data.members.filter(
    (member) => member.role === "owner",
  ).length;

  const editorCount = data.members.filter(
    (member) => member.role === "editor",
  ).length;

  const viewerCount = data.members.filter(
    (member) => member.role === "viewer",
  ).length;

  function handleAddMember(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = String(
      formData.get("email") ?? "",
    );

    const role = String(
      formData.get("role") ?? "editor",
    ) as ApartmentMemberRole;

    setFeedback(null);

    startTransition(async () => {
      const result =
        await addApartmentMember({
          apartmentId: data.apartmentId,
          email,
          role,
        });

      setFeedback({
        type: result.status,
        message: result.message,
      });

      if (result.status === "success") {
        form.reset();
        setAddDialogOpen(false);
        router.refresh();
      }
    });
  }

  function handleUpdateRole(
    member: ApartmentMember,
  ) {
    const role =
      selectedRoles[member.memberId] ??
      member.role;

    setFeedback(null);

    startTransition(async () => {
      const result =
        await updateApartmentMemberRole({
          memberId: member.memberId,
          role,
        });

      setFeedback({
        type: result.status,
        message: result.message,
      });

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  function handleRemoveMember(
    member: ApartmentMember,
  ) {
    const confirmed = window.confirm(
      `Remover o acesso de ${member.displayName}?`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result =
        await removeApartmentMember({
          memberId: member.memberId,
        });

      setFeedback({
        type: result.status,
        message: result.message,
      });

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Crown className="size-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Proprietários
              </p>

              <p className="text-2xl font-semibold">
                {ownerCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
              <Pencil className="size-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Editores
              </p>

              <p className="text-2xl font-semibold">
                {editorCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Eye className="size-5" />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Visualizadores
              </p>

              <p className="text-2xl font-semibold">
                {viewerCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {feedback && (
        <div
          role="alert"
          className={
            feedback.type === "success"
              ? "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              : "rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          }
        >
          {feedback.message}
        </div>
      )}

      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <CardTitle>
              Membros do {data.apartmentName}
            </CardTitle>

            <CardDescription className="mt-2">
              Controle quem pode visualizar ou
              editar as informações do apartamento.
            </CardDescription>
          </div>

          {data.canManage && (
            <Dialog
              open={addDialogOpen}
              onOpenChange={setAddDialogOpen}
            >
              <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-950 px-4 text-sm font-medium text-white hover:bg-emerald-900">
                <UserPlus className="size-4" />
                Adicionar membro
              </DialogTrigger>

              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    Adicionar membro
                  </DialogTitle>

                  <DialogDescription>
                    O usuário precisa já possuir uma
                    conta cadastrada no Apê 13-01.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleAddMember}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">
                      E-mail
                    </Label>

                    <Input
                      id="memberEmail"
                      name="email"
                      type="email"
                      required
                      placeholder="usuario@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="memberRole">
                      Permissão
                    </Label>

                    <NativeSelect
                      id="memberRole"
                      name="role"
                      defaultValue="editor"
                    >
                      <NativeSelectOption value="owner">
                        Proprietário
                      </NativeSelectOption>

                      <NativeSelectOption value="editor">
                        Editor
                      </NativeSelectOption>

                      <NativeSelectOption value="viewer">
                        Visualizador
                      </NativeSelectOption>
                    </NativeSelect>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() =>
                        setAddDialogOpen(false)
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
                          Adicionando
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {data.members.map((member) => {
            const selectedRole =
              selectedRoles[member.memberId] ??
              member.role;

            const isOnlyOwner =
              member.role === "owner" &&
              ownerCount === 1;

            return (
              <article
                key={member.memberId}
                className="flex flex-col justify-between gap-5 rounded-2xl border p-5 lg:flex-row lg:items-center"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-950">
                    <RoleIcon role={member.role} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {member.displayName}
                      </p>

                      <Badge variant="secondary">
                        {roleLabels[member.role]}
                      </Badge>

                      {member.isCurrentUser && (
                        <Badge className="bg-emerald-100 text-emerald-950">
                          Você
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 break-all text-sm text-slate-500">
                      {member.email}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {roleDescriptions[member.role]}
                    </p>
                  </div>
                </div>

                {data.canManage && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <NativeSelect
                      value={selectedRole}
                      disabled={
                        isPending || isOnlyOwner
                      }
                      onChange={(event) =>
                        setSelectedRoles(
                          (current) => ({
                            ...current,
                            [member.memberId]:
                              event.target
                                .value as ApartmentMemberRole,
                          }),
                        )
                      }
                    >
                      <NativeSelectOption value="owner">
                        Proprietário
                      </NativeSelectOption>

                      <NativeSelectOption value="editor">
                        Editor
                      </NativeSelectOption>

                      <NativeSelectOption value="viewer">
                        Visualizador
                      </NativeSelectOption>
                    </NativeSelect>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        isPending ||
                        isOnlyOwner ||
                        selectedRole === member.role
                      }
                      onClick={() =>
                        handleUpdateRole(member)
                      }
                    >
                      <ShieldCheck className="size-4" />
                      Salvar
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      disabled={
                        isPending || isOnlyOwner
                      }
                      aria-label={`Remover ${member.displayName}`}
                      onClick={() =>
                        handleRemoveMember(member)
                      }
                    >
                      <Trash2 className="size-4 text-red-700" />
                    </Button>
                  </div>
                )}
              </article>
            );
          })}

          {data.members.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Users className="mx-auto mb-3 size-8 text-slate-400" />

              <p className="font-medium">
                Nenhum membro encontrado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!data.canManage && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-800" />

            <div>
              <p className="font-medium text-sky-950">
                Consulta de permissões
              </p>

              <p className="mt-1 text-sm leading-6 text-sky-800">
                Apenas um proprietário pode
                adicionar membros, alterar funções
                ou remover acessos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}