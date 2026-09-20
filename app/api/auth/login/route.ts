import { json, rateLimit } from "@/lib/security/rate-limit";
import { loginSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const limit = rateLimit({
    key: "auth:login",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    req,
  });
  if (!limit.ok) {
    return json({ error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` }, 429);
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid email or password." }, 400);
  }
  const { email, password } = parsed.data;

  const server = await createSupabaseServerClient();
  const { data, error } = await server.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    await auditLog({
      action: "login.failed",
      email,
      ip,
      details: { message: error?.message },
    });
    // Generic message — no user enumeration.
    return json({ error: "Invalid credentials." }, 401);
  }

  await auditLog({
    action: "login.password_success",
    userId: data.user.id,
    email,
    ip,
  });

  return json({ ok: true, role: data.user.user_metadata?.role ?? "mentee" });
}