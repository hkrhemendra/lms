import "server-only";
import { updateCollection, readCollection, type CollectionName } from "@/lib/data/json-store";

export function makeRepo<T extends { id: string }>(name: CollectionName) {
  return {
    getAll(): Promise<T[]> {
      return readCollection<T>(name);
    },
    async getById(id: string): Promise<T | null> {
      const rows = await readCollection<T>(name);
      return rows.find((row) => row.id === id) ?? null;
    },
    async create(row: T): Promise<T> {
      await updateCollection<T>(name, (rows) => [...rows, row]);
      return row;
    },
    async update(id: string, patch: Partial<T>): Promise<T | null> {
      let updated: T | null = null;
      await updateCollection<T>(name, (rows) => {
        const index = rows.findIndex((row) => row.id === id);
        if (index < 0) return rows;
        updated = { ...rows[index], ...patch, id };
        const next = rows.slice();
        next[index] = updated;
        return next;
      });
      return updated;
    },
    async remove(id: string): Promise<void> {
      await updateCollection<T>(name, (rows) => rows.filter((row) => row.id !== id));
    },
  };
}
