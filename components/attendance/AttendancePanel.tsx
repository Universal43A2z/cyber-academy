"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle2, Clock, XCircle, Loader2, Flag } from "lucide-react";

export default function AttendancePanel({
  week,
  history,
}: {
  week: number;
  history: {
    id: string;
    week_no: number;
    status: "present" | "late" | "absent";
    note: string | null;
    date: string;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState("");

  const existing = history.find((h) => h.week_no === week);

  async function mark() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/attendance/mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_no: week, note: note || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: "Attendance recorded for this week." });
    setNote("");
    router.refresh();
  }

  const statusIcon = {
    present: <CheckCircle2 size={14} className="text-cyber" />,
    late: <Clock size={14} className="text-warn" />,
    absent: <XCircle size={14} className="text-danger" />,
  };

  return (
    <div className="space-y-8">
      <div className="panel p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-cyber" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
            Mark attendance · week {week}
          </h2>
        </div>
        {existing ? (
          <p className="mb-2 text-sm text-muted">
            Already recorded this week:{" "}
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase text-muted">
              {statusIcon[existing.status]} {existing.status}
            </span>
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted">
            One tap. The mentor&apos;s dashboard updates instantly.
          </p>
        )}
        <textarea
          className="input mb-3 min-h-[70px]"
          placeholder="Optional note for mentor (e.g. completing late?)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />
        <div className="flex items-center gap-3">
          <button onClick={mark} disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
            {existing ? "Update attendance" : "Mark present"}
          </button>
          {msg && (
            <span className={`text-xs ${msg.ok ? "text-cyber" : "text-danger"}`}>{msg.text}</span>
          )}
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted/70">
          note: late arrivals are audited in the security log.
        </p>
      </div>

      <div>
        <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest">My record</h3>
        {history.length === 0 ? (
          <div className="panel p-6 text-center text-sm text-muted">No attendance entries yet.</div>
        ) : (
          <div className="panel overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-2.5">Week</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Note</th>
                  <th className="px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h) => (
                  <tr key={h.id} className="border-b border-line/50 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-cyber">W{h.week_no}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase">
                        {statusIcon[h.status]} {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{h.note ?? "—"}</td>
                    <td className="px-4 py-2.5 text-muted">{new Date(h.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}