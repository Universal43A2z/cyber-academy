import { json } from "@/lib/security/rate-limit";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { requireMentor } from "@/lib/security/require-mentor";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);
  const { id } = await params;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("announcements").delete().eq("id", id);

  if (error) {
    return json({ error: "Could not delete the announcement." }, 500);
  }

  await auditLog({
    action: "announcement.deleted",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { announcement_id: id },
  });

  return json({ ok: true });
}