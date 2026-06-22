import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/components/admin/login-form";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = redirect && redirect.startsWith("/admin") ? redirect : "/admin";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary/40 p-4">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to site
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md p-8 shadow-glow">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo href="/admin" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Admin Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage the HiveSchool dashboard.</p>
        </div>

        <LoginForm redirectTo={redirectTo} />


      </Card>
    </div>
  );
}
