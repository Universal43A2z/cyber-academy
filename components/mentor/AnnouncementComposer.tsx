"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Announcement } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function AnnouncementComposer() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function load() {
    const res = await fetch("/api/announcements");
    const data = await res.json();
    setItems(data.announcements ?? []);
  }

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements ?? []));
  }, []);

  async function publish(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: data.message ?? "Announcement published." });
    setTitle("");
    setBody("");
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="panel h-fit p-6 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-cyber" />
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Broadcast</h2>
        </div>
        <p className="mt-1 text-xs text-muted">
          Every mentee sees this instantly on their dashboard overview.
        </p>

        <form onSubmit={publish} className="mt-5 space-y-4">
          <div>
            <label className="label" htmlFor="annTitle">
              Title
            </label>
            <input
              id="annTitle"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3 drill rescheduled"
              minLength={3}
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="annBody">
              Message
            </label>
            <textarea
              id="annBody"
              className="input min-h-28 resize-y"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Mentees, note the updated schedule for this week…"
              minLength={5}
              maxLength={2000}
              required
            />
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
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Publish announcement
          </button>
        </form>
      </div>

      <div className="space-y-3 lg:col-span-3">
        {!items ? (
          <div className="panel flex items-center gap-3 p-6 font-mono text-sm text-cyber">
            <Loader2 size={16} className="animate-spin" /> loading announcements…
          </div>
        ) : items.length ? (
          items.map((a) => (
            <div key={a.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-cyber">
                    {a.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{a.body}</p>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="btn-ghost !px-2.5 !py-1.5"
                  title="Delete announcement"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted">
                {a.author_name} · {formatDate(a.created_at)}
              </p>
            </div>
          ))
        ) : (
          <div className="panel p-8 text-center text-muted">
            No announcements yet. Publish the first one on the left.
          </div>
        )}
      </div>
    </div>
  );
}