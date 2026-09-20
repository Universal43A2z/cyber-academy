import { json } from "@/lib/security/rate-limit";
import { requireMentor } from "@/lib/security/require-mentor";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";

const statusSchema = z.object({ status: z.enum(["new", "in_review", "resolved"]) });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Forbidden" }, 403);

  const { id } = await params;
  const parsed = statusSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid status" }, 400);
  }

  const admin = getSupabaseAdmin();
  const { data: report, error } = await admin
    .from("feedback_reports")
    .update({ status: parsed.data.status })
    .eq("id", id)
    .select("id, user_id, user_email, subject, message, category, status, created_at")
    .maybeSingle();

  if (error || !report) {
    return json({ error: "Could not update feedback." }, 404);
  }

  await auditLog({
    action: "feedback.status",
    userId: mentor.id,
    email: mentor.email,
    details: { report_id: id, status: parsed.data.status },
    ip: getClientIp(req),
  });

  return json({ report }, 200);
}