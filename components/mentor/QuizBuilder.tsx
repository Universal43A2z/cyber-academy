"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Gamepad2,
  CheckCircle2,
  Trash,
  BarChart3,
  X,
} from "lucide-react";

interface QuestionStat {
  id: string;
  position: number;
  question: string;
  options: string[];
  correct_index: number;
  attempted: number;
  correct_count: number;
  correct_pct: number | null;
}

interface QuizStats {
  quiz: { id: string; title: string };
  attempts: number;
  items: QuestionStat[];
}

interface QuestionDraft {
  question: string;
  options: string[];
  correct_index: number;
  points: number;
  position: number;
}

interface QuizDraft {
  week_no: number;
  title: string;
  description: string;
  time_limit_sec: number;
  published: boolean;
  questions: QuestionDraft[];
}

const emptyQuestion = (pos: number): QuestionDraft => ({
  question: "",
  options: ["", "", "", ""],
  correct_index: 0,
  points: 1,
  position: pos,
});

const emptyQuiz = (): QuizDraft => ({
  week_no: 1,
  title: "",
  description: "",
  time_limit_sec: 600,
  published: true,
  questions: [emptyQuestion(0)],
});

interface ServerQuiz {
  id: string;
  week_no: number;
  title: string;
  published: boolean;
  questions?: { question: string; options: string[]; correct_index: number; points: number; position: number }[];
}

