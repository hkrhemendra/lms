"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { requireRole, requireUser, homeForRole } from "@/lib/auth/get-current-user";
import { verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie, signSession } from "@/lib/auth/session";
import { usersRepo } from "@/lib/data/repositories/users.repo";
import { zodErrors, runAction } from "@/lib/actions/helpers";
import {
  bookSchema,
  categorySchema,
  copySchema,
  forgotSchema,
  issueSchema,
  librarianSchema,
  loginSchema,
  memberSchema,
  memberUpdateSchema,
  passwordSchema,
  paySchema,
  profileSchema,
  renewSchema,
  reserveSchema,
  returnSchema,
  settingsSchema,
  waiveSchema,
} from "@/lib/validations";
import { issueBook, renewIssue, returnBook } from "@/lib/services/circulation.service";
import { addCopy, deleteBook, deleteCategory, saveBook, saveCategory, updateCopy } from "@/lib/services/catalogue.service";
import { markFinePaid, waiveFine } from "@/lib/services/fines.service";
import { forceDailyChecks } from "@/lib/services/notifications.service";
import { changePassword, createLibrarian, createMember, setUserStatus, updateMember, updateOwnProfile } from "@/lib/services/people.service";
import { cancelReservation, reserveBook } from "@/lib/services/reservations.service";
import { notificationsRepo } from "@/lib/data/repositories/notifications.repo";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";
import { membersRepo } from "@/lib/data/repositories/members.repo";
import type { ActionResult } from "@/types";

function safeNext(value: string | undefined, role: "admin" | "librarian" | "member") {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return homeForRole(role);
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const user = await usersRepo.getByEmail(parsed.data.email);
  const matches = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !matches) return { success: false, message: "Email or password is incorrect." };
  if (user.status === "blocked") return { success: false, message: "This account is blocked. Contact the library." };
  await setSessionCookie(
    await signSession({ sub: user.id, role: user.role, email: user.email, name: user.name }),
  );
  redirect(safeNext(parsed.data.next, user.role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function forgotAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Enter a valid email", errors: zodErrors(parsed.error) };
  return { success: true, message: "If this email exists, a reset link has been sent." };
}

export async function saveCategoryAction(input: unknown, id?: string): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => saveCategory(parsed.data, user.id, id), id ? "Category updated" : "Category added");
  if (result.success) revalidatePath("/librarian/categories");
  return result;
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const result = await runAction(() => deleteCategory(id, user.id), "Category deleted");
  if (result.success) revalidatePath("/librarian/categories");
  return result;
}

export async function saveBookAction(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const pages = parsed.data.pages === "" || parsed.data.pages == null ? undefined : Number(parsed.data.pages);
  const result = await runAction(
    () =>
      saveBook(
        {
          title: parsed.data.title,
          author: parsed.data.author,
          isbn: parsed.data.isbn,
          publisher: parsed.data.publisher,
          edition: parsed.data.edition,
          year: parsed.data.year,
          categoryId: parsed.data.categoryId,
          language: parsed.data.language,
          pages,
          description: parsed.data.description || undefined,
          coverImage: parsed.data.coverImage || undefined,
        },
        user.id,
        id,
      ),
    id ? "Book updated" : "Book added",
  );
  if (!result.success || !result.data) return { success: false, message: result.message, errors: result.errors };
  revalidatePath("/librarian/books");
  revalidatePath("/catalogue");
  revalidatePath("/member/catalogue");
  return { success: true, message: result.message, data: { id: result.data.id } };
}

export async function deleteBookAction(id: string): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const result = await runAction(() => deleteBook(id, user.id), "Book deleted");
  if (result.success) {
    revalidatePath("/librarian/books");
    revalidatePath("/catalogue");
  }
  return result;
}

export async function addCopyAction(bookId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = copySchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => addCopy(bookId, parsed.data.rackNo, user.id), "Copy added");
  if (result.success) revalidatePath(`/librarian/books/${bookId}`);
  return result;
}

export async function updateCopyAction(id: string, bookId: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = z
    .object({
      rackNo: z.string().trim().min(1).optional(),
      status: z.enum(["available", "lost", "damaged"]).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(
    () => updateCopy(id, { rackNo: parsed.data.rackNo, status: parsed.data.status }, user.id),
    "Copy updated",
  );
  if (result.success) revalidatePath(`/librarian/books/${bookId}`);
  return result;
}

export async function createMemberAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => createMember(parsed.data, user.id), "Member registered");
  if (!result.success || !result.data) return { success: false, message: result.message, errors: result.errors };
  revalidatePath("/librarian/members");
  return { success: true, message: result.message, data: { id: result.data.id } };
}

export async function updateMemberAction(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = memberUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => updateMember(id, parsed.data, user.id), "Member updated");
  if (result.success) revalidatePath(`/librarian/members/${id}`);
  return result;
}

export async function createLibrarianAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const parsed = librarianSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => createLibrarian(parsed.data, user.id), "Librarian added");
  if (result.success) revalidatePath("/admin/librarians");
  return result;
}

export async function setUserStatusAction(id: string, status: "active" | "blocked"): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const result = await runAction(() => setUserStatus(id, status, user.id), status === "blocked" ? "Account blocked" : "Account unblocked");
  if (result.success) revalidatePath("/admin/librarians");
  return result;
}

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(async () => {
    const current = await settingsRepo.get();
    await settingsRepo.update({ ...parsed.data, lastCheckedAt: current.lastCheckedAt });
    const { logActivity } = await import("@/lib/services/activity.service");
    await logActivity({
      userId: user.id,
      action: "update_settings",
      entity: "settings",
      entityId: "settings",
      details: "Updated library rules.",
    });
  }, "Settings saved");
  if (result.success) revalidatePath("/admin/settings");
  return result;
}

