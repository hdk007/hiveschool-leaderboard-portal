"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Megaphone, Swords, Award, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Popover } from "@/components/ui/popover";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import type { AppNotification } from "@/types/database";

const TYPE_ICON: Record<string, React.ElementType> = {
  announcement: Megaphone,
  challenge: Swords,
  achievement: Award,
  info: Info,
};

/**
 * Notification bell + dropdown. Loads recent notifications and live-appends new
 * ones via Realtime, animating the bell + unread count when they arrive.
 */
export function NotificationCenter() {
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [pulse, setPulse] = React.useState(false);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => {
        if (active && data) setItems(data as AppNotification[]);
      });

    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) => [payload.new as AppNotification, ...prev].slice(0, 15));
          setPulse(true);
          setTimeout(() => setPulse(false), 2000);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((i) => !readIds.has(i.id)).length;
  const markAllRead = () => setReadIds(new Set(items.map((i) => i.id)));

  return (
    <Popover
      contentClassName="w-80 p-0"
      trigger={
        <span className="relative inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="size-5" />
          {pulse && (
            <motion.span
              className="absolute inset-0 rounded-lg"
              initial={{ boxShadow: "0 0 0 0 rgba(124,58,237,0.5)" }}
              animate={{ boxShadow: "0 0 0 8px rgba(124,58,237,0)" }}
              transition={{ duration: 1.2, repeat: 1 }}
            />
          )}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      }
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              items.map((n) => {
                const Ico = TYPE_ICON[n.type] ?? Info;
                const isUnread = !readIds.has(n.id);
                const body = (
                  <div
                    className={`flex gap-3 px-4 py-3 transition-colors hover:bg-secondary ${
                      isUnread ? "bg-accent/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Ico className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      {n.message && <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>}
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={close}>
                    {body}
                  </Link>
                ) : (
                  <div key={n.id}>{body}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}
