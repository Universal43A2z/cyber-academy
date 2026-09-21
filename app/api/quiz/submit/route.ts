import { json } from "@/lib/security/rate-limit";
import { quizSubmitSchema } from "@/lib/security/validators";
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

  const parsed = quizSubmitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" }, 400);
  }
  const { quiz_id, answers, started_at, violations = 0 } = parsed.data;

  const admin = getSupabaseAdmin();

  // Answers are scored on the server against the stored correct answers.
  // The client never receives correct_index, so student-side snooping of the
  // network / DOM cannot reveal the key. Questions and options are shuffled
  // per-attempt on the client, so grading is done by question id (not by a
  // fixed index that the client could reorder around).
  const { data: quiz } = await admin
    .from("quizzes")
    .select("id, title, week_no, time_limit_sec")
    .eq("id", quiz_id)
    .eq("published", true)
    .maybeSingle();
  if (!quiz) return json({ error: "Quiz not found or unpublished." }, 404);

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, correct_index, points, position")
    .eq("quiz_id", quiz_id)
    .order("position");

  const answerById = new Map(answers.map((a) => [a.question_id, a.selected]));
  const qs = questions ?? [];
  const ordered = [...qs].sort((a, b) => a.position - b.position);

  const marked: { question_index: number; selected: number; correct: boolean }[] = [];
  const review: { question_id: string; question_index: number; selected: number; correct: boolean; correct_index: number }[] = [];
  let score = 0;
  let total = 0;

  ordered.forEach((q, qi) => {
    total += q.points;
    const selected = answerById.get(q.id) ?? -1;
    const correct = q.correct_index === selected;
    if (correct) score += q.points;
    // Only the response receives the answer key (post submission, for the
    // review screen). The stored row keeps just the plain marks so the key
    // is never readable by mentees from their own attempt records.
    marked.push({ question_index: qi, selected, correct });
    review.push({
      question_id: q.id,
      question_index: qi,
      selected,
      correct,
      correct_index: q.correct_index,
    });
  });

  const { data: attempt, error } = await admin
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id,
      score,
      total,
      answers: marked,
      started_at,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return json({ error: "Could not record attempt." }, 500);
  }

  await auditLog({
    action: "quiz.submitted",
    userId: user.id,
    email: user.email,
    ip: getClientIp(req),
    details: { quiz_id, quiz_title: quiz.title, score, total, violations },
  });

  return json({
    ok: true,
    attempt_id: attempt!.id,
    score,
    total,
    correct: score,
    percentage: total > 0 ? Math.round((score / total) * 100) : 0,
    review,
  });
}