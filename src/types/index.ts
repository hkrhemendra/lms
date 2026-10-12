export type Role = "admin" | "librarian" | "member";
export type MemberType = "student" | "faculty";
export type UserStatus = "active" | "blocked";
export type MemberStatus = "active" | "inactive";
export type CopyStatus = "available" | "issued" | "reserved" | "lost" | "damaged";
export type IssueStatus = "issued" | "returned" | "overdue" | "lost";
export type FineReason = "late" | "lost" | "damaged";
export type FineStatus = "unpaid" | "paid" | "waived";
export type ReservationStatus = "waiting" | "ready" | "fulfilled" | "cancelled" | "expired";
export type NotificationType = "due_soon" | "overdue" | "reservation_ready" | "fine" | "general";
export type ReturnCondition = "good" | "damaged" | "lost";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
};

export type Member = {
  id: string;
  userId: string;
  memberCode: string;
  memberType: MemberType;
  enrolmentNo: string;
  course?: string;
  department?: string;
  phone: string;
  address?: string;
  photoUrl?: string;
  validTill: string;
  status: MemberStatus;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  edition: string;
  year: number;
  categoryId: string;
  language: string;
  pages?: number;
  description?: string;
  coverImage?: string;
  createdAt: string;
};

export type BookCopy = {
  id: string;
  bookId: string;
  accessionNo: string;
  rackNo: string;
  status: CopyStatus;
  addedAt: string;
};

export type Issue = {
  id: string;
  copyId: string;
  bookId: string;
  memberId: string;
  issuedBy: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  renewCount: number;
  status: IssueStatus;
};

export type Fine = {
  id: string;
  issueId: string;
  memberId: string;
  amount: number;
  reason: FineReason;
  status: FineStatus;
  paidDate?: string;
  receiptNo?: string;
  waiveReason?: string;
  createdAt: string;
};

export type Reservation = {
  id: string;
  bookId: string;
  memberId: string;
  requestDate: string;
  status: ReservationStatus;
  readyUntil?: string;
  position: number;
};

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  refId?: string;
};

export type Rule = {
  issueLimit: number;
  loanDays: number;
  finePerDay: number;
  maxRenewals: number;
};

export type Settings = {
  student: Rule;
  faculty: Rule;
  finePerDayLost: number;
  reservationHoldDays: number;
  maxUnpaidFineToIssue: number;
  libraryName: string;
  libraryEmail: string;
  lastCheckedAt: string | null;
};

export type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
};

export type ActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};
