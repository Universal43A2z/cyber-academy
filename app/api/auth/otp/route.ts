import { json, rateLimit } from "@/lib/security/rate-limit";
import { sendOtpSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Slow down credential harvesters / mailbox spam.
  const limit = rateLimit({
    key: "auth:otp",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    req,
  });
  if (!limit.ok) {
    auditLog({
      action: "otp.rate_limited",
      email: null,
      ip,
      details: { retryAfterSec: limit.retryAfterSec },
    });
    return json({ error: `Too many attempts. Try again in ${limit.retryAfterSec}s.` }, 429);
  }

  // 2. Strict input validation.
  const parsed = sendOtpSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request";
    return json({ error: msg }, 400);
  }
  const input = parsed.data;

  const admin = getSupabaseAdmin();

  // 3. Mentor signup requires the mentor access code held server-side.
  if (input.mode === "signup" && input.role === "mentor") {
    const expected = process.env.MENTOR_ACCESS_CODE;
    if (!expected || input.mentor_code !== expected) {
      auditLog({
        action: "signup.mentor_denied",
        email: input.email,
        ip,
      });
      return json({ error: "Invalid mentor access code." }, 403);
    }
  }

  // 4. Send the 6-digit OTP. On signup the account is provisioned once the
  //    code is verified (shouldCreateUser).
  const { error } = await admin.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: input.mode === "signup",
      data:
        input.mode === "signup"
          ? {
              full_name: input.full_name ?? "",
              role: input.role ?? "mentee",
              year_level: input.year_level ?? null,
            }
          : undefined,
    },
  });

  if (error) {
    auditLog({
      action: "otp.send_failed",
      email: input.email,
      ip,
      details: { message: error.message },
    });
    // Generic error — never reveal whether an account exists.
    return json({ error: "Could not send the code. Please try again." }, 400);
  }

  auditLog({
    action: input.mode === "signup" ? "otp.sent_signup" : "otp.sent_login",
    email: input.email,
    ip,
    details: { mode: input.mode },
  });

  const devHint =
    process.env.NODE_ENV === "development"
      ? " (dev: check the Supabase auth emails for the code)"
      : "";
  return json({ ok: true, message: `Code sent to ${input.email}${devHint}` });
}