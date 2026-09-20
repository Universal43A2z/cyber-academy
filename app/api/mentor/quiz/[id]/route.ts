import { json } from "@/lib/security/rate-limit";
import { quizCreateSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Bad id" }, 400);

  const parsed = quizCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid quiz" }, 400);
  const { questions, ...q } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: quiz, error: quizErr } = await admin
    .from("quizzes")
    .update({
      week_no: q.week_no,
      title: q.title,
      description: q.description ?? null,
      time_limit_sec: q.time_limit_sec ?? 600,
      published: q.published ?? true,
    })
    .eq("id", id)
    .select("id, week_no, title")
    .single();

  if (quizErr) return json({ error: "Could not update quiz." }, 500);

  await admin.from("quiz_questions").delete().eq("quiz_id", id);
  const { error: qErr } = await admin.from("quiz_questions").insert(
    questions.map((c, i) => ({
      quiz_id: id,
      question: c.question,
      options: c.options,
      correct_index: c.correct_index,
      points: c.points ?? 1,
      position: i,
    }))
  );
  if (qErr) return json({ error: "Could not save questions." }, 500);

  await auditLog({
    action: "quiz.updated",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { quiz_id: id, title: quiz.title },
  });

  return json({ ok: true, quiz });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Bad id" }, 400);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("quizzes").delete().eq("id", id);
  if (error) return json({ error: "Could not delete quiz." }, 500);

  await auditLog({
    action: "quiz.deleted",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { quiz_id: id },
  });

  return json({ ok: true });
}