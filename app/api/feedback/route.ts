import { json } from "@/lib/security/rate-limit";
import { feedbackSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FeedbackReport } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const { subject, message, category } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: report, error } = await admin
    .from("feedback_reports")
    .insert({
      user_id: user.id,
      user_email: user.email ?? "unknown",
      subject,
      message,
      category: category ?? "general",
      status: "new",
    })
    .select("id, user_id, user_email, subject, message, category, status, created_at")
    .single();

  if (error) {
    return json({ error: "Could not submit feedback." }, 500);
  }

  await auditLog({
    action: "feedback.submit",
    userId: user.id,
    email: user.email ?? undefined,
    details: { subject, category: category ?? "general" },
    ip: getClientIp(req),
  });

  return json({ report: report as FeedbackReport }, 201);
}

export async function GET() {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: profile } = await server
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isMentor = profile?.role === "mentor";

  const query = server.from("feedback_reports").select(
    "id, user_id, user_email, subject, message, category, status, created_at"
  );
  const { data: reports, error } = isMentor
    ? await query.order("created_at", { ascending: false })
    : await query.eq("user_id", user.id).order("created_at", { ascending: false });

  if (error) {
    return json({ error: "Could not load feedback." }, 500);
  }

  return json({ reports: (reports ?? []) as FeedbackReport[] }, 200);
}