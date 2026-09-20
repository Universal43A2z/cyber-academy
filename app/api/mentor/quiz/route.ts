import { json } from "@/lib/security/rate-limit";
import { quizCreateSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const parsed = quizCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid quiz" }, 400);
  const { questions, ...q } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: quiz, error: quizErr } = await admin
    .from("quizzes")
    .insert({
      week_no: q.week_no,
      title: q.title,
      description: q.description ?? null,
      time_limit_sec: q.time_limit_sec ?? 600,
      published: q.published ?? true,
      created_by: mentor.id,
    })
    .select("id, week_no, title")
    .single();

  if (quizErr) return json({ error: "Could not create quiz." }, 500);

  const { error: qErr } = await admin.from("quiz_questions").insert(
    questions.map((c, i) => ({
      quiz_id: quiz.id,
      question: c.question,
      options: c.options,
      correct_index: c.correct_index,
      points: c.points ?? 1,
      position: i,
    }))
  );

  if (qErr) {
    await admin.from("quizzes").delete().eq("id", quiz.id);
    return json({ error: "Could not save questions." }, 500);
  }

  await auditLog({
    action: "quiz.created",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { quiz_id: quiz.id, title: quiz.title, question_count: questions.length },
  });

  return json({ ok: true, quiz });
}

export async function GET() {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const admin = getSupabaseAdmin();
  const { data: quizzes } = await admin.from("quizzes").select("*").order("week_no");
  if (!quizzes) return json({ quizzes: [] });

  const { data: questions } = await admin.from("quiz_questions").select("*");
  const byQuiz: Record<string, { position: number }[]> = {};
  for (const qq of questions ?? []) {
    (byQuiz[qq.quiz_id] ??= []).push(qq);
  }

  return json({
    quizzes: quizzes.map((qz) => ({
      ...qz,
      questions: (byQuiz[qz.id] ?? []).sort((a, b) => a.position - b.position),
    })),
  });
}