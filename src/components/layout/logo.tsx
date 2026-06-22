import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-primary shadow-soft">
        <svg viewBox="0 0 64 64" className="size-5" fill="none" aria-hidden>
          <path d="M20 14v36M44 14v36M20 32h24" stroke="#7C3AED" strokeWidth="7" strokeLinecap="round" />
          <circle cx="32" cy="32" r="5" fill="#7C3AED" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight text-foreground">{SITE.name}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{SITE.product}</span>
      </span>
    </Link>
  );
}
