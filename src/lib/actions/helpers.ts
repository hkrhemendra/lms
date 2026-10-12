import "server-only";
import type { ZodError } from "zod";
import { LibraryError } from "@/lib/services/errors";
import type { ActionResult } from "@/types";

export function zodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    errors[key] ??= [];
    errors[key].push(issue.message);
  }
  return errors;
}

export async function runAction<T>(work: () => Promise<T>, message: string): Promise<ActionResult<T>> {
  try {
    const data = await work();
    return { success: true, message, data };
  } catch (error) {
    if (error instanceof LibraryError) return { success: false, message: error.message };
    console.error(error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
