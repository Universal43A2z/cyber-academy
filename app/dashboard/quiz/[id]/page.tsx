import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuizGame from "@/components/quiz/QuizGame";

export const dynamic = "force-dynamic";

export default async function QuizPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, week_no, title, time_limit_sec")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!quiz) notFound();

  // Security: the safe view strips correct_index — answers never reach the
  // client. Scoring happens server-side at submit time.
  const { data: questions } = await supabase
    .from("quiz_questions_public")
    .select("id, quiz_id, question, options, position")
    .eq("quiz_id", id)
    .order("position");

  return (
    <div className="flex justify-center py-4">
      <QuizGame
        quiz={{
          id: quiz.id,
          title: quiz.title,
          week_no: quiz.week_no,
          time_limit_sec: quiz.time_limit_sec,
          questions: (questions ?? []).map((qn) => ({
            id: qn.id,
            quiz_id: qn.quiz_id,
            question: qn.question,
            options: qn.options as string[],
            position: qn.position,
          })),
        }}
      />
    </div>
  );
}