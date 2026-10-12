import "server-only";
import { makeRepo } from "@/lib/data/repo";
import type { User } from "@/types";

const repo = makeRepo<User>("users");

export const usersRepo = {
  ...repo,
  async getByEmail(email: string): Promise<User | null> {
    const rows = await repo.getAll();
    return rows.find((row) => row.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
};
