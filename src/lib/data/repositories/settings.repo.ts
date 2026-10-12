import "server-only";
import { readDocument, writeDocument } from "@/lib/data/json-store";
import type { Settings } from "@/types";

export const settingsRepo = {
  get(): Promise<Settings> {
    return readDocument<Settings>();
  },
  async update(patch: Partial<Settings>): Promise<Settings> {
    const current = await readDocument<Settings>();
    const next = { ...current, ...patch };
    await writeDocument(next);
    return next;
  },
};
