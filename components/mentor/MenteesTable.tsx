"use client";

import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck,
  Gamepad2,
  BookOpen,
  CircleDot,
  Loader2,
} from "lucide-react";
import type { MenteePerformance } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function MenteesTable() {
  const [mentees, setMentees] = useState<MenteePerformance[] | null>(null);

  useEffect(() => {
    fetch("/api/mentor/mentees")
      .then((r) => r.json())
      .then((d) => setMentees(d.mentees ?? []));
  }, []);

  if (!mentees) {
    return (
      <div className="panel flex items-center gap-3 p-6 font-mono text-sm text-cyber">
        <Loader2 size={16} className="animate-spin" /> aggregating performance…
      </div>
    );
  }

  const presentTotal = mentees.reduce((s, m) => s + m.attendance.present, 0);
  const attTotal = mentees.reduce((s, m) => s + m.attendance.total, 0);
  const attemptTotal = mentees.reduce((s, m) => s + m.quiz.attempts, 0);
  const doneTotal = mentees.reduce((s, m) => s + m.modules_done, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="panel p-4">
          <Users size={16} className="mb-2 text-cyber" />
          <p className="font-mono text-xl font-bold tabular">{mentees.length}</p>
          <p className="text-xs text-muted">enrolled mentees</p>
        </div>
        <div className="panel p-4">
          <CalendarCheck size={16} className="mb-2 text-cyber" />
          <p className="font-mono text-xl font-bold tabular">
            {attTotal ? Math.round((presentTotal / attTotal) * 100) : 0}%
          </p>
          <p className="text-xs text-muted">attendance rate</p>
        </div>
        <div className="panel p-4">
          <Gamepad2 size={16} className="mb-2 text-cyber" />
          <p className="font-mono text-xl font-bold tabular">{attemptTotal}</p>
          <p className="text-xs text-muted">quiz attempts</p>
        </div>
        <div className="panel p-4">
          <BookOpen size={16} className="mb-2 text-cyber" />
          <p className="font-mono text-xl font-bold tabular">{doneTotal}</p>
          <p className="text-xs text-muted">modules completed</p>
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3">Mentee</th>
              <th className="px-4 py-3">Attendance</th>
              <th className="px-4 py-3">Quizzes</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3">Last active</th>
            </tr>
          </thead>
          <tbody>
            {mentees.map((m) => (
              <tr key={m.profile.id} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{m.profile.full_name || "—"}</p>
                  <p className="font-mono text-[11px] text-muted">{m.profile.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-panel-2">
                      <div
                        className="h-full bg-cyber"
                        style={{
                          width: `${m.attendance.total ? (m.attendance.present / m.attendance.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular text-muted">
                      {m.attendance.present}/{m.attendance.total}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted/70">
                    {m.attendance.late} late {m.attendance.absent} absent
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-sm tabular">
                    <span className={m.quiz.avg !== null && m.quiz.avg >= 75 ? "text-cyber" : "text-muted"}>
                      {m.quiz.avg !== null ? `${m.quiz.avg}%` : "—"}
                    </span>
                    <span className="text-muted/60"> · {m.quiz.attempts} tries</span>
                  </p>
                  {m.quiz.best !== null && (
                    <p className="font-mono text-[11px] text-muted">best {m.quiz.best} pts</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <CircleDot size={13} className={`mr-1 inline ${m.modules_done ? "text-cyber" : "text-muted/40"}`} />
                  <span className="font-mono text-xs">{m.modules_done} done</span>
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted">
                  {formatDate(m.last_active)}
                </td>
              </tr>
            ))}
            {!mentees.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No mentees enrolled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}