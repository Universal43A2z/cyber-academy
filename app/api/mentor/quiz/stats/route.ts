import { json } from "@/lib/security/rate-limit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface AnswerMark {
  question_index: number;
  selected: number;
}

export async function GET(req: Request) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const quizId = new URL(req.url).searchParams.get("quiz_id");
  if (!quizId) return json({ error: "quiz_id is required." }, 400);

  const admin = getSupabaseAdmin();
  const { data: quiz } = await admin
    .from("quizzes")
    .select("id, title")
    .eq("id", quizId)
    .maybeSingle();
  if (!quiz) return json({ error: "Quiz not found." }, 404);

  const { data: questions } = await admin
    .from("quiz_questions")
    .select("id, question, options, correct_index, position")
    .eq("quiz_id", quizId)
    .order("position");

  const { data: attempts } = await admin
    .from("quiz_attempts")
    .select("answers")
    .eq("quiz_id", quizId);

  const items = (questions ?? []).map((q) => {
    let attempted = 0;
    let correct_count = 0;
    for (const a of attempts ?? []) {
      const marks = (a.answers ?? []) as AnswerMark[];
      const ans = marks.find((x) => x.question_index === q.position);
      if (ans && ans.selected >= 0) {
        attempted++;
        if (ans.selected === q.correct_index) correct_count++;
      }
    }
    return {
      id: q.id,
      position: q.position,
      question: q.question,
      options: q.options as string[],
      correct_index: q.correct_index,
      attempted,
      correct_count,
      correct_pct: attempted ? Math.round((correct_count / attempted) * 100) : null,
    };
  });

  return json({
    quiz,
    attempts: attempts?.length ?? 0,
    items,
  });
}