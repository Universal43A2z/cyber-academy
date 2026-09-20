import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Enforces that the caller is an authenticated mentor. Returns the user id
 * on success or null when the caller is forged / a non-mentor (401/403).
 */
export async function requireMentor(): Promise<{ id: string; email: string } | null> {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return null;

  const role = user.user_metadata?.role ?? (await profileRole(user.id));
  if (role !== "mentor") return null;

  return { id: user.id, email: user.email ?? "" };
}

async function profileRole(userId: string): Promise<string | null> {
  const server = await createSupabaseServerClient();
  const { data } = await server
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role ?? null;
}