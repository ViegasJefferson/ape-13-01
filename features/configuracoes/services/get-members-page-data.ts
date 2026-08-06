import type {
  ApartmentMember,
  ApartmentMemberRole,
  MembersPageData,
} from "@/features/configuracoes/types";
import { createClient } from "@/lib/supabase/server";

interface ApartmentRow {
  id: string;
  name: string;
}

interface MemberDirectoryRow {
  member_id: string;
  user_id: string;
  email: string;
  display_name: string;
  member_role: string;
  is_current_user: boolean;
}

const validRoles: ApartmentMemberRole[] = [
  "owner",
  "editor",
  "viewer",
];

function isMemberRole(
  value: string,
): value is ApartmentMemberRole {
  return validRoles.includes(
    value as ApartmentMemberRole,
  );
}

export async function getMembersPageData(): Promise<
  MembersPageData | null
> {
  const supabase = await createClient();

  const {
    data: apartmentData,
    error: apartmentError,
  } = await supabase
    .from("apartments")
    .select("id, name")
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (apartmentError) {
    throw new Error(
      `Não foi possível carregar o apartamento: ${apartmentError.message}`,
    );
  }

  if (!apartmentData) {
    return null;
  }

  const apartment =
    apartmentData as ApartmentRow;

  const {
    data: membersData,
    error: membersError,
  } = await supabase.rpc(
    "get_apartment_member_directory",
    {
      p_apartment_id: apartment.id,
    },
  );

  if (membersError) {
    throw new Error(
      `Não foi possível carregar os membros: ${membersError.message}`,
    );
  }

  const members: ApartmentMember[] = (
    (membersData ?? []) as MemberDirectoryRow[]
  ).map((row) => {
    if (!isMemberRole(row.member_role)) {
      throw new Error(
        `Permissão inválida encontrada: ${row.member_role}.`,
      );
    }

    return {
      memberId: row.member_id,
      userId: row.user_id,
      email: row.email,
      displayName: row.display_name,
      role: row.member_role,
      isCurrentUser: row.is_current_user,
    };
  });

  const currentMember = members.find(
    (member) => member.isCurrentUser,
  );

  return {
    apartmentId: apartment.id,
    apartmentName: apartment.name,
    members,
    canManage:
      currentMember?.role === "owner",
  };
}