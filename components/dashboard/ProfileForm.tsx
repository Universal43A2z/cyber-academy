"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save, CheckCircle2, XCircle, GraduationCap, User } from "lucide-react";

export default function ProfileForm({
  initialName,
  initialYear,
}: {
  initialName: string | null;
  initialYear: string | null;
}) {
  const [fullName, setFullName] = useState(initialName ?? "");
  const [yearLevel, setYearLevel] = useState(initialYear ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, year_level: yearLevel || null }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: data.message ?? "Profile updated." });
  }

  return (
    <div className="panel max-w-lg p-6">
      <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Edit profile</h2>
      <p className="mt-1 text-xs text-muted">
        Keep your name and year level up to date so your mentor can identify your records.
      </p>

      <form onSubmit={save} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="fullName"
              className="input pl-9"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              required
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="yearLevel">
            Year level <span className="normal-case text-muted/60">(optional)</span>
          </label>
          <div className="relative">
            <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              id="yearLevel"
              className="input pl-9"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
              maxLength={40}
              placeholder="e.g. 2nd Year"
            />
          </div>
        </div>

        {msg && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              msg.ok
                ? "border-cyber/40 bg-cyber/10 text-cyber"
                : "border-danger/40 bg-danger/10 text-danger"
            }`}
          >
            {msg.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span>{msg.text}</span>
          </div>
        )}

        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save changes
        </button>
      </form>
    </div>
  );
}