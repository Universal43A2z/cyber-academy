"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
import type { FeedbackCategory, FeedbackReport, FeedbackStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const catLabel: Record<FeedbackCategory, string> = {
  general: "general",
  bug: "bug",
  content: "content",
  suggestion: "suggestion",
};

const statusStyle: Record<FeedbackStatus, string> = {
  new: "bg-cyber/10 text-cyber border-cyber/30",
  in_review: "bg-warn/10 text-warn border-warn/30",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

export default function FeedbackPanel({
  reports,
}: {
  reports: FeedbackReport[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    if (subject.trim().length < 3 || message.trim().length < 5) {
      setMsg({ ok: false, text: "Subject and message look too short." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, category }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: "Feedback submitted — your mentor will review it." });
    setSubject("");
    setMessage("");
    setCategory("general");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquarePlus size={18} className="text-cyber" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
            Send feedback to your mentor
          </h2>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                Subject
              </label>
              <input
                className="input"
                placeholder="e.g. module 2 felt too fast"
                value={subject}
                maxLength={120}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
                Category
              </label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              >
                {(Object.keys(catLabel) as FeedbackCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {catLabel[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">
              Message
            </label>
            <textarea
              className="input min-h-28 resize-y"
              placeholder="What did you like, or what should improve? Report bugs and broken content here too."
              value={message}
              maxLength={2000}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {msg && (
            <p
              className={
                msg.ok ? "font-mono text-xs text-cyber" : "font-mono text-xs text-danger"
              }
            >
              {msg.text}
            </p>
          )}
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Submit feedback
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-muted">
          Your reports · {reports.length}
        </h3>
        {reports.length === 0 ? (
          <div className="panel p-6 text-sm text-muted">
            Nothing yet — feedback you send will show up here with its review status.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    {r.subject}
                  </span>
                  <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted">
                    {catLabel[r.category]}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${statusStyle[r.status]}`}
                  >
                    {r.status.replace("_", " ")}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-muted">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{r.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}