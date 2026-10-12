import { chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, expect, it } from "vitest";
import { readCollection } from "@/lib/data/json-store";

const dir = await mkdtemp(path.join(tmpdir(), "library-ro-"));
await chmod(dir, 0o555);
process.env.DATA_DIR = path.join(dir, "data");

afterAll(async () => {
  await chmod(dir, 0o755);
  await rm(dir, { recursive: true, force: true });
});

it("serves the demo library when the disk cannot be written", async () => {
  const books = await readCollection<{ title: string }>("books");
  expect(books.length).toBeGreaterThan(0);
  const again = await readCollection<{ title: string }>("books");
  expect(again).toHaveLength(books.length);
});
