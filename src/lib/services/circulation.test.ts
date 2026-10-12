import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { addDays, todayDate } from "@/lib/dates";
import { issueBook, renewIssue, returnBook } from "@/lib/services/circulation.service";
import { LibraryError } from "@/lib/services/errors";
import { reserveBook } from "@/lib/services/reservations.service";
import type { BookCopy, Fine, Issue, Member, Reservation, User } from "@/types";

let dir = "";

const today = todayDate();

function user(partial: Partial<User> & Pick<User, "id" | "email">): User {
  return {
    name: "Reader",
    passwordHash: "x",
    role: "member",
    status: "active",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function member(partial: Partial<Member> & Pick<Member, "id" | "userId">): Member {
  return {
    memberCode: "MEM-2026-001",
    memberType: "student",
    enrolmentNo: "ENR-1",
    course: "MCA",
    phone: "9800000001",
    validTill: addDays(today, 200),
    status: "active",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

async function save(name: string, data: unknown) {
  await writeFile(path.join(dir, `${name}.json`), JSON.stringify(data));
}

async function seedWorld(extra?: {
  members?: Member[];
  users?: User[];
  copies?: BookCopy[];
  issues?: Issue[];
  fines?: Fine[];
  reservations?: Reservation[];
}) {
  const users = extra?.users ?? [
    user({ id: "staff", email: "lib@library.edu", role: "librarian", name: "Neha" }),
    user({ id: "u1", email: "a@library.edu", name: "Ananya" }),
    user({ id: "u2", email: "b@library.edu", name: "Rohan" }),
  ];
  const members = extra?.members ?? [
    member({ id: "m1", userId: "u1" }),
    member({ id: "m2", userId: "u2", memberCode: "MEM-2026-002", enrolmentNo: "ENR-2" }),
  ];
  const copies = extra?.copies ?? [
    {
      id: "c1",
      bookId: "b1",
      accessionNo: "ACC-00001",
      rackNo: "R1",
      status: "available" as const,
      addedAt: new Date().toISOString(),
    },
  ];
  await save("users", users);
  await save("members", members);
  await save("categories", [{ id: "cat", name: "Computer Science" }]);
  await save("books", [
    {
      id: "b1",
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      publisher: "Prentice Hall",
      edition: "1st",
      year: 2008,
      categoryId: "cat",
      language: "English",
      createdAt: new Date().toISOString(),
    },
  ]);
  await save("book_copies", copies);
  await save("issues", extra?.issues ?? []);
  await save("fines", extra?.fines ?? []);
  await save("reservations", extra?.reservations ?? []);
  await save("notifications", []);
  await save("activity_log", []);
  await save("settings", DEFAULT_SETTINGS);
}

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "library-"));
  process.env.DATA_DIR = dir;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("issueBook", () => {
  it("rejects an inactive member", async () => {
    await seedWorld({
      members: [member({ id: "m1", userId: "u1", status: "inactive" })],
    });
    await expect(issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" })).rejects.toThrow(
      /inactive/,
    );
  });

  it("rejects an expired membership", async () => {
    await seedWorld({
      members: [member({ id: "m1", userId: "u1", validTill: addDays(today, -1) })],
    });
    await expect(issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" })).rejects.toThrow(
      /expired/,
    );
  });

  it("rejects a member at the issue limit", async () => {
    const issues: Issue[] = [1, 2, 3].map((n) => ({
      id: `i${n}`,
      copyId: `other${n}`,
      bookId: `other-book-${n}`,
      memberId: "m1",
      issuedBy: "staff",
      issueDate: addDays(today, -1),
      dueDate: addDays(today, 5),
      renewCount: 0,
      status: "issued",
    }));
    await seedWorld({ issues });
    await expect(issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" })).rejects.toThrow(
      /active loans/,
    );
  });

  it("rejects unpaid fines above the limit", async () => {
    const fines: Fine[] = [
      {
        id: "f1",
        issueId: "old",
        memberId: "m1",
        amount: 150,
        reason: "late",
        status: "unpaid",
        createdAt: new Date().toISOString(),
      },
    ];
    await seedWorld({ fines });
    await expect(issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" })).rejects.toThrow(
      /unpaid/i,
    );
  });

  it("rejects a copy reserved for someone else", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "reserved",
          addedAt: new Date().toISOString(),
        },
      ],
      reservations: [
        {
          id: "r1",
          bookId: "b1",
          memberId: "m2",
          requestDate: today,
          status: "ready",
          readyUntil: addDays(today, 3),
          position: 0,
        },
      ],
    });
    await expect(issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" })).rejects.toThrow(
      /reserved/,
    );
  });

  it("issues a reserved copy to the member it is held for and fulfils the reservation", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "reserved",
          addedAt: new Date().toISOString(),
        },
      ],
      reservations: [
        {
          id: "r1",
          bookId: "b1",
          memberId: "m1",
          requestDate: today,
          status: "ready",
          readyUntil: addDays(today, 3),
          position: 0,
        },
      ],
    });
    const issue = await issueBook({ memberId: "m1", copyId: "c1", issuedBy: "staff" });
    expect(issue.dueDate).toBe(addDays(today, 14));
    expect(issue.status).toBe("issued");
    const { copiesRepo } = await import("@/lib/data/repositories/copies.repo");
    const { reservationsRepo } = await import("@/lib/data/repositories/reservations.repo");
    expect((await copiesRepo.getById("c1"))?.status).toBe("issued");
    expect((await reservationsRepo.getById("r1"))?.status).toBe("fulfilled");
  });

  it("rejects a second copy of a title the member already holds", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
        {
          id: "c2",
          bookId: "b1",
          accessionNo: "ACC-00002",
          rackNo: "R1",
          status: "available",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          id: "i1",
          copyId: "c1",
          bookId: "b1",
          memberId: "m1",
          issuedBy: "staff",
          issueDate: today,
          dueDate: addDays(today, 10),
          renewCount: 0,
          status: "issued",
        },
      ],
    });
    await expect(issueBook({ memberId: "m1", copyId: "c2", issuedBy: "staff" })).rejects.toThrow(
      /already holds/,
    );
  });
});

