"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Send,
  CheckCircle2,
} from "lucide-react";
import type { Module } from "@/lib/types";
import MarkdownLite from "@/components/modules/MarkdownLite";

interface ModuleForm {
  week_no: number;
  title: string;
  description: string;
  content: string;
  video_url: string;
  published: boolean;
}

const empty: ModuleForm = {
  week_no: 1,
  title: "",
  description: "",
  content: "",
  video_url: "",
  published: true,
};

export default function ModuleManager() {
  const [modules, setModules] = useState<Module[] | null>(null);
  const [form, setForm] = useState<ModuleForm>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [preview, setPreview] = useState(false);

  async function load() {
    const res = await fetch("/api/mentor/modules");
    const data = await res.json();
    setModules(data.modules ?? []);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  function set<K extends keyof ModuleForm>(k: K, v: ModuleForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(
      editingId ? `/api/mentor/modules/${editingId}` : "/api/mentor/modules",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          video_url: form.video_url || null,
        }),
      }
    );
    const data = await res.json();
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: editingId ? "Module updated." : "Module published." });
    setForm(empty);
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this module? Mentee progress for it will be removed.")) return;
    await fetch(`/api/mentor/modules/${id}`, { method: "DELETE" });
    load();
  }

  function edit(m: Module) {
    setEditingId(m.id);
    setForm({
      week_no: m.week_no,
      title: m.title,
      description: m.description ?? "",
      content: m.content,
      video_url: m.video_url ?? "",
      published: m.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const weekMax = Math.max(1, ...(modules ?? []).map((m) => m.week_no));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">
              {editingId ? "Edit module" : "New weekly module"}
            </h2>
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setForm(empty); }}
                className="font-mono text-xs text-muted hover:text-foreground"
              >
                cancel edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Week no.</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={52}
                  value={form.week_no}
                  onChange={(e) => set("week_no", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label">Visibility</label>
                <button
                  onClick={() => set("published", !form.published)}
                  className={`btn w-full ${form.published ? "btn-primary" : "btn-ghost"}`}
                >
                  {form.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  {form.published ? "Published" : "Draft"}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Week {n} — e.g. Network Defense 101"
              />
            </div>
            <div>
              <label className="label">Short description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="One-liner shown on the module list"
              />
            </div>
            <div>
              <label className="label">Video URL (YouTube)</label>
              <input
                className="input"
                value={form.video_url}
                onChange={(e) => set("video_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="label">Lesson content</label>
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreview(false)}
                  className={`btn !px-3 !py-1 text-xs ${!preview ? "btn-primary" : "btn-ghost"}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(true)}
                  className={`btn !px-3 !py-1 text-xs ${preview ? "btn-primary" : "btn-ghost"}`}
                >
                  Preview
                </button>
                <span className="ml-auto font-mono text-[11px] text-muted">
                  # and ## headings · bullets · code
                </span>
              </div>
              {preview ? (
                <div className="min-h-[420px] rounded-lg border border-line bg-panel-2 p-4">
                  <MarkdownLite text={`# ${form.title || "Untitled module"}\n\n## starter activity\n\n${form.content}`} />
                </div>
              ) : (
                <textarea
                  className="input min-h-[420px] font-mono text-[13px] leading-relaxed"
                  value={form.content}
                  onChange={(e) => set("content", e.target.value)}
                  placeholder={"# Lesson title\n\nWrite the lesson body..."
                  }
                />
              )}
            </div>
            <button onClick={save} disabled={busy || form.title.length < 3} className="btn-primary w-full">
              {busy ? <Loader2 size={15} className="animate-spin" /> : editingId ? <Pencil size={15} /> : <Send size={15} />}
              {editingId ? "Update module" : "Publish module"}
            </button>
            {msg && (
              <p className={`flex items-center gap-2 text-xs ${msg.ok ? "text-cyber" : "text-danger"}`}>
                <CheckCircle2 size={13} /> {msg.text}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest">
          Published modules ({modules?.length ?? 0})
        </h2>
        <div className="space-y-3">
          {modules?.map((m) => (
            <div key={m.id} className="panel p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-cyber">
                    week {m.week_no} {!m.published && <span className="text-warn">· draft</span>}
                  </p>
                  <h3 className="font-semibold">{m.title}</h3>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => edit(m)} className="btn-ghost !px-2.5 !py-1.5" title="Edit">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => remove(m.id)} className="btn-danger !px-2.5 !py-1.5" title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">
                {m.published ? "visible to mentees immediately" : "draft — not visible"}
                <span className="text-muted/50"> · next draft week is {weekMax + 1}</span>
              </p>
            </div>
          ))}
          {!modules?.length && (
            <div className="panel p-6 text-center text-sm text-muted">
              No modules yet — use the form to publish week 1.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}