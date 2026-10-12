import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildSeedData, type SeedData } from "@/lib/data/seed-data";

export type CollectionName = Exclude<keyof SeedData, "settings">;

const store = new AsyncLocalStorage<true>();
let chain: Promise<unknown> = Promise.resolve();

function dataDir() {
  return process.env.DATA_DIR ?? path.join(process.cwd(), "data");
}

function filePath(name: string) {
  return path.join(dataDir(), `${name}.json`);
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function locked<T>(task: () => Promise<T>): Promise<T> {
  if (store.getStore()) return task();
  return enqueue(() => store.run(true, task));
}

export function transaction<T>(task: () => Promise<T>): Promise<T> {
  if (store.getStore()) return task();
  return enqueue(() => store.run(true, task));
}

let seedCache: Promise<SeedData> | null = null;

function seedData() {
  seedCache ??= buildSeedData();
  return seedCache;
}

async function writeAtomic(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

async function readRawCollection<T>(name: CollectionName): Promise<T[]> {
  const file = filePath(name);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seed = await seedData();
    const rows = seed[name] as T[];
    await writeAtomic(file, rows);
    return rows;
  }
}

async function readRawDocument<T>(): Promise<T> {
  const file = filePath("settings");
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seed = await seedData();
    await writeAtomic(file, seed.settings);
    return seed.settings as T;
  }
}

export function readCollection<T>(name: CollectionName): Promise<T[]> {
  return locked(() => readRawCollection<T>(name));
}

export function writeCollection<T>(name: CollectionName, data: T[]): Promise<void> {
  return locked(async () => {
    await writeAtomic(filePath(name), data);
  });
}

export function updateCollection<T>(
  name: CollectionName,
  mutator: (rows: T[]) => T[] | Promise<T[]>,
): Promise<T[]> {
  return locked(async () => {
    const rows = await readRawCollection<T>(name);
    const next = await mutator(rows);
    await writeAtomic(filePath(name), next);
    return next;
  });
}

export function readDocument<T>(): Promise<T> {
  return locked(() => readRawDocument<T>());
}

export function writeDocument<T>(data: T): Promise<void> {
  return locked(async () => {
    await writeAtomic(filePath("settings"), data);
  });
}

export async function resetAll(data: SeedData): Promise<void> {
  await locked(async () => {
    await fs.mkdir(dataDir(), { recursive: true });
    const names = Object.keys(data) as (keyof SeedData)[];
    for (const name of names) {
      await writeAtomic(filePath(name), data[name]);
    }
  });
}
