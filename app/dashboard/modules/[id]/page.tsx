import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Video, LockKeyhole, CheckCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekLabel, unlockedModuleIds } from "@/lib/utils";
import MarkdownLite from "@/components/modules/MarkdownLite";
import CompleteButton from "@/components/modules/CompleteButton";

export const dynamic = "force-dynamic";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: module }, { data: modules }, { data: progress }] = await Promise.all([
    supabase.from("modules").select("*").eq("id", id).eq("published", true).maybeSingle(),
    supabase.from("modules").select("id, week_no, title").eq("published", true).order("week_no"),
    supabase.from("module_progress").select("module_id, completed").eq("user_id", user!.id),
  ]);

  if (!module) notFound();

  const done = new Set((progress ?? []).filter((p) => p.completed).map((p) => p.module_id));
  const sorted = (modules ?? []).slice().sort((a, b) => a.week_no - b.week_no);
  const unlocked = unlockedModuleIds(sorted, done);
  const locked = !unlocked.has(module.id);
  const prevTitle = (() => {
    const i = sorted.findIndex((m) => m.id === module.id);
    return i > 0 ? sorted[i - 1].title : null;
  })();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/modules"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition hover:text-cyber"
      >
        <ArrowLeft size={13} /> all modules
      </Link>

      {locked ? (
        <div className="panel p-10 text-center">
          <LockKeyhole size={34} className="mx-auto mb-4 text-warn" />
          <h1 className="font-mono text-lg font-bold uppercase tracking-widest">
            Module locked
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            You must complete{" "}
            <span className="text-cyber">{prevTitle ?? "the previous module"}</span>{" "}
            before this module opens. Finish the previous lesson and mark it complete,
            then come back.
          </p>
          <Link href="/dashboard/modules" className="btn-primary mt-6 inline-flex">
            View modules
          </Link>
        </div>
      ) : (
        <>
          <article className="panel p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="chip">{weekLabel(module.week_no)}</span>
              <span className="chip">
                <CalendarClock size={11} /> {new Date(module.created_at).toLocaleDateString()}
              </span>
              {done.has(module.id) && (
                <span className="chip border-cyber/40 text-cyber">
                  <CheckCircle2 size={11} /> completed
                </span>
              )}
            </div>
            <MarkdownLite text={`# ${module.title}`} />
            {module.video_url ? (
              <div className="mb-6 overflow-hidden rounded-xl border border-line">
                <iframe
                  className="aspect-video w-full"
                  src={module.video_url.replace("watch?v=", "embed/")}
                  title={module.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <p className="flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider text-muted">
                  <Video size={12} className="text-cyber" /> video lesson
                </p>
              </div>
            ) : null}
            <div className="border-t border-line pt-6">
              <MarkdownLite text={module.content} />
            </div>
          </article>

          <div className="mt-6 flex items-center justify-between">
            <CompleteButton moduleId={module.id} completed={done.has(module.id)} />
            <span className="font-mono text-xs text-muted">
              progress is recorded in your mentor&apos;s dashboard
            </span>
          </div>
        </>
      )}
    </div>
  );
}