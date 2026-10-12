import "server-only";
import { addDays, todayDate } from "@/lib/dates";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { logActivity } from "@/lib/services/activity.service";
import { LibraryError } from "@/lib/services/errors";
import type { Member, MemberType, User } from "@/types";

export async function createMember(
  input: {
    name: string;
    email: string;
    password: string;
    memberType: MemberType;
    enrolmentNo: string;
    course?: string;
    department?: string;
    phone: string;
    address?: string;
    photoUrl?: string;
    validTill: string;
  },
  actorId: string,
): Promise<Member> {
  const existing = await usersRepo.getByEmail(input.email);
  if (existing) throw new LibraryError("An account with this email already exists.");
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: "member",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  const member: Member = {
    id: crypto.randomUUID(),
    userId: user.id,
    memberCode: await membersRepo.nextCode(),
    memberType: input.memberType,
    enrolmentNo: input.enrolmentNo,
    course: input.course || undefined,
    department: input.department || undefined,
    phone: input.phone,
    address: input.address || undefined,
    photoUrl: input.photoUrl || undefined,
    validTill: input.validTill,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await usersRepo.create(user);
  await membersRepo.create(member);
  await logActivity({
    userId: actorId,
    action: "create_member",
    entity: "member",
    entityId: member.id,
    details: `Registered ${member.memberCode} ${user.name}.`,
  });
  return member;
}

export async function updateMember(
  id: string,
  patch: Partial<Pick<Member, "phone" | "address" | "photoUrl" | "course" | "department" | "validTill" | "status">>,
  actorId: string,
) {
  const member = await membersRepo.getById(id);
  if (!member) throw new LibraryError("Member was not found.");
  const updated = await membersRepo.update(id, patch);
  await logActivity({
    userId: actorId,
    action: "update_member",
    entity: "member",
    entityId: id,
    details: `Updated ${member.memberCode}.`,
  });
  return updated;
}

export async function updateOwnProfile(
  userId: string,
  patch: { phone: string; address?: string; photoUrl?: string },
) {
  const member = await membersRepo.getByUserId(userId);
  if (!member) throw new LibraryError("Member profile was not found.");
  return updateMember(
    member.id,
    {
      phone: patch.phone,
      address: patch.address || undefined,
      photoUrl: patch.photoUrl || undefined,
    },
    userId,
  );
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await usersRepo.getById(userId);
  if (!user) throw new LibraryError("Account was not found.");
  const matches = await verifyPassword(currentPassword, user.passwordHash);
  if (!matches) throw new LibraryError("Current password is incorrect.");
  await usersRepo.update(user.id, { passwordHash: await hashPassword(newPassword) });
  await logActivity({
    userId,
    action: "change_password",
    entity: "user",
    entityId: user.id,
    details: "Changed password.",
  });
}

export async function createLibrarian(input: { name: string; email: string; password: string }, actorId: string) {
  const existing = await usersRepo.getByEmail(input.email);
  if (existing) throw new LibraryError("An account with this email already exists.");
  const user: User = {
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: "librarian",
    status: "active",
    createdAt: new Date().toISOString(),
  };
  await usersRepo.create(user);
  await logActivity({
    userId: actorId,
    action: "create_librarian",
    entity: "user",
    entityId: user.id,
    details: `Created librarian account for ${user.name}.`,
  });
  return user;
}

export async function setUserStatus(id: string, status: "active" | "blocked", actorId: string) {
  const user = await usersRepo.getById(id);
  if (!user) throw new LibraryError("Account was not found.");
  if (user.role === "admin") throw new LibraryError("Admin accounts cannot be blocked here.");
  await usersRepo.update(id, { status });
  await logActivity({
    userId: actorId,
    action: status === "blocked" ? "block_user" : "unblock_user",
    entity: "user",
    entityId: id,
    details: `${status === "blocked" ? "Blocked" : "Unblocked"} ${user.email}.`,
  });
}

export function defaultValidTill(memberType: MemberType) {
  return addDays(todayDate(), memberType === "faculty" ? 365 * 5 : 365 * 2);
}
