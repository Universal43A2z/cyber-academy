import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

  // Security: only safe columns are fetched server-side (no correct_index),
  // and scoring happens server-side at submit time. The service-role client
  // is used so RLS (which limits quiz_questions to mentors) can't leak the
  // answers to the client — a public view would inherit that RLS and return
  // zero rows to mentees.
  const admin = getSupabaseAdmin();
  const { data: questions } = await admin
    .from("quiz_questions")
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