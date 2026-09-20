import Link from "next/link";
import { Gamepad2, Lock, StopCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuizListPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const [{ data: quizzes }, { data: attempts }] = await Promise.all([
    supabase.from("quizzes").select("*").eq("published", true).order("week_no"),
    supabase.from("quiz_attempts").select("quiz_id, score, total, finished_at").eq("user_id", uid).order("finished_at", { ascending: false }),
  ]);

  const doneSet = new Map<string, { score: number; total: number }>();
  for (const a of attempts ?? []) {
    if (!doneSet.has(a.quiz_id)) doneSet.set(a.quiz_id, { score: a.score, total: a.total });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz games</h1>
          <p className="mt-1 text-sm text-muted">
            Timed challenges. Questions can&apos;t be copied and answers are scored server-side.
          </p>
        </div>
        <span className="chip">
          <Lock size={11} /> anti-copy active
        </span>
      </div>

      <div className="space-y-3">
        {(quizzes ?? []).map((qz) => {
          const best = doneSet.get(qz.id);
          return (
            <Link
              key={qz.id}
              href={`/dashboard/quiz/${qz.id}`}
              className="panel panel-hover block p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Gamepad2 size={20} className="mt-0.5 shrink-0 text-cyber" />
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-cyber">
                      {weekLabel(qz.week_no)} challenge · {Math.floor(qz.time_limit_sec / 60)} min
                    </p>
                    <h2 className="mt-1 font-semibold">{qz.title}</h2>
                    {qz.description ? <p className="mt-1 text-sm text-muted">{qz.description}</p> : null}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  {best ? (
                    <span className="font-mono text-sm font-bold text-cyber">
                      best {best.score}/{best.total}
                    </span>
                  ) : (
                    <span className="chip text-muted">
                      <StopCircle size={11} /> not attempted
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
        {!quizzes?.length ? (
          <div className="panel p-8 text-center text-muted">
            No quizzes published yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}