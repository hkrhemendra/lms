import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/constants";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { readSession } from "@/lib/auth/session";
import type { Role, SessionUser } from "@/types";

export function homeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "librarian") return "/librarian";
  return "/member";
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await readSession(token);
  if (!session) return null;
  const user = await usersRepo.getById(session.sub);
  if (!user || user.status === "blocked") return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}

export async function hasSessionCookie(): Promise<boolean> {
  return Boolean((await cookies()).get(COOKIE_NAME)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
