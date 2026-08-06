"use server";

import { revalidatePath } from "next/cache";

import type {
  AddApartmentMemberInput,
  ApartmentMemberRole,
  MemberActionResult,
  RemoveApartmentMemberInput,
  UpdateApartmentMemberRoleInput,
} from "@/features/configuracoes/types";
import { createClient } from "@/lib/supabase/server";

const validRoles: ApartmentMemberRole[] = [
  "owner",
  "editor",
  "viewer",
];

function isMemberRole(
  role: string,
): role is ApartmentMemberRole {
  return validRoles.includes(
    role as ApartmentMemberRole,
  );
}

export async function addApartmentMember(
  input: AddApartmentMemberInput,
): Promise<MemberActionResult> {
  const email = input.email
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "Informe um e-mail válido.",
    };
  }

  if (!isMemberRole(input.role)) {
    return {
      status: "error",
      message: "A permissão é inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const { error } = await supabase.rpc(
    "add_apartment_member_by_email",
    {
      p_apartment_id:
        input.apartmentId,
      p_email: email,
      p_role: input.role,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/configuracoes");

  return {
    status: "success",
    message:
      "Membro adicionado ao apartamento.",
  };
}

export async function updateApartmentMemberRole(
  input: UpdateApartmentMemberRoleInput,
): Promise<MemberActionResult> {
  if (!isMemberRole(input.role)) {
    return {
      status: "error",
      message: "A permissão é inválida.",
    };
  }

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const { error } = await supabase.rpc(
    "update_apartment_member_role",
    {
      p_member_id: input.memberId,
      p_role: input.role,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/configuracoes");

  return {
    status: "success",
    message: "Permissão atualizada.",
  };
}

export async function removeApartmentMember(
  input: RemoveApartmentMemberInput,
): Promise<MemberActionResult> {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims?.sub
  ) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente.",
    };
  }

  const { error } = await supabase.rpc(
    "remove_apartment_member",
    {
      p_member_id: input.memberId,
    },
  );

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  revalidatePath("/configuracoes");

  return {
    status: "success",
    message:
      "O acesso do membro foi removido.",
  };
}