import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server Supabase client (RSC, Server Actions, Route Handlers). Reads/writes the
 * auth session from cookies. Governed by RLS using the logged-in user's JWT.
 *
 * In Next.js 15 `cookies()` is async.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` is called from a Server Component where cookies are
            // read-only. The session refresh in middleware handles writes, so
            // this can be safely ignored.
          }
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS. ONLY use inside trusted server code after
 * verifying the caller is an authenticated admin. Never import this into a
 * client component.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
