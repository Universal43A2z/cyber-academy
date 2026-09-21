import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Lock, LockOpen, LockKeyhole } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekLabel, unlockedModuleIds } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("published", true)
    .order("week_no");

  const { data: progress } = await supabase
    .from("module_progress")
    .select("module_id, completed")
    .eq("user_id", uid);

  const done = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.module_id));
  const sorted = (modules ?? []).slice().sort((a, b) => a.week_no - b.week_no);
  const unlocked = unlockedModuleIds(sorted, done);
  const prevOf = new Map<string, string>();
  sorted.forEach((m, i) => {
    if (i > 0) prevOf.set(m.id, sorted[i - 1].title);
  });
  const pct = modules?.length ? Math.round((done.size / modules.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly modules</h1>
          <p className="mt-1 text-sm text-muted">
            Published by your mentors. Read each module, then mark it complete to unlock the next one.
          </p>
        </div>
        <span className="chip">
          <LockOpen size={11} /> {done.size}/{modules?.length ?? 0} complete
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full bg-cyber transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-12 text-right font-mono text-xs font-bold tabular text-cyber">{pct}%</span>
      </div>

      <div className="space-y-3">
        {(modules ?? []).map((m) => {
          const isDone = done.has(m.id);
          const isUnlocked = unlocked.has(m.id);
          return isUnlocked ? (
            <Link
              key={m.id}
              href={`/dashboard/modules/${m.id}`}
              className="panel panel-hover block p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {isDone ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-cyber" />
                  ) : (
                    <Circle size={20} className="mt-0.5 shrink-0 text-muted/50" />
                  )}
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-cyber">
                      {weekLabel(m.week_no)} module
                    </p>
                    <h2 className="mt-1 font-semibold">{m.title}</h2>
                    {m.description ? (
                      <p className="mt-1 text-sm text-muted">{m.description}</p>
                    ) : null}
                  </div>
                </div>
                <BookOpen size={16} className="shrink-0 text-muted" />
              </div>
            </Link>
          ) : (
            <div key={m.id} className="panel flex items-start justify-between gap-4 p-5 opacity-70">
              <div className="flex items-start gap-3">
                <LockKeyhole size={20} className="mt-0.5 shrink-0 text-muted/60" />
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    {weekLabel(m.week_no)} module · locked
                  </p>
                  <h2 className="mt-1 font-semibold text-muted">{m.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    Complete <span className="text-cyber/80">{prevOf.get(m.id) ?? "the previous module"}</span> to unlock this lesson.
                  </p>
                </div>
              </div>
              <Lock size={16} className="shrink-0 text-muted/50" />
            </div>
          );
        })}
        {!modules?.length ? (
          <div className="panel p-8 text-center text-muted">
            No published modules yet. Check back after your mentor uploads this week&apos;s lesson.
          </div>
        ) : null}
      </div>
    </div>
  );
}