import "server-only";

import { createClient } from "@/lib/supabase/server";

/** The currently authenticated Supabase user (or null). */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** True when the current request is an authenticated admin. */
export async function isAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("id").eq("id", user.id).maybeSingle();
  return Boolean(data);
}

/** Throws if the caller is not an admin — call at the top of admin server actions. */
export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) throw new Error("Unauthorized: admin access required.");
}

/**
 * Append an entry to the audit trail. Best-effort — never throws into the
 * caller's flow (a failed log shouldn't fail the action).
 */
export async function logActivity(entry: {
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      action: entry.action,
      performed_by: user?.email ?? "system",
      entity_type: entry.entity_type ?? null,
      entity_id: entry.entity_id ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // swallow — auditing must not break the primary action
  }
}

/** Push a notification into the live feed (used after admin content changes). */
export async function pushNotification(n: {
  type: string;
  title: string;
  message?: string;
  link?: string;
}) {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      type: n.type,
      title: n.title,
      message: n.message ?? null,
      link: n.link ?? null,
    });
  } catch {
    // best-effort
  }
}
