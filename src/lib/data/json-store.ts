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
let memoryMode = false;
const memory = new Map<string, unknown>();

function seedData() {
  seedCache ??= buildSeedData();
  return seedCache;
}

function diskFailure(error: unknown): "missing" | "fallback" | "fatal" {
  if (error instanceof SyntaxError) return "fatal";
  const code = (error as NodeJS.ErrnoException).code;
  if (code === "ENOENT") return "missing";
  if (typeof code === "string") return "fallback";
  const message = error instanceof Error ? error.message : "";
  if (/read-only|EROFS|EACCES|ENOTDIR|not implemented|dynamic require/i.test(message)) return "fallback";
  return "fatal";
}

async function rememberSeed() {
  const seed = await seedData();
  for (const key of Object.keys(seed) as (keyof SeedData)[]) {
    if (!memory.has(key)) memory.set(key, structuredClone(seed[key]));
  }
}

function fromMemory<T>(name: string): T {
  return structuredClone(memory.get(name)) as T;
}

async function useMemory(name: string, data?: unknown) {
  memoryMode = true;
  await rememberSeed();
  if (data !== undefined) memory.set(name, structuredClone(data));
}

async function writeAtomic(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

async function saveFile(name: string, data: unknown) {
  if (memoryMode) {
    memory.set(name, structuredClone(data));
    return;
  }
  try {
    await writeAtomic(filePath(name), data);
  } catch (error) {
    if (diskFailure(error) !== "fallback") throw error;
    await useMemory(name, data);
  }
}

async function readRawCollection<T>(name: CollectionName): Promise<T[]> {
  if (memoryMode) {
    await rememberSeed();
    return fromMemory<T[]>(name);
  }
  try {
    const raw = await fs.readFile(filePath(name), "utf8");
    return JSON.parse(raw) as T[];
  } catch (error) {
    const kind = diskFailure(error);
    if (kind === "fatal") throw error;
    if (kind === "fallback") {
      await useMemory(name);
      return fromMemory<T[]>(name);
    }
    const seed = await seedData();
    const rows = structuredClone(seed[name]) as T[];
    await saveFile(name, rows);
    return memoryMode ? fromMemory<T[]>(name) : rows;
  }
}

async function readRawDocument<T>(): Promise<T> {
  if (memoryMode) {
    await rememberSeed();
    return fromMemory<T>("settings");
  }
  try {
    const raw = await fs.readFile(filePath("settings"), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const kind = diskFailure(error);
    if (kind === "fatal") throw error;
    if (kind === "fallback") {
      await useMemory("settings");
      return fromMemory<T>("settings");
    }
    const seed = await seedData();
    const settings = structuredClone(seed.settings) as T;
    await saveFile("settings", settings);
    return memoryMode ? fromMemory<T>("settings") : settings;
  }
}

export function readCollection<T>(name: CollectionName): Promise<T[]> {
  return locked(() => readRawCollection<T>(name));
}

export function writeCollection<T>(name: CollectionName, data: T[]): Promise<void> {
  return locked(async () => {
    await saveFile(name, data);
  });
}

export function updateCollection<T>(
  name: CollectionName,
  mutator: (rows: T[]) => T[] | Promise<T[]>,
): Promise<T[]> {
  return locked(async () => {
    const rows = await readRawCollection<T>(name);
    const next = await mutator(rows);
    await saveFile(name, next);
    return next;
  });
}

export function readDocument<T>(): Promise<T> {
  return locked(() => readRawDocument<T>());
}

export function writeDocument<T>(data: T): Promise<void> {
  return locked(async () => {
    await saveFile("settings", data);
  });
}

export async function resetAll(data: SeedData): Promise<void> {
  await locked(async () => {
    try {
      if (!memoryMode) await fs.mkdir(dataDir(), { recursive: true });
    } catch (error) {
      if (diskFailure(error) === "fatal") throw error;
      memoryMode = true;
    }
    const names = Object.keys(data) as (keyof SeedData)[];
    for (const name of names) {
      await saveFile(name, data[name]);
    }
  });
}
