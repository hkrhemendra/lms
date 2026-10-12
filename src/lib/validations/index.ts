import { z } from "zod";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date");

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export const forgotSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  description: z.string().trim().optional(),
});

export const bookSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  isbn: z.string().trim().min(10, "ISBN is required"),
  publisher: z.string().trim().min(1, "Publisher is required"),
  edition: z.string().trim().min(1, "Edition is required"),
  year: z.coerce.number().int().min(1000).max(2100),
  categoryId: z.string().min(1, "Choose a category"),
  language: z.string().trim().min(1, "Language is required"),
  pages: z.coerce.number().int().positive().optional().or(z.literal("")),
  description: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
});

export const copySchema = z.object({
  rackNo: z.string().trim().min(1, "Rack is required"),
});

export const copyStatusSchema = z.object({
  status: z.enum(["available", "lost", "damaged"]),
});

export const memberSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(6, "Use at least 6 characters"),
    memberType: z.enum(["student", "faculty"]),
    enrolmentNo: z.string().trim().min(2, "Enrolment number is required"),
    course: z.string().trim().optional(),
    department: z.string().trim().optional(),
    phone: z.string().trim().min(8, "Phone is required"),
    address: z.string().trim().optional(),
    photoUrl: z.string().trim().optional(),
    validTill: dateField,
  })
  .superRefine((value, ctx) => {
    if (value.memberType === "student" && !value.course) {
      ctx.addIssue({ code: "custom", message: "Course is required for students", path: ["course"] });
    }
    if (value.memberType === "faculty" && !value.department) {
      ctx.addIssue({
        code: "custom",
        message: "Department is required for faculty",
        path: ["department"],
      });
    }
  });

export const memberUpdateSchema = z.object({
  phone: z.string().trim().min(8, "Phone is required"),
  address: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
  course: z.string().trim().optional(),
  department: z.string().trim().optional(),
  validTill: dateField.optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const profileSchema = z.object({
  phone: z.string().trim().min(8, "Phone is required"),
  address: z.string().trim().optional(),
  photoUrl: z.string().trim().optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Use at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const librarianSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Use at least 6 characters"),
});

export const ruleSchema = z.object({
  issueLimit: z.coerce.number().int().positive(),
  loanDays: z.coerce.number().int().positive(),
  finePerDay: z.coerce.number().nonnegative(),
  maxRenewals: z.coerce.number().int().nonnegative(),
});

export const settingsSchema = z.object({
  student: ruleSchema,
  faculty: ruleSchema,
  finePerDayLost: z.coerce.number().nonnegative(),
  reservationHoldDays: z.coerce.number().int().positive(),
  maxUnpaidFineToIssue: z.coerce.number().nonnegative(),
  libraryName: z.string().trim().min(2),
  libraryEmail: z.email(),
});

export const issueSchema = z.object({
  memberId: z.string().min(1, "Choose a member"),
  copyId: z.string().min(1, "Choose a copy"),
});

export const returnSchema = z.object({
  issueId: z.string().min(1),
  condition: z.enum(["good", "damaged", "lost"]),
  damageAmount: z.coerce.number().nonnegative().optional(),
});

export const renewSchema = z.object({
  issueId: z.string().min(1),
});

export const reserveSchema = z.object({
  bookId: z.string().min(1),
});

export const waiveSchema = z.object({
  fineId: z.string().min(1),
  reason: z.string().trim().min(3, "A reason is required"),
});

export const paySchema = z.object({
  fineId: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type MemberInput = z.infer<typeof memberSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