export async function issueBookAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = issueSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Choose a member and a copy", errors: zodErrors(parsed.error) };
  const result = await runAction(
    () => issueBook({ memberId: parsed.data.memberId, copyId: parsed.data.copyId, issuedBy: user.id }),
    "Book issued",
  );
  if (result.success) {
    revalidatePath("/librarian/circulation/issue");
    revalidatePath("/librarian/circulation/active");
    revalidatePath("/member/my-books");
  }
  return result;
}

export async function returnBookAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = returnSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the return", errors: zodErrors(parsed.error) };
  const result = await runAction(
    () =>
      returnBook({
        issueId: parsed.data.issueId,
        condition: parsed.data.condition,
        damageAmount: parsed.data.damageAmount,
        actorId: user.id,
      }),
    "Book returned",
  );
  if (result.success) {
    revalidatePath("/librarian/circulation/return");
    revalidatePath("/librarian/circulation/active");
    revalidatePath("/librarian/fines");
    revalidatePath("/librarian/reservations");
  }
  return result;
}

export async function renewIssueAction(issueId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role === "member") {
    const member = await membersRepo.getByUserId(user.id);
    const { issuesRepo } = await import("@/lib/data/repositories/issues.repo");
    const issue = await issuesRepo.getById(issueId);
    if (!member || issue?.memberId !== member.id) return { success: false, message: "You cannot renew this loan." };
  } else if (user.role !== "admin" && user.role !== "librarian") {
    return { success: false, message: "You cannot renew this loan." };
  }
  const parsed = renewSchema.safeParse({ issueId });
  if (!parsed.success) return { success: false, message: "Loan was not found." };
  const result = await runAction(() => renewIssue({ issueId, actorId: user.id }), "Loan renewed");
  if (result.success) {
    revalidatePath("/member/my-books");
    revalidatePath("/librarian/circulation/active");
  }
  return result;
}

export async function reserveBookAction(bookId: string): Promise<ActionResult> {
  const user = await requireRole(["member"]);
  const member = await membersRepo.getByUserId(user.id);
  if (!member) return { success: false, message: "Member profile was not found." };
  const parsed = reserveSchema.safeParse({ bookId });
  if (!parsed.success) return { success: false, message: "Book was not found." };
  const result = await runAction(() => reserveBook({ memberId: member.id, bookId }), "Reservation placed");
  if (result.success) {
    revalidatePath("/member/reservations");
    revalidatePath("/member/catalogue");
    revalidatePath(`/catalogue/${bookId}`);
  }
  return result;
}

export async function cancelReservationAction(reservationId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role === "member") {
    const member = await membersRepo.getByUserId(user.id);
    const { reservationsRepo } = await import("@/lib/data/repositories/reservations.repo");
    const reservation = await reservationsRepo.getById(reservationId);
    if (!member || reservation?.memberId !== member.id) {
      return { success: false, message: "You cannot cancel this reservation." };
    }
  } else {
    await requireRole(["admin", "librarian"]);
  }
  const result = await runAction(() => cancelReservation({ reservationId, actorId: user.id }), "Reservation cancelled");
  if (result.success) {
    revalidatePath("/member/reservations");
    revalidatePath("/librarian/reservations");
  }
  return result;
}

export async function payFineAction(fineId: string): Promise<ActionResult<{ receiptNo?: string; amount: number }>> {
  const user = await requireRole(["admin", "librarian"]);
  const parsed = paySchema.safeParse({ fineId });
  if (!parsed.success) return { success: false, message: "Fine was not found." };
  const result = await runAction(() => markFinePaid({ fineId, actorId: user.id }), "Payment recorded");
  if (!result.success || !result.data) return { success: false, message: result.message };
  revalidatePath("/librarian/fines");
  revalidatePath("/member/fines");
  return {
    success: true,
    message: result.message,
    data: { receiptNo: result.data.receiptNo, amount: result.data.amount },
  };
}

export async function waiveFineAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const parsed = waiveSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "A reason is required", errors: zodErrors(parsed.error) };
  const result = await runAction(
    () => waiveFine({ fineId: parsed.data.fineId, reason: parsed.data.reason, actorId: user.id }),
    "Fine waived",
  );
  if (result.success) revalidatePath("/librarian/fines");
  return result;
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireRole(["member"]);
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  const result = await runAction(() => updateOwnProfile(user.id, parsed.data), "Profile updated");
  if (result.success) revalidatePath("/member/profile");
  return result;
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Check the form", errors: zodErrors(parsed.error) };
  return runAction(() => changePassword(user.id, parsed.data.currentPassword, parsed.data.newPassword), "Password changed");
}

export async function markNotificationReadAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await runAction(async () => {
    await notificationsRepo.markRead(id, user.id);
  }, "Marked as read");
  if (result.success) revalidatePath("/member/notifications");
  return result;
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const user = await requireUser();
  const result = await runAction(async () => {
    await notificationsRepo.markAllRead(user.id);
  }, "All notifications marked read");
  if (result.success) revalidatePath("/member/notifications");
  return result;
}

export async function runChecksAction(): Promise<ActionResult> {
  const user = await requireRole(["admin"]);
  const result = await runAction(async () => forceDailyChecks(user.id), "Daily checks finished");
  if (result.success) revalidatePath("/admin");
  return result;
}