export default function QuizBuilder() {
  const [quizzes, setQuizzes] = useState<ServerQuiz[] | null>(null);
  const [draft, setDraft] = useState<QuizDraft>(emptyQuiz());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [stats, setStats] = useState<{ quizId: string; data: QuizStats | null; error?: string } | null>(null);

  async function openStats(id: string) {
    setStats({ quizId: id, data: null });
    const res = await fetch(`/api/mentor/quiz/stats?quiz_id=${id}`);
    const data = await res.json();
    if (data.error) {
      setStats({ quizId: id, data: null, error: data.error });
      return;
    }
    setStats({ quizId: id, data });
  }

  async function load() {
    const res = await fetch("/api/mentor/quiz");
    const data = await res.json();
    setQuizzes(data.quizzes ?? []);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function setQ<K extends keyof QuizDraft>(k: K, v: QuizDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function setQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  }

  function setOpt(qi: number, oi: number, v: string) {
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? v : o)) } : q
      ),
    }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(
      editingId ? `/api/mentor/quiz/${editingId}` : "/api/mentor/quiz",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_no: draft.week_no,
          title: draft.title,
          description: draft.description || null,
          time_limit_sec: draft.time_limit_sec,
          published: draft.published,
          questions: draft.questions,
        }),
      }
    );
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: editingId ? "Quiz updated." : "Quiz published." });
    setDraft(emptyQuiz());
    setEditingId(null);
    load();
  }

  function edit(q: ServerQuiz) {
    setEditingId(q.id);
    setDraft(
      q.questions?.length
        ? {
            week_no: q.week_no,
            title: q.title,
            description: "",
            time_limit_sec: 600,
            published: q.published,
            questions: [...(q.questions as QuestionDraft[])]
              .sort((a, b) => a.position - b.position),
          }
        : emptyQuiz()
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this quiz and all its attempts?")) return;
    await fetch(`/api/mentor/quiz/${id}`, { method: "DELETE" });
    load();
  }

  const complete = draft.questions.every(
    (q) => q.question.trim() && q.options.every((o) => o.trim())
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
              {editingId ? "Edit quiz" : "Build a quiz"}
            </h2>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setDraft(emptyQuiz()); }}
                className="font-mono text-xs text-muted hover:text-foreground"
              >
                cancel edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Week</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={52}
                  value={draft.week_no}
                  onChange={(e) => setQ("week_no", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label">Minutes</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={60}
                  value={Math.round(draft.time_limit_sec / 60)}
                  onChange={(e) => setQ("time_limit_sec", Math.max(1, Number(e.target.value)) * 60)}
                />
              </div>
              <div>
                <label className="label">Visible</label>
                <button
                  onClick={() => setQ("published", !draft.published)}
                  className={`btn w-full ${draft.published ? "btn-primary" : "btn-ghost"}`}
                >
                  {draft.published ? "Live" : "Draft"}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={draft.title}
                onChange={(e) => setQ("title", e.target.value)}
                placeholder="Week {n} Perimeter Challenge"
              />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input
                className="input"
                value={draft.description}
                onChange={(e) => setQ("description", e.target.value)}
              />
            </div>
          </div>
        </div>

        {draft.questions.map((q, qi) => (
          <div key={qi} className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="chip">Q{qi + 1}</span>
              {draft.questions.length > 1 && (
                <button
                  onClick={() => setDraft((d) => ({ ...d, questions: d.questions.filter((_, i) => i !== qi) }))}
                  className="btn-danger !px-2 !py-1 text-xs"
                >
                  <Trash size={12} /> remove
                </button>
              )}
            </div>
            <textarea
              className="input mb-3 min-h-[70px]"
              placeholder="Enter the question…"
              value={q.question}
              onChange={(e) => setQuestion(qi, { question: e.target.value })}
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="mb-2 flex items-center gap-2">
                <button
                  onClick={() => setQuestion(qi, { correct_index: oi })}
                  title="Mark as correct"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border font-mono text-xs transition ${
                    q.correct_index === oi
                      ? "border-cyber bg-cyber/20 text-cyber"
                      : "border-line bg-panel-2 text-muted hover:border-cyber/40"
                  }`}
                >
                  {String.fromCharCode(65 + oi)}
                </button>
                <input
                  className="input"
                  placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => setOpt(qi, oi, e.target.value)}
                />
                {q.correct_index === oi && (
                  <CheckCircle2 size={14} className="shrink-0 text-cyber" />
                )}
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-muted">
                points
                <input
                  className="input !w-20 !py-1 text-center"
                  type="number"
                  min={1}
                  max={10}
                  value={q.points}
                  onChange={(e) => setQuestion(qi, { points: Number(e.target.value) })}
                />
              </label>
              <span className="font-mono text-[11px] text-muted">
                highlighted letter = correct answer
              </span>
            </div>
          </div>
        ))}

        <button
          onClick={() =>
            setDraft((d) => ({
              ...d,
              questions: [...d.questions, emptyQuestion(d.questions.length)],
            }))
          }
          className="btn-ghost w-full"
        >
          <Plus size={14} /> Add question
        </button>

        <button onClick={save} disabled={busy || !draft.title.trim() || !complete} className="btn-primary w-full">
          {busy ? <Loader2 size={15} className="animate-spin" /> : editingId ? <Pencil size={15} /> : <Gamepad2 size={15} />}
          {editingId ? "Update quiz" : "Publish quiz"}
        </button>
        {msg && (
          <p className={`flex items-center gap-2 text-xs ${msg.ok ? "text-cyber" : "text-danger"}`}>
            <CheckCircle2 size={13} /> {msg.text}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest">
          Published quizzes ({quizzes?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {quizzes?.map((qz) => (
            <div key={qz.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-cyber">
                    week {qz.week_no} · {qz.questions?.length ?? 0} questions {!qz.published && <span className="text-warn">· draft</span>}
                  </p>
                  <h3 className="font-semibold">{qz.title}</h3>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => openStats(qz.id)} className="btn-ghost !px-2.5 !py-1.5" title="Stats">
                    <BarChart3 size={13} />
                  </button>
                  <button onClick={() => edit(qz)} className="btn-ghost !px-2.5 !py-1.5" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(qz.id)} className="btn-danger !px-2.5 !py-1.5" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!quizzes?.length && (
            <div className="panel p-6 text-center text-sm text-muted">
              No quizzes yet — publish your first challenge.
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-6">
          <div className="panel max-h-[85vh] w-full max-w-2xl overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Question stats</h3>
                <p className="mt-1 text-xs text-muted">
                  {stats.data ? `${stats.data.quiz.title} · ${stats.data.attempts} attempt(s)` : "loading…"}
                </p>
              </div>
              <button onClick={() => setStats(null)} className="btn-ghost !px-2.5 !py-1.5" title="Close">
                <X size={15} />
              </button>
            </div>

            {!stats.data ? (
              <div className="flex items-center gap-3 font-mono text-sm text-cyber">
                <Loader2 size={16} className="animate-spin" /> aggregating answers…
              </div>
            ) : stats.error ? (
              <p className="text-sm text-danger">{stats.error}</p>
            ) : stats.data.items.length ? (
              <div className="space-y-4">
                {stats.data.items.map((it) => {
                  const bar = it.correct_pct ?? 0;
                  const barColor = bar >= 75 ? "bg-cyber" : bar >= 50 ? "bg-warn" : "bg-danger";
                  return (
                    <div key={it.id} className="rounded-lg border border-line bg-panel-2 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold">
                          <span className="mr-2 font-mono text-xs text-muted">Q{it.position + 1}</span>
                          {it.question}
                        </p>
                        <span className="shrink-0 font-mono text-xs tabular text-muted">
                          {it.correct_count}/{it.attempted} correct
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                        <div className={`h-full ${barColor}`} style={{ width: `${bar}%` }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-mono uppercase tracking-wider text-cyber">
                          correct: {String.fromCharCode(65 + it.correct_index)}
                        </span>
                        <span className="font-mono text-muted">
                          {it.attempted ? `${it.correct_pct}% answered correctly` : "no answers yet"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No questions on this quiz.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}