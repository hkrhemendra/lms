import { jwtVerify } from "jose";
import type { Role } from "@/types";

export async function readRole(token: string, authSecret: string): Promise<Role | null> {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(authSecret));
    if (payload.role === "admin" || payload.role === "librarian" || payload.role === "member") {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
}