describe("returnBook", () => {
  it("creates a late fine of days times the daily rate", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          id: "i1",
          copyId: "c1",
          bookId: "b1",
          memberId: "m1",
          issuedBy: "staff",
          issueDate: addDays(today, -20),
          dueDate: addDays(today, -6),
          renewCount: 0,
          status: "overdue",
        },
      ],
    });
    const result = await returnBook({ issueId: "i1", condition: "good", actorId: "staff" });
    expect(result.fine?.amount).toBe(12);
    expect(result.fine?.reason).toBe("late");
    expect(result.issue.status).toBe("returned");
  });

  it("holds the copy for the next reservation and notifies that member", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          id: "i1",
          copyId: "c1",
          bookId: "b1",
          memberId: "m1",
          issuedBy: "staff",
          issueDate: today,
          dueDate: addDays(today, 7),
          renewCount: 0,
          status: "issued",
        },
      ],
      reservations: [
        {
          id: "r1",
          bookId: "b1",
          memberId: "m2",
          requestDate: today,
          status: "waiting",
          position: 1,
        },
      ],
    });
    await returnBook({ issueId: "i1", condition: "good", actorId: "staff" });
    const { copiesRepo } = await import("@/lib/data/repositories/copies.repo");
    const { reservationsRepo } = await import("@/lib/data/repositories/reservations.repo");
    const { notificationsRepo } = await import("@/lib/data/repositories/notifications.repo");
    expect((await copiesRepo.getById("c1"))?.status).toBe("reserved");
    const ready = await reservationsRepo.getById("r1");
    expect(ready?.status).toBe("ready");
    expect(ready?.readyUntil).toBe(addDays(today, 3));
    const notes = await notificationsRepo.getByUser("u2");
    expect(notes.some((note) => note.type === "reservation_ready")).toBe(true);
  });
});

describe("renewIssue", () => {
  const active = (patch: Partial<Issue>): Issue => ({
    id: "i1",
    copyId: "c1",
    bookId: "b1",
    memberId: "m1",
    issuedBy: "staff",
    issueDate: addDays(today, -2),
    dueDate: addDays(today, 4),
    renewCount: 0,
    status: "issued",
    ...patch,
  });

  it("blocks overdue, capped, and queued loans", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [active({ status: "overdue", dueDate: addDays(today, -1) })],
    });
    await expect(renewIssue({ issueId: "i1", actorId: "staff" })).rejects.toThrow(/Overdue/);

    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [active({ renewCount: 2 })],
    });
    await expect(renewIssue({ issueId: "i1", actorId: "staff" })).rejects.toThrow(/renewal limit/);

    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [active({})],
      reservations: [
        {
          id: "r1",
          bookId: "b1",
          memberId: "m2",
          requestDate: today,
          status: "waiting",
          position: 1,
        },
      ],
    });
    await expect(renewIssue({ issueId: "i1", actorId: "staff" })).rejects.toThrow(/waiting/);
  });

  it("extends the due date when renewal is allowed", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [active({})],
    });
    const renewed = await renewIssue({ issueId: "i1", actorId: "staff" });
    expect(renewed.dueDate).toBe(addDays(today, 14));
    expect(renewed.renewCount).toBe(1);
  });
});

describe("reserveBook", () => {
  it("rejects a reservation when a copy is free or already held", async () => {
    await seedWorld();
    await expect(reserveBook({ memberId: "m1", bookId: "b1" })).rejects.toBeInstanceOf(LibraryError);

    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          id: "i1",
          copyId: "c1",
          bookId: "b1",
          memberId: "m1",
          issuedBy: "staff",
          issueDate: today,
          dueDate: addDays(today, 4),
          renewCount: 0,
          status: "issued",
        },
      ],
    });
    await expect(reserveBook({ memberId: "m1", bookId: "b1" })).rejects.toThrow(/already hold/);
  });

  it("places the member at the end of the queue", async () => {
    await seedWorld({
      copies: [
        {
          id: "c1",
          bookId: "b1",
          accessionNo: "ACC-00001",
          rackNo: "R1",
          status: "issued",
          addedAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          id: "i1",
          copyId: "c1",
          bookId: "b1",
          memberId: "m2",
          issuedBy: "staff",
          issueDate: today,
          dueDate: addDays(today, 4),
          renewCount: 0,
          status: "issued",
        },
      ],
      reservations: [
        {
          id: "r1",
          bookId: "b1",
          memberId: "m2",
          requestDate: today,
          status: "waiting",
          position: 1,
        },
      ],
    });
    const created = await reserveBook({ memberId: "m1", bookId: "b1" });
    expect(created.position).toBe(2);
    expect(created.status).toBe("waiting");
  });
});
