import { json, rateLimit } from "@/lib/security/rate-limit";
import { verifyOtpSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  const limit = rateLimit({
    key: "auth:verify",
    limit: 10,
    windowMs: 15 * 60 * 1000,
    req,
  });
  if (!limit.ok) {
    return json({ error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` }, 429);
  }

  const parsed = verifyOtpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const input = parsed.data;
  const admin = getSupabaseAdmin();

  // Verify the OTP with the anon-level flow so the freshly created user can
  // be part of this session; we then persist the session into cookies.
  const { data, error } = await admin.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: "email",
  });

  if (error || !data.session || !data.user) {
    auditLog({
      action: "otp.verify_failed",
      email: input.email,
      ip,
      details: { mode: input.mode, message: error?.message },
    });
    return json({ error: "Invalid or expired code." }, 400);
  }

  // First-time signup: attach the password they chose & provisioning metadata
  // so the account is usable with both OTP and password login.
  if (input.mode === "signup") {
    if (input.password) {
      const { error: pwErr } = await admin.auth.admin.updateUserById(data.user.id, {
        password: input.password,
      });
      if (pwErr) {
        await auditLog({
          action: "signup.password_set_failed",
          email: input.email,
          ip,
          details: { message: pwErr.message },
        });
      }
    }
    await auditLog({
      action: "signup.completed",
      userId: data.user.id,
      email: input.email,
      ip,
      details: {
        full_name: data.user.user_metadata?.full_name ?? null,
        role: data.user.user_metadata?.role ?? "mentee",
      },
    });
  } else {
    await auditLog({
      action: "login.otp_success",
      userId: data.user.id,
      email: input.email,
      ip,
    });
  }

  // Persist the session into HttpOnly cookies server-side.
  const server = await createSupabaseServerClient();
  await server.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return json({ ok: true });
}