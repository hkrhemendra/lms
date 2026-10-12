import type { Role } from "@/types";

export type NavItem = { href: string; label: string; icon: string };

export type NavGroup = { label: string; items: NavItem[] };

const librarian: NavItem[] = [
  { href: "/librarian", label: "Dashboard", icon: "layout" },
  { href: "/librarian/books", label: "Books", icon: "book" },
  { href: "/librarian/categories", label: "Categories", icon: "tags" },
  { href: "/librarian/members", label: "Members", icon: "users" },
  { href: "/librarian/circulation/issue", label: "Issue desk", icon: "plus" },
  { href: "/librarian/circulation/return", label: "Return desk", icon: "undo" },
  { href: "/librarian/circulation/active", label: "Active loans", icon: "library" },
  { href: "/librarian/fines", label: "Fines", icon: "rupee" },
  { href: "/librarian/reservations", label: "Reservations", icon: "bookmark" },
  { href: "/librarian/reports", label: "Reports", icon: "chart" },
];

export function navFor(role: Role): NavGroup[] {
  if (role === "admin") {
    return [
      {
        label: "Administration",
        items: [
          { href: "/admin", label: "Dashboard", icon: "layout" },
          { href: "/admin/librarians", label: "Librarians", icon: "users" },
          { href: "/admin/settings", label: "Settings", icon: "settings" },
          { href: "/admin/reports", label: "Reports", icon: "chart" },
          { href: "/admin/activity", label: "Activity", icon: "scroll" },
        ],
      },
      { label: "Library desk", items: librarian.filter((item) => item.href !== "/librarian") },
    ];
  }
  if (role === "librarian") return [{ label: "Library", items: librarian }];
  return [
    {
      label: "My library",
      items: [
        { href: "/member", label: "Dashboard", icon: "layout" },
        { href: "/member/catalogue", label: "Catalogue", icon: "book" },
        { href: "/member/my-books", label: "My books", icon: "library" },
        { href: "/member/reservations", label: "Reservations", icon: "bookmark" },
        { href: "/member/fines", label: "Fines", icon: "rupee" },
        { href: "/member/notifications", label: "Notifications", icon: "bell" },
        { href: "/member/profile", label: "Profile", icon: "user" },
      ],
    },
  ];
}
