import { json } from "@/lib/security/rate-limit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { MenteePerformance } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireMentor())) return json({ error: "Mentor access required." }, 403);

  const admin = getSupabaseAdmin();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, year_level, role, avatar_url, created_at")
    .eq("role", "mentee");
  if (!profiles) return json({ mentees: [] });

  const { data: attendances } = await admin.from("attendances").select(
    "user_id, status"
  );
  const { data: attempts } = await admin
    .from("quiz_attempts")
    .select("user_id, score, total, finished_at")
    .order("finished_at", { ascending: false });
  const { data: progress } = await admin
    .from("module_progress")
    .select("user_id, completed")
    .eq("completed", true);
  const { data: logs } = await admin
    .from("activity_logs")
    .select("user_id, created_at")
    .order("created_at", { ascending: false });

  const byUser = <T,>(rows: T[] | null) => {
    const m = new Map<string, T[]>();
    for (const r of rows ?? []) {
      const uid = (r as { user_id: string }).user_id;
      if (!uid) continue;
      if (!m.has(uid)) m.set(uid, []);
      m.get(uid)!.push(r);
    }
    return m;
  };

  const attMap = byUser(attendances) as Map<string, { user_id: string; status: string }[]>;
  const attStatus = new Map<string, { present: number; late: number; absent: number; total: number }>();
  for (const [uid, rows] of attMap) {
    const a = { present: 0, late: 0, absent: 0, total: rows.length };
    for (const r of rows) {
      if (r.status === "present") a.present++;
      else if (r.status === "late") a.late++;
      else if (r.status === "absent") a.absent++;
    }
    attStatus.set(uid, a);
  }

  const attemptMap = byUser(attempts) as Map<string, { score: number; total: number }[]>;

  const progressSet = new Set((progress ?? []).map((p) => p.user_id));
  const lastActive = new Map<string, string>();
  for (const l of (logs as { user_id: string; created_at: string }[] | null) ?? []) {
    if (l.user_id && !lastActive.has(l.user_id)) lastActive.set(l.user_id, l.created_at);
  }

  const mentees: MenteePerformance[] = profiles.map((p) => {
    const myAttempts = attemptMap.get(p.id) ?? [];
    const a = attStatus.get(p.id) ?? { present: 0, late: 0, absent: 0, total: 0 };
    const scores = myAttempts.map((x) => x.score);
    const totals = myAttempts.map((x) => x.total).reduce((s, t) => s + t, 0) || 1;
    return {
      profile: p,
      attendance: { total: a.total, present: a.present, late: a.late, absent: a.absent },
      quiz: {
        attempts: myAttempts.length,
        best: scores.length ? Math.max(...scores) : null,
        avg: myAttempts.length ? Math.round((scores.reduce((s, x) => s + x, 0) / totals) * 100) : null,
      },
      modules_done: progressSet.has(p.id) ? (progress?.filter((x) => x.user_id === p.id).length ?? 0) : 0,
      last_active: lastActive.get(p.id) ?? null,
    };
  });

  return json({ mentees });
}