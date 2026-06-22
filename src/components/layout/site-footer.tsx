import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { PUBLIC_NAV, SITE } from "@/lib/constants";

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">{SITE.description}</p>
            <p className="text-sm font-medium text-accent">{SITE.tagline}</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Explore</h4>
            <ul className="space-y-2">
              {PUBLIC_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Company</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Admin</h4>
            <ul className="space-y-2">
              <li><Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">Admin Login</Link></li>
              <li><Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <p>Built with Next.js 15 · Supabase · Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
