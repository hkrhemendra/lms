import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/constants";
import { readRole } from "@/lib/auth/edge-session";
import type { Role } from "@/types";

function home(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "librarian") return "/librarian";
  return "/member";
}

function allowed(pathname: string, role: Role | null) {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/librarian")) return role === "admin" || role === "librarian";
  if (pathname.startsWith("/member")) return role === "member";
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const secret = process.env.AUTH_SECRET ?? "";
  const role = token && secret ? await readRole(token, secret) : null;

  if (pathname === "/login" && role) {
    return NextResponse.redirect(new URL(home(role), request.url));
  }

  const protectedPath =
    pathname.startsWith("/admin") || pathname.startsWith("/librarian") || pathname.startsWith("/member");

  if (protectedPath && !role) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (protectedPath && role && !allowed(pathname, role)) {
    return NextResponse.redirect(new URL(home(role), request.url));
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/admin/:path*", "/librarian/:path*", "/member/:path*", "/login"],
};
