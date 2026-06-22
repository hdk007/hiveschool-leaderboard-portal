"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Admin login. Verifies Supabase Auth credentials AND that the user is present
 * in the `admins` table (a regular auth user is not enough to access /admin).
 */
export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { ok: false, error: "Invalid email or password." };
  }

  // Enforce admin membership.
  const { data: adminRow } = await supabase
    .from("admins")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!adminRow) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account does not have admin access." };
  }

  await logActivity({ action: "login", entity_type: "admin", entity_id: data.user.id });

  const redirectTo = (formData.get("redirect") as string) || "/admin";
  redirect(redirectTo);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
