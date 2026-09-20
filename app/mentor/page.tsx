import Link from "next/link";
import { Users, BookOpen, Gamepad2, ListChecks, Activity, ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MentorHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: mentees }, { count: modules }, { count: quizzes }, { count: attempts }, { data: recentLogs }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "mentee"),
      supabase.from("modules").select("id", { count: "exact", head: true }),
      supabase.from("quizzes").select("id", { count: "exact", head: true }),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
      supabase.from("activity_logs")
        .select("id, action, email, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const stats = [
    { icon: Users, label: "Enrolled mentees", value: mentees ?? 0, href: "/mentor/mentees" },
    { icon: BookOpen, label: "Published modules", value: modules ?? 0, href: "/mentor/modules" },
    { icon: Gamepad2, label: "Quizzes", value: quizzes ?? 0, href: "/mentor/quiz" },
    { icon: ListChecks, label: "Attempts recorded", value: attempts ?? 0, href: "/mentor/mentees" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">
          mentor console · {user?.email}
        </p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          Command overview
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="panel panel-hover block p-4">
            <s.icon className="mb-2 text-cyber" size={18} />
            <p className="font-mono text-2xl font-bold tabular">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity size={16} className="text-cyber" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Recent audit activity</h2>
          </div>
          {recentLogs?.length ? (
            <ul className="space-y-2 text-sm">
              {recentLogs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 border-b border-line/40 pb-2 last:border-0">
                  <span className="font-mono text-xs">
                    <span className="text-cyber">{l.action}</span>
                    <span className="text-muted"> · {l.email ?? "system"}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">{formatDate(l.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No activity logged yet.</p>
          )}
          <Link href="/mentor/logs" className="btn-ghost mt-4 w-full">
            Open full audit log <ArrowRight size={13} />
          </Link>
        </div>

        <div className="space-y-4">
          <Link href="/mentor/modules" className="panel panel-hover block p-5">
            <BookOpen size={20} className="mb-2 text-cyber" />
            <h3 className="font-semibold">Publish this week&apos;s module</h3>
            <p className="mt-1 text-sm text-muted">Write the lesson, attach a video link, publish to all mentees.</p>
          </Link>
          <Link href="/mentor/quiz" className="panel panel-hover block p-5">
            <Gamepad2 size={20} className="mb-2 text-cyber" />
            <h3 className="font-semibold">Build a quiz challenge</h3>
            <p className="mt-1 text-sm text-muted">Multiple-choice questions, timed, server-scored, anti-copy.</p>
          </Link>
          <Link href="/mentor/mentees" className="panel panel-hover block p-5">
            <Users size={20} className="mb-2 text-cyber" />
            <h3 className="font-semibold">Track mentee performance</h3>
            <p className="mt-1 text-sm text-muted">Attendance, quiz scores, and module completion per mentee.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}