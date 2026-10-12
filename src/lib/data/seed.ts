import "server-only";
import { resetAll } from "@/lib/data/json-store";
import { buildSeedData } from "@/lib/data/seed-data";

export async function resetData(): Promise<void> {
  const data = await buildSeedData();
  await resetAll(data);
}
