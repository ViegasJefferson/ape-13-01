export type ApartmentMemberRole =
  | "owner"
  | "editor"
  | "viewer";

export interface ApartmentMember {
  memberId: string;
  userId: string;
  email: string;
  displayName: string;
  role: ApartmentMemberRole;
  isCurrentUser: boolean;
}

export interface MembersPageData {
  apartmentId: string;
  apartmentName: string;
  members: ApartmentMember[];
  canManage: boolean;
}

export interface MemberActionResult {
  status: "success" | "error";
  message: string;
}

export interface AddApartmentMemberInput {
  apartmentId: string;
  email: string;
  role: ApartmentMemberRole;
}

export interface UpdateApartmentMemberRoleInput {
  memberId: string;
  role: ApartmentMemberRole;
}

export interface RemoveApartmentMemberInput {
  memberId: string;
}