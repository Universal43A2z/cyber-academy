import { json, rateLimit } from "@/lib/security/rate-limit";
import { resetSendSchema, resetConfirmSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Password reset via the same OTP email channel already used for login:
 *   POST { action: "send" }    -> the user gets a 6-digit code by email
 *   POST { action: "confirm" } -> code verified server-side, password replaced
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const admin = getSupabaseAdmin();
  const body = await req.json().catch(() => null);

  const action = body?.action;
  if (action === "send") {
    const parsed = resetSendSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
    }
    const { email } = parsed.data;

    const limit = rateLimit({
      key: "auth:reset:send",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      req,
    });
    if (!limit.ok) {
      return json({ error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` }, 429);
    }

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    // Avoid account enumeration: always answer success, but only send a code
    // when the address actually belongs to a registered user.
    if (existing) {
      const { error } = await admin.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        await auditLog({
          action: "reset.send_failed",
          email,
          ip,
          details: { message: error.message },
        });
        return json({ error: "Could not send the reset code. Please try again in a moment." }, 400);
      }
    }

    await auditLog({
      action: "reset.code_sent",
      userId: existing?.id ?? null,
      email,
      ip,
    });

    return json({ ok: true, message: "If that address exists, a 6-digit reset code was sent." });
  }

  if (action === "confirm") {
    const parsed = resetConfirmSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
    }
    const { email, token, password } = parsed.data;

    const limit = rateLimit({
      key: "auth:reset:confirm",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      req,
    });
    if (!limit.ok) {
      return json({ error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` }, 429);
    }

    const { data, error } = await admin.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.user) {
      await auditLog({
        action: "reset.code_failed",
        email,
        ip,
        details: { message: error?.message },
      });
      return json({ error: "Invalid or expired code." }, 400);
    }

    const { error: pwErr } = await admin.auth.admin.updateUserById(data.user.id, {
      password,
    });
    if (pwErr) {
      // Surface the real reason (e.g. the project's password policy rejecting
      // a single letter-block with numbers/symbols only at the start/end) so
      // the mentee knows what to change instead of a dead-end message.
      return json({ error: pwErr.message || "Could not update the password. Please try again." }, 400);
    }

    await auditLog({
      action: "reset.completed",
      userId: data.user.id,
      email,
      ip,
    });

    return json({ ok: true, message: "Password updated. Sign in with your new password." });
  }

  return json({ error: "Unknown action." }, 400);
}