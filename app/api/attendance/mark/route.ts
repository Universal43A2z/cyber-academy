import { json } from "@/lib/security/rate-limit";
import { attendanceSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const parsed = attendanceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);
  }
  const { week_no, status, note } = parsed.data;

  const admin = getSupabaseAdmin();

  // Upsert: one attendance record per mentee per week.
  const { error } = await admin.from("attendances").upsert(
    {
      user_id: user.id,
      week_no,
      status: status ?? "present",
      note: note ?? null,
      date: new Date().toISOString(),
      marked_by: user.id,
    },
    { onConflict: "user_id,week_no" }
  );

  if (error) {
    return json({ error: "Could not save attendance." }, 500);
  }

  await auditLog({
    action: "attendance.marked",
    userId: user.id,
    email: user.email,
    ip: getClientIp(req),
    details: { week_no, status: status ?? "present" },
  });

  return json({ ok: true });
}