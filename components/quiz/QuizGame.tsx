"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldAlert,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import type { QuizQuestionSafe } from "@/lib/types";
import AntiCopy from "./AntiCopy";

type Phase = "intro" | "playing" | "submitting" | "done";

interface ReviewItem {
  question_index: number;
  selected: number;
  correct: boolean;
}

export default function QuizGame({
  quiz,
}: {
  quiz: {
    id: string;
    title: string;
    week_no: number;
    time_limit_sec: number;
    questions: QuizQuestionSafe[];
  };
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number)[]>(() =>
    quiz.questions.map(() => -1)
  );
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_sec);
  const [violations, setViolations] = useState(0);
  const [cheatWarn, setCheatWarn] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    review: ReviewItem[];
  } | null>(null);
  const startedAt = useRef(new Date().toISOString());
  const submittedRef = useRef(false);

  const answeredCount = useMemo(
    () => answers.filter((a) => a >= 0).length,
    [answers]
  );

  const submit = useCallback(
    async (finalAnswers: number[]) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quiz_id: quiz.id,
          answers: finalAnswers.map((selected, question_index) => ({
            question_index,
            selected,
          })),
          started_at: startedAt.current,
          violations,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setPhase("playing");
        submittedRef.current = false;
        window.alert(data.error);
        return;
      }
      setResult(data);
      setPhase("done");
    },
    [quiz.id, violations]
  );

  // Countdown.
  useEffect(() => {
    if (phase !== "playing") return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(answers);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, answers, submit]);

  // Cheat escalation.
  useEffect(() => {
    const onWarn = () => setCheatWarn(true);
    window.addEventListener("quiz-cheat-warn", onWarn);
    return () => window.removeEventListener("quiz-cheat-warn", onWarn);
  }, []);

  const answersRef = useRef(answers);

  const onViolation = useCallback((count: number) => {
    setViolations(count);
    if (count >= 3) {
      setCheatWarn(true);
      submit(answersRef.current);
    }
  }, [submit]);

  function choose(o: number) {
    const next = answers.map((v, i) => (i === index ? o : v));
    answersRef.current = next;
    setAnswers(next);
  }

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  if (phase === "intro") {
    return (
      <div className="panel max-w-lg p-6 text-center md:p-8">
        <Lock size={26} className="mx-auto mb-3 text-cyber" />
        <h1 className="font-mono text-lg font-bold uppercase tracking-widest">{quiz.title}</h1>
        <p className="mt-1 text-sm text-muted">Week {quiz.week_no} quiz game</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-lg border border-line bg-panel-2 p-3">
            <p className="font-mono text-xl font-bold tabular text-cyber">{quiz.questions.length}</p>
            <p className="text-xs text-muted">questions</p>
          </div>
          <div className="rounded-lg border border-line bg-panel-2 p-3">
            <p className="font-mono text-xl font-bold tabular text-cyber">{mm}:{ss}</p>
            <p className="text-xs text-muted">time limit</p>
          </div>
        </div>
        <ul className="mt-5 space-y-1.5 text-left font-mono text-[11px] text-muted">
          <li>• Answers are scored server-side — no answers exist in your browser.</li>
          <li>• Copy, paste, view-source and right-click are disabled.</li>
          <li>• Leaving the tab counts as a violation (3 = auto-submit).</li>
        </ul>
        <button
          onClick={() => {
            startedAt.current = new Date().toISOString();
            setPhase("playing");
          }}
          className="btn-primary mt-6 w-full"
        >
          Start challenge
        </button>
      </div>
    );
  }

  if (phase === "done" && result) {
    const pct = result.percentage;
    const grade =
      pct >= 90 ? "EXCELLENT" : pct >= 75 ? "GOOD" : pct >= 50 ? "FAIR" : "REVIEW NEEDED";
    return (
      <div className="no-select panel max-w-2xl p-6 md:p-8">
        <div className="text-center">
          <Trophy size={30} className={`mx-auto mb-3 ${pct >= 75 ? "text-cyber" : pct >= 50 ? "text-warn" : "text-danger"}`} />
          <h1 className="font-mono text-xl font-bold uppercase tracking-widest">{grade}</h1>
          <p className="mt-2 font-mono text-4xl font-bold tabular">
            {result.score}<span className="text-xl text-muted">/{result.total}</span>
          </p>
          <p className="mt-1 text-sm text-muted">{pct}% · submitted and logged</p>
        </div>

        {violations > 0 && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            <ShieldAlert size={14} />
            <span>Integrity note: {violations} cheating-protection event(s) were recorded on this attempt.</span>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {result.review.map((r) => (
            <div
              key={r.question_index}
              className="flex items-center gap-3 rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm"
            >
              {r.correct ? (
                <CheckCircle2 size={16} className="shrink-0 text-cyber" />
              ) : (
                <XCircle size={16} className="shrink-0 text-danger" />
              )}
              <span className="font-mono text-xs text-muted">
                Q{r.question_index + 1}
              </span>
              <span className="font-mono text-xs">{r.selected >= 0 ? `your answer #${r.selected + 1}` : "unanswered"}</span>
            </div>
          ))}
        </div>

        <button onClick={() => router.push("/dashboard/quiz")} className="btn-ghost mt-6 w-full">
          <ArrowLeft size={14} /> Back to quizzes
        </button>
      </div>
    );
  }

  const q = quiz.questions[index];

  return (
    <div className="no-select relative mx-auto w-full max-w-2xl">
      <AntiCopy onViolation={onViolation} />

      {/* status bar */}
      <div className="panel mb-4 flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Q{index + 1}/{quiz.questions.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full bg-cyber transition-all"
            style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
        <span className={`flex items-center gap-1.5 font-mono text-sm font-bold tabular ${timeLeft <= 30 ? "text-danger" : "text-cyber"}`}>
          <Timer size={14} /> {mm}:{ss}
        </span>
      </div>

      {/* cheat overlay */}
      {cheatWarn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <div className="panel max-w-md p-6 text-center">
            <AlertTriangle size={30} className="mx-auto mb-3 text-warn" />
            <h2 className="font-mono font-bold uppercase tracking-widest">Integrity violation</h2>
            <p className="mt-2 text-sm text-muted">
              {violations >= 3
                ? "Multiple cheating-protection events were detected. This attempt is being submitted now."
                : "Copying, dev-tools and tab-switching are disabled during quizzes. Repeated violations auto-submit your attempt."}
            </p>
            {violations >= 3 ? (
              <p className="mt-3 flex items-center justify-center gap-2 font-mono text-xs text-cyber">
                <Loader2 size={14} className="animate-spin" /> submitting…
              </p>
            ) : (
              <button onClick={() => setCheatWarn(false)} className="btn-primary mt-4 w-full">
                I understand — continue
              </button>
            )}
          </div>
        </div>
      )}

      {/* question */}
      <div className="panel p-6">
        <p className="mb-4 font-mono text-xs uppercase tracking-widest text-cyber">
          select one option
        </p>
        <h2 className="text-lg font-semibold leading-relaxed">{q.question}</h2>
        <div className="mt-5 space-y-2.5">
          {q.options.map((opt, i) => {
            const sel = answers[index] === i;
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                  sel
                    ? "border-cyber bg-cyber/10 text-cyber"
                    : "border-line bg-panel-2 text-foreground/90 hover:border-cyber/40"
                }`}
              >
                <span className="font-mono text-xs text-muted">{String.fromCharCode(65 + i)}.</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* nav */}
      <div className="mt-4 flex items-center justify-between">
        <button
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="btn-ghost"
        >
          <ArrowLeft size={14} /> Prev
        </button>
        <span className="font-mono text-xs text-muted">
          {answeredCount}/{quiz.questions.length} answered
        </span>
        {index === quiz.questions.length - 1 ? (
          <button onClick={() => submit(answers)} className="btn-primary">
            Submit <Lock size={13} />
          </button>
        ) : (
          <button onClick={() => setIndex((i) => Math.min(quiz.questions.length - 1, i + 1))} className="btn-primary">
            Next <ArrowRight size={14} />
          </button>
        )}
      </div>

      {phase === "submitting" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
          <div className="flex items-center gap-3 font-mono text-sm text-cyber">
            <Loader2 size={18} className="animate-spin" /> scoring on the server…
          </div>
        </div>
      )}
    </div>
  );
}