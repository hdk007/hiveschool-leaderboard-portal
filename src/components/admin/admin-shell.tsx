"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ExternalLink } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Icon } from "@/components/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/components/notification-center";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { ADMIN_NAV } from "@/lib/constants";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon name={item.icon} className="shrink-0" size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, adminEmail }: { children: React.ReactNode; adminEmail: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href="/admin" />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="size-4" /> View public site
          </Link>
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="mb-6">
          <Logo href="/admin" />
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </Sheet>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <span className="hidden text-sm font-medium text-muted-foreground sm:block">Admin Dashboard</span>
          </div>

          <div className="flex items-center gap-1">
            <NotificationCenter />
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 sm:flex">
              <Avatar name={adminEmail} size={26} />
              <span className="max-w-[160px] truncate text-xs font-medium">{adminEmail}</span>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out" title="Sign out">
                <LogOut className="size-5" />
              </Button>
            </form>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
