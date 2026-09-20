"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldAlert, Search } from "lucide-react";
import type { ActivityLog } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function LogsViewer() {
  const [logs, setLogs] = useState<ActivityLog[] | null>(null);
  const [actions, setActions] = useState<string[]>([]);
  const [action, setAction] = useState("");
  const [email, setEmail] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (email) params.set("email", email);
    const res = await fetch(`/api/mentor/logs?${params.toString()}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    if (data.actions) setActions(data.actions);
  }, [action, email]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-cyber" />
          <span className="font-mono text-xs uppercase tracking-widest text-muted">filter</span>
        </div>
        <select
          className="input !w-auto"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input !w-56 pl-8"
            placeholder="email…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <span className="ml-auto font-mono text-xs text-muted">{logs?.length ?? 0} events</span>
      </div>

      {!logs ? (
        <div className="panel flex items-center gap-3 p-6 font-mono text-sm text-cyber">
          <Loader2 size={16} className="animate-spin" /> reading the audit trail…
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-panel-2 font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-line/50 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-cyber">{l.action}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{l.email ?? "system"}</td>
                  <td className="max-w-[240px] truncate px-4 py-2.5 font-mono text-[11px] text-muted">
                    {JSON.stringify(l.details ?? {})}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted">{l.ip ?? "—"}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-muted">
                    {formatDate(l.created_at)}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">No matching events.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}