"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
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

export default function FeedbackInbox() {
  const [reports, setReports] = useState<FeedbackReport[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/feedback");
    const data = await res.json();
    setReports(data.reports ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function setStatus(id: string, status: FeedbackStatus) {
    setBusyId(id);
    const res = await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusyId(null);
    if (data.report) {
      setReports((prev) =>
        (prev ?? []).map((r) => (r.id === id ? { ...r, status: data.report.status } : r))
      );
    }
  }

  return (
    <div className="space-y-4">
      {!reports ? (
        <div className="panel flex items-center gap-3 p-6 font-mono text-sm text-cyber">
          <Loader2 size={16} className="animate-spin" /> loading feedback…
        </div>
      ) : reports.length === 0 ? (
        <div className="panel p-6 text-sm text-muted">
          No feedback reports yet — mentees will send their reports from their dashboard.
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
                  {r.user_email}
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
              <div className="mt-3 flex items-center gap-2">
                {r.status !== "in_review" && (
                  <button
                    className="btn-ghost !px-2.5 !py-1.5"
                    onClick={() => setStatus(r.id, "in_review")}
                    disabled={busyId === r.id}
                  >
                    {busyId === r.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RotateCcw size={14} />
                    )}
                    In review
                  </button>
                )}
                {r.status !== "resolved" && (
                  <button
                    className="btn-ghost !px-2.5 !py-1.5"
                    onClick={() => setStatus(r.id, "resolved")}
                    disabled={busyId === r.id}
                  >
                    {busyId === r.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}