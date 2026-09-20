import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Video } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { weekLabel } from "@/lib/utils";
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

  const { data: module } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!module) notFound();

  const { data: progress } = await supabase
    .from("module_progress")
    .select("completed")
    .eq("user_id", user!.id)
    .eq("module_id", id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/modules"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition hover:text-cyber"
      >
        <ArrowLeft size={13} /> all modules
      </Link>

      <article className="panel p-6 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="chip">{weekLabel(module.week_no)}</span>
          <span className="chip">
            <CalendarClock size={11} /> {new Date(module.created_at).toLocaleDateString()}
          </span>
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
        <CompleteButton moduleId={module.id} completed={progress?.completed ?? false} />
        <span className="font-mono text-xs text-muted">
          progress is recorded in your mentor&apos;s dashboard
        </span>
      </div>
    </div>
  );
}