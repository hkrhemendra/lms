import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const instant = false;

export const metadata = { title: "Login" };

const demos = [
  ["Admin", "admin@library.edu", "admin123"],
  ["Librarian", "librarian@library.edu", "lib123"],
  ["Student", "student@library.edu", "student123"],
  ["Faculty", "faculty@library.edu", "faculty123"],
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your college library account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <LoginForm nextPath={params.next} />
          <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
            Forgot password
          </Link>
          <div className="rounded-xl bg-muted p-4 text-sm">
            <p className="mb-2 font-medium">Demo accounts</p>
            <ul className="flex flex-col gap-1 text-muted-foreground">
              {demos.map(([role, email, password]) => (
                <li key={email}>
                  {role}: {email} / {password}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
