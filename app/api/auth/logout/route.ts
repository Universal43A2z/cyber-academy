import { json } from "@/lib/security/rate-limit";
import { auditLog } from "@/lib/security/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  await server.auth.signOut();

  await auditLog({
    action: "logout",
    userId: user?.id ?? null,
    email: user?.email ?? null,
    ip: getClientIp(req),
  });

  return json({ ok: true });
}