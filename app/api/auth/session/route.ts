import { json } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();

  if (!user) return json({ user: null });

  const { data: profile } = await server
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
  });
}