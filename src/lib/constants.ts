import type { Rule, Settings } from "@/types";

export const COOKIE_NAME = "library_session";

export const DEFAULT_STUDENT_RULE: Rule = {
  issueLimit: 3,
  loanDays: 14,
  finePerDay: 2,
  maxRenewals: 2,
};

export const DEFAULT_FACULTY_RULE: Rule = {
  issueLimit: 6,
  loanDays: 30,
  finePerDay: 1,
  maxRenewals: 3,
};

export const DEFAULT_SETTINGS: Settings = {
  student: DEFAULT_STUDENT_RULE,
  faculty: DEFAULT_FACULTY_RULE,
  finePerDayLost: 500,
  reservationHoldDays: 3,
  maxUnpaidFineToIssue: 100,
  libraryName: "City College Library",
  libraryEmail: "library@college.edu",
  lastCheckedAt: null,
};

export const CATEGORY_GRADIENTS = [
  "from-indigo-700 to-slate-900",
  "from-emerald-700 to-teal-950",
  "from-amber-700 to-orange-950",
  "from-violet-700 to-indigo-950",
  "from-rose-700 to-stone-900",
  "from-cyan-700 to-slate-900",
  "from-sky-700 to-blue-950",
  "from-fuchsia-700 to-purple-950",
] as const;
