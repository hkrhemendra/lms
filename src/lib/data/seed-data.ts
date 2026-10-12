import { hashSync } from "bcryptjs";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { addDays, todayDate } from "@/lib/dates";
import type {
  ActivityLog,
  Book,
  BookCopy,
  Category,
  Fine,
  Issue,
  Member,
  Notification,
  Reservation,
  Settings,
  User,
} from "@/types";

export type SeedData = {
  users: User[];
  members: Member[];
  categories: Category[];
  books: Book[];
  book_copies: BookCopy[];
  issues: Issue[];
  fines: Fine[];
  reservations: Reservation[];
  notifications: Notification[];
  settings: Settings;
  activity_log: ActivityLog[];
};

function id(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const CATEGORIES: [string, string][] = [
  ["Computer Science", "Programming, systems, and software."],
  ["Mathematics", "Pure and applied mathematics."],
  ["Management", "Business, finance, and organisational studies."],
  ["Electronics", "Devices, circuits, and digital design."],
  ["Literature", "Fiction and literary studies."],
  ["Physics", "Classical and modern physics."],
  ["Reference", "Dictionaries, handbooks, and encyclopaedias."],
  ["Competitive Exams", "Aptitude and exam preparation."],
];

type BookSeed = [string, string, string, string, string, number, number, number, number];

const BOOK_ROWS: BookSeed[] = [
  ["Clean Code", "Robert C. Martin", "9780132350884", "Prentice Hall", "1st", 2008, 0, 464, 2],
  ["The Pragmatic Programmer", "Andrew Hunt", "9780135957059", "Addison-Wesley", "2nd", 2019, 0, 352, 3],
  ["Design Patterns", "Erich Gamma", "9780201633610", "Addison-Wesley", "1st", 1994, 0, 416, 1],
  ["Introduction to Algorithms", "Thomas H. Cormen", "9780262046305", "MIT Press", "4th", 2022, 0, 1312, 2],
  ["Computer Networks", "Andrew S. Tanenbaum", "9780132126953", "Pearson", "5th", 2011, 0, 960, 2],
  ["Operating System Concepts", "Abraham Silberschatz", "9781119800361", "Wiley", "10th", 2018, 0, 1040, 2],
  ["Database System Concepts", "Abraham Silberschatz", "9780078022159", "McGraw Hill", "7th", 2019, 0, 1376, 2],
  ["Artificial Intelligence: A Modern Approach", "Stuart Russell", "9780134610993", "Pearson", "4th", 2020, 0, 1136, 2],
  ["Python Crash Course", "Eric Matthes", "9781718502703", "No Starch Press", "3rd", 2023, 0, 552, 3],
  ["You Don't Know JS Yet", "Kyle Simpson", "9781098124045", "O'Reilly", "2nd", 2020, 0, 143, 2],
  ["Calculus", "James Stewart", "9781285740621", "Cengage", "8th", 2015, 1, 1368, 3],
  ["Linear Algebra Done Right", "Sheldon Axler", "9783031101036", "Springer", "4th", 2024, 1, 390, 2],
  ["Discrete Mathematics and Its Applications", "Kenneth Rosen", "9781260091991", "McGraw Hill", "8th", 2018, 1, 1118, 2],
  ["A Book of Abstract Algebra", "Charles Pinter", "9780486474175", "Dover", "2nd", 2010, 1, 400, 2],
  ["Principles of Mathematical Analysis", "Walter Rudin", "9780070542358", "McGraw Hill", "3rd", 1976, 1, 342, 1],
  ["The Lean Startup", "Eric Ries", "9780307887894", "Crown", "1st", 2011, 2, 336, 2],
  ["Good to Great", "Jim Collins", "9780066620992", "HarperBusiness", "1st", 2001, 2, 320, 2],
  ["Principles of Marketing", "Philip Kotler", "9781292449364", "Pearson", "19th", 2023, 2, 736, 2],
  ["Financial Management", "Prasanna Chandra", "9789353166526", "McGraw Hill", "10th", 2019, 2, 1124, 2],
  ["Organizational Behavior", "Stephen Robbins", "9780134729329", "Pearson", "18th", 2018, 2, 736, 2],
  ["Electronic Devices", "Thomas L. Floyd", "9780134414447", "Pearson", "10th", 2017, 3, 976, 2],
  ["The Art of Electronics", "Paul Horowitz", "9780521809269", "Cambridge", "3rd", 2015, 3, 1220, 1],
  ["Microelectronic Circuits", "Adel Sedra", "9780190853464", "Oxford", "8th", 2020, 3, 1296, 2],
  ["Digital Design", "M. Morris Mano", "9780134549897", "Pearson", "6th", 2018, 3, 720, 2],
  ["Signals and Systems", "Alan Oppenheim", "9780138147570", "Pearson", "2nd", 1996, 3, 957, 2],
  ["To Kill a Mockingbird", "Harper Lee", "9780061120084", "Harper Perennial", "1st", 1960, 4, 336, 3],
  ["Pride and Prejudice", "Jane Austen", "9780141439518", "Penguin", "1st", 1813, 4, 480, 2],
  ["The Alchemist", "Paulo Coelho", "9780062315007", "HarperOne", "1st", 1988, 4, 208, 3],
  ["1984", "George Orwell", "9780451524935", "Signet", "1st", 1949, 4, 328, 2],
  ["Things Fall Apart", "Chinua Achebe", "9780385474542", "Anchor", "1st", 1958, 4, 209, 2],
  ["University Physics", "Hugh Young", "9780135216118", "Pearson", "15th", 2019, 5, 1600, 2],
  ["Concepts of Physics", "H. C. Verma", "9788177091878", "Bharati Bhawan", "1st", 1992, 5, 462, 4],
  ["Introduction to Electrodynamics", "David Griffiths", "9781108420419", "Cambridge", "4th", 2017, 5, 620, 2],
  ["Quantum Physics", "Robert Eisberg", "9780471873730", "Wiley", "2nd", 1985, 5, 713, 1],
  ["The Feynman Lectures on Physics", "Richard Feynman", "9780465023820", "Basic Books", "1st", 1964, 5, 1552, 1],
  ["Oxford Advanced Learner's Dictionary", "A. S. Hornby", "9780194798792", "Oxford", "10th", 2020, 6, 1820, 2],
  ["Encyclopaedia of Science", "Various", "9781405322783", "DK", "1st", 2006, 6, 512, 1],
  ["MLA Handbook", "Modern Language Association", "9781603293518", "MLA", "9th", 2021, 6, 400, 2],
  ["Quantitative Aptitude", "R. S. Aggarwal", "9789352534029", "S. Chand", "Revised", 2017, 7, 960, 4],
  ["Word Power Made Easy", "Norman Lewis", "9781101873854", "Anchor", "1st", 1949, 7, 528, 3],
];

type Person = {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  memberType?: Member["memberType"];
  course?: string;
  department?: string;
  status?: Member["status"];
};

const PEOPLE: Person[] = [
  { name: "Asha Menon", email: "admin@library.edu", password: "admin123", role: "admin" },
  { name: "Neha Kapoor", email: "librarian@library.edu", password: "lib123", role: "librarian" },
  { name: "Amit Bansal", email: "librarian2@library.edu", password: "lib123", role: "librarian" },
  { name: "Ananya Sharma", email: "student@library.edu", password: "student123", role: "member", memberType: "student", course: "MCA" },
  { name: "Rohan Iyer", email: "rohan.iyer@library.edu", password: "member123", role: "member", memberType: "student", course: "MCA" },
  { name: "Priya Nair", email: "priya.nair@library.edu", password: "member123", role: "member", memberType: "student", course: "MCA" },
  { name: "Arjun Mehta", email: "arjun.mehta@library.edu", password: "member123", role: "member", memberType: "student", course: "MCA" },
  { name: "Sneha Patel", email: "sneha.patel@library.edu", password: "member123", role: "member", memberType: "student", course: "MCA" },
  { name: "Vikram Rao", email: "vikram.rao@library.edu", password: "member123", role: "member", memberType: "student", course: "BCA" },
  { name: "Kavya Reddy", email: "kavya.reddy@library.edu", password: "member123", role: "member", memberType: "student", course: "BCA" },
  { name: "Aditya Joshi", email: "aditya.joshi@library.edu", password: "member123", role: "member", memberType: "student", course: "BCA" },
  { name: "Meera Krishnan", email: "meera.krishnan@library.edu", password: "member123", role: "member", memberType: "student", course: "BCA" },
  { name: "Nikhil Gupta", email: "nikhil.gupta@library.edu", password: "member123", role: "member", memberType: "student", course: "BCA" },
  { name: "Ishita Banerjee", email: "ishita.banerjee@library.edu", password: "member123", role: "member", memberType: "student", course: "MBA" },
  { name: "Rahul Verma", email: "rahul.verma@library.edu", password: "member123", role: "member", memberType: "student", course: "MBA" },
  { name: "Pooja Singh", email: "pooja.singh@library.edu", password: "member123", role: "member", memberType: "student", course: "MBA" },
  { name: "Karthik Menon", email: "karthik.menon@library.edu", password: "member123", role: "member", memberType: "student", course: "MBA" },
  { name: "Divya Choudhary", email: "divya.choudhary@library.edu", password: "member123", role: "member", memberType: "student", course: "MBA", status: "inactive" },
  { name: "Dr. Meenakshi Rao", email: "faculty@library.edu", password: "faculty123", role: "member", memberType: "faculty", department: "Computer Science" },
  { name: "Prof. Suresh Kulkarni", email: "suresh.kulkarni@library.edu", password: "member123", role: "member", memberType: "faculty", department: "Mathematics" },
  { name: "Dr. Anita Deshmukh", email: "anita.deshmukh@library.edu", password: "member123", role: "member", memberType: "faculty", department: "Management" },
  { name: "Prof. Joseph Mathew", email: "joseph.mathew@library.edu", password: "member123", role: "member", memberType: "faculty", department: "Electronics" },
  { name: "Dr. Farah Qureshi", email: "farah.qureshi@library.edu", password: "member123", role: "member", memberType: "faculty", department: "Physics" },
];

type IssuePlan = {
  member: number;
  book: number;
  status: "issued" | "overdue" | "returned";
  issuedDaysAgo: number;
  dueOffset: number;
  returnedDaysAgo?: number;
};

export async function buildSeedData(now = new Date()): Promise<SeedData> {
  const today = todayDate(now);
  const createdAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString();
  const users: User[] = [];
  const members: Member[] = [];

  for (let index = 0; index < PEOPLE.length; index += 1) {
    const person = PEOPLE[index];
    const userId = id(index + 1);
    users.push({
      id: userId,
      name: person.name,
      email: person.email,
      passwordHash: hashSync(person.password, 8),
      role: person.role,
      status: "active",
      createdAt,
    });
    if (person.role !== "member" || !person.memberType) continue;
    const memberIndex = members.length;
    members.push({
      id: id(100 + memberIndex),
      userId,
      memberCode: `MEM-2026-${String(memberIndex + 1).padStart(3, "0")}`,
      memberType: person.memberType,
      enrolmentNo: person.memberType === "student" ? `ENR-2024-${String(memberIndex + 1).padStart(3, "0")}` : `FAC-${String(memberIndex + 1).padStart(3, "0")}`,
      course: person.course,
      department: person.department,
      phone: `98${String(41000000 + memberIndex).slice(0, 8)}`,
      address: "City College Campus",
      validTill: addDays(today, person.memberType === "student" ? 700 : 2000),
      status: person.status ?? "active",
      createdAt,
    });
  }

  const categories: Category[] = CATEGORIES.map(([name, description], index) => ({
    id: id(200 + index),
    name,
    description,
  }));

  const books: Book[] = BOOK_ROWS.map((row, index) => ({
    id: id(300 + index),
    title: row[0],
    author: row[1],
    isbn: row[2],
    publisher: row[3],
    edition: row[4],
    year: row[5],
    categoryId: categories[row[6]].id,
    language: "English",
    pages: row[7],
    description: `${row[0]} by ${row[1]}, published by ${row[3]}.`,
    createdAt,
  }));

  const copies: BookCopy[] = [];
  let accession = 1;
  BOOK_ROWS.forEach((row, bookIndex) => {
    for (let copy = 0; copy < row[8]; copy += 1) {
      copies.push({
        id: id(1000 + accession),
        bookId: books[bookIndex].id,
        accessionNo: `ACC-${String(accession).padStart(5, "0")}`,
        rackNo: `R${(row[6] % 8) + 1}-S${copy + 1}`,
        status: "available",
        addedAt: createdAt,
      });
      accession += 1;
    }
  });

  const librarian = users[1];
  const issues: Issue[] = [];
  const plans: IssuePlan[] = [
    { member: 0, book: 0, status: "issued", issuedDaysAgo: 4, dueOffset: 10 },
    { member: 0, book: 7, status: "issued", issuedDaysAgo: 12, dueOffset: 2 },
    { member: 1, book: 1, status: "issued", issuedDaysAgo: 6, dueOffset: 8 },
    { member: 2, book: 3, status: "issued", issuedDaysAgo: 3, dueOffset: 11 },
    { member: 3, book: 8, status: "issued", issuedDaysAgo: 9, dueOffset: 5 },
    { member: 6, book: 10, status: "issued", issuedDaysAgo: 2, dueOffset: 12 },
    { member: 15, book: 4, status: "issued", issuedDaysAgo: 8, dueOffset: 22 },
    { member: 16, book: 11, status: "issued", issuedDaysAgo: 15, dueOffset: 15 },
    { member: 17, book: 16, status: "issued", issuedDaysAgo: 1, dueOffset: 29 },
    { member: 18, book: 30, status: "issued", issuedDaysAgo: 10, dueOffset: 20 },
    { member: 1, book: 20, status: "overdue", issuedDaysAgo: 30, dueOffset: -6 },
    { member: 4, book: 21, status: "overdue", issuedDaysAgo: 40, dueOffset: -10 },
    { member: 7, book: 24, status: "overdue", issuedDaysAgo: 20, dueOffset: -2 },
    { member: 8, book: 25, status: "overdue", issuedDaysAgo: 28, dueOffset: -4 },
    { member: 9, book: 31, status: "overdue", issuedDaysAgo: 35, dueOffset: -8 },
    { member: 5, book: 12, status: "overdue", issuedDaysAgo: 50, dueOffset: -20 },
    { member: 19, book: 32, status: "overdue", issuedDaysAgo: 40, dueOffset: -3 },
    { member: 10, book: 38, status: "overdue", issuedDaysAgo: 25, dueOffset: -5 },
    { member: 2, book: 26, status: "returned", issuedDaysAgo: 40, dueOffset: -12, returnedDaysAgo: 2 },
    { member: 3, book: 27, status: "returned", issuedDaysAgo: 30, dueOffset: -1, returnedDaysAgo: 1 },
    { member: 6, book: 28, status: "returned", issuedDaysAgo: 50, dueOffset: 5, returnedDaysAgo: 20 },
    { member: 11, book: 5, status: "returned", issuedDaysAgo: 60, dueOffset: -8, returnedDaysAgo: 6 },
    { member: 12, book: 6, status: "returned", issuedDaysAgo: 45, dueOffset: 2, returnedDaysAgo: 18 },
    { member: 13, book: 9, status: "returned", issuedDaysAgo: 33, dueOffset: -4, returnedDaysAgo: 3 },
    { member: 15, book: 15, status: "returned", issuedDaysAgo: 70, dueOffset: 10, returnedDaysAgo: 30 },
    { member: 0, book: 17, status: "returned", issuedDaysAgo: 55, dueOffset: -6, returnedDaysAgo: 4 },
    { member: 16, book: 18, status: "returned", issuedDaysAgo: 48, dueOffset: 4, returnedDaysAgo: 12 },
    { member: 4, book: 22, status: "returned", issuedDaysAgo: 36, dueOffset: -9, returnedDaysAgo: 5 },
    { member: 7, book: 33, status: "returned", issuedDaysAgo: 22, dueOffset: 3, returnedDaysAgo: 8 },
    { member: 18, book: 36, status: "returned", issuedDaysAgo: 80, dueOffset: -2, returnedDaysAgo: 1 },
  ];

  function takeCopy(bookIndex: number): BookCopy {
    const bookId = books[bookIndex].id;
    const copy = copies.find((row) => row.bookId === bookId && row.status === "available");
    if (!copy) throw new Error(`No available copy for ${books[bookIndex].title}`);
    return copy;
  }

  plans.forEach((plan, index) => {
    const copy = takeCopy(plan.book);
    const member = members[plan.member];
    if (plan.status === "returned") copy.status = "available";
    else copy.status = "issued";
    issues.push({
      id: id(2000 + index),
      copyId: copy.id,
      bookId: copy.bookId,
      memberId: member.id,
      issuedBy: librarian.id,
      issueDate: addDays(today, -plan.issuedDaysAgo),
      dueDate: addDays(today, plan.dueOffset),
      returnDate: plan.returnedDaysAgo != null ? addDays(today, -plan.returnedDaysAgo) : undefined,
      renewCount: index % 3 === 0 ? 1 : 0,
      status: plan.status === "returned" ? "returned" : plan.status,
    });
  });

  function holdCopy(memberIndex: number, bookIndex: number, issueIndex: number) {
    const copy = takeCopy(bookIndex);
    copy.status = "issued";
    issues.push({
      id: id(2100 + issueIndex),
      copyId: copy.id,
      bookId: copy.bookId,
      memberId: members[memberIndex].id,
      issuedBy: librarian.id,
      issueDate: addDays(today, -2),
      dueDate: addDays(today, 12),
      renewCount: 0,
      status: "issued",
    });
  }

  holdCopy(11, 2, 0);
  holdCopy(13, 14, 1);
  holdCopy(3, 28, 2);

  const design = books[2];
  const orwell = books[28];
  const orwellCopy = copies.find((row) => row.bookId === orwell.id && row.status === "available");
  if (!orwellCopy) throw new Error("Expected an available copy of 1984");
  orwellCopy.status = "reserved";

  const fines: Fine[] = [
    {
      id: id(3000),
      issueId: issues[18].id,
      memberId: members[2].id,
      amount: 24,
      reason: "late",
      status: "unpaid",
      createdAt,
    },
    {
      id: id(3001),
      issueId: issues[21].id,
      memberId: members[11].id,
      amount: 16,
      reason: "late",
      status: "paid",
      paidDate: addDays(today, -6),
      receiptNo: `RCPT-${addDays(today, -6).replaceAll("-", "")}-0001`,
      createdAt,
    },
    {
      id: id(3002),
      issueId: issues[23].id,
      memberId: members[13].id,
      amount: 8,
      reason: "late",
      status: "unpaid",
      createdAt,
    },
    {
      id: id(3003),
      issueId: issues[25].id,
      memberId: members[0].id,
      amount: 12,
      reason: "late",
      status: "paid",
      paidDate: addDays(today, -4),
      receiptNo: `RCPT-${addDays(today, -4).replaceAll("-", "")}-0001`,
      createdAt,
    },
    {
      id: id(3004),
      issueId: issues[15].id,
      memberId: members[5].id,
      amount: 150,
      reason: "late",
      status: "unpaid",
      createdAt,
    },
    {
      id: id(3005),
      issueId: issues[28].id,
      memberId: members[4].id,
      amount: 18,
      reason: "late",
      status: "waived",
      waiveReason: "First overdue, waived by admin",
      createdAt,
    },
    {
      id: id(3006),
      issueId: issues[29].id,
      memberId: members[18].id,
      amount: 2,
      reason: "late",
      status: "paid",
      paidDate: today,
      receiptNo: `RCPT-${today.replaceAll("-", "")}-0001`,
      createdAt,
    },
  ];

  const reservations: Reservation[] = [
    {
      id: id(4000),
      bookId: design.id,
      memberId: members[8].id,
      requestDate: addDays(today, -3),
      status: "waiting",
      position: 1,
    },
    {
      id: id(4001),
      bookId: design.id,
      memberId: members[12].id,
      requestDate: addDays(today, -1),
      status: "waiting",
      position: 2,
    },
    {
      id: id(4002),
      bookId: orwell.id,
      memberId: members[6].id,
      requestDate: addDays(today, -2),
      status: "ready",
      readyUntil: addDays(today, 2),
      position: 0,
    },
    {
      id: id(4003),
      bookId: books[14].id,
      memberId: members[9].id,
      requestDate: addDays(today, -4),
      status: "waiting",
      position: 1,
    },
  ];

  const studentUser = users[3];
  const readyMember = members[6];
  const readyUser = users.find((user) => user.id === readyMember.userId);
  const notifications: Notification[] = [
    {
      id: id(5000),
      userId: studentUser.id,
      type: "general",
      title: "Welcome to the library",
      message: "You can search the catalogue, reserve books, and renew loans from your dashboard.",
      read: false,
      createdAt,
    },
    {
      id: id(5001),
      userId: studentUser.id,
      type: "due_soon",
      title: "Book due soon",
      message: "Artificial Intelligence: A Modern Approach is due in 2 days.",
      read: false,
      createdAt: new Date(now.getTime() - 3600_000).toISOString(),
      refId: issues[1].id,
    },
    {
      id: id(5002),
      userId: readyUser?.id ?? studentUser.id,
      type: "reservation_ready",
      title: "Reservation ready",
      message: "1984 is ready for pickup.",
      read: false,
      createdAt: new Date(now.getTime() - 7200_000).toISOString(),
      refId: reservations[2].id,
    },
    {
      id: id(5003),
      userId: users.find((user) => user.id === members[5].userId)?.id ?? studentUser.id,
      type: "fine",
      title: "Unpaid fine",
      message: "You have an unpaid fine of ₹150. New issues are blocked until it is cleared.",
      read: true,
      createdAt,
      refId: fines[4].id,
    },
  ];

  const activity: ActivityLog[] = issues.slice(0, 6).map((issue, index) => ({
    id: id(6000 + index),
    userId: librarian.id,
    action: "issue",
    entity: "issue",
    entityId: issue.id,
    details: `Issued a book to a member`,
    createdAt: `${issue.issueDate}T04:30:00.000Z`,
  }));

  return {
    users,
    members,
    categories,
    books,
    book_copies: copies,
    issues,
    fines,
    reservations,
    notifications,
    settings: { ...DEFAULT_SETTINGS, lastCheckedAt: null },
    activity_log: activity,
  };
}
