import { json } from "@/lib/security/rate-limit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ACTIONS = [
  "login",
  "login.failed",
  "login.password_success",
  "login.otp_success",
  "logout",
  "otp.sent_signup",
  "otp.sent_login",
  "otp.verify_failed",
  "otp.rate_limited",
  "signup.completed",
  "signup.password_set_failed",
  "signup.mentor_denied",
  "attendance.marked",
  "module.completed",
  "quiz.submitted",
  "module.created",
  "module.updated",
  "module.deleted",
  "quiz.created",
  "quiz.updated",
  "quiz.deleted",
];

export async function GET(req: Request) {
  if (!(await requireMentor())) return json({ error: "Mentor access required." }, 403);

  const query = new URL(req.url).searchParams;
  const action = query.get("action") ?? "";
  const email = query.get("email")?.trim().toLowerCase() ?? "";
  const limit = Math.min(200, Math.max(1, Number(query.get("limit") ?? 50)));

  const admin = getSupabaseAdmin();
  let builder = admin
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action && ACTIONS.includes(action)) builder = builder.eq("action", action);
  if (email) builder = builder.ilike("email", `%${email}%`);

  const { data } = await builder;
  return json({ logs: data ?? [], actions: ACTIONS });
}