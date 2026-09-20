import Link from "next/link";
import { BookOpen, CalendarCheck, Gamepad2, Trophy, Flame } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentWeekNo, weekLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const week = currentWeekNo();

  const [{ data: profile }, { data: attendances }, { data: modules }, { data: attempts }, { data: progress }, { data: thisWeekModule }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", uid).maybeSingle(),
      supabase.from("attendances").select("*").eq("user_id", uid),
      supabase.from("modules").select("*").eq("published", true).order("week_no"),
      supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", uid)
        .order("finished_at", { ascending: false }),
      supabase.from("module_progress").select("module_id, completed").eq("user_id", uid),
      supabase.from("modules").select("*").eq("week_no", week).eq("published", true).maybeSingle(),
    ]);

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id,title")
    .in("id", attempts?.map((a) => a.quiz_id) ?? []);

  const quizTitle = new Map((quizzes ?? []).map((q) => [q.id, q.title]));

  const present = attendances?.filter((a) => a.status !== "absent").length ?? 0;
  const best = attempts?.length ? Math.max(...attempts.map((a) => a.score)) : null;
  const avg =
    attempts?.length
      ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / attempts.reduce((s, a) => s + (a.total || 1), 0)) * 100)
      : null;
  const done = progress?.filter((p) => p.completed).length ?? 0;

  const stats = [
    { icon: CalendarCheck, label: "Weeks attended", value: `${present}/${attendances?.length ?? 0}`, sub: "no missed week" },
    { icon: BookOpen, label: "Modules done", value: `${done}/${modules?.length ?? 0}`, sub: "keep going" },
    { icon: Gamepad2, label: "Quizzes taken", value: `${attempts?.length ?? 0}`, sub: "score the best" },
    { icon: Trophy, label: "Best quiz score", value: best !== null ? `${best}` : "—", sub: avg !== null ? `${avg}% avg` : "no attempts" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            session: {profile?.role ?? "mentee"} · inactive after 30min
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            Welcome back, <span className="text-cyber">{profile?.full_name ?? "operator"}</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            {weekLabel(week)} · training target: defend the perimeter
          </p>
        </div>
        <Link href="/dashboard/attendance" className="btn-primary">
          <CalendarCheck size={15} /> Mark attendance
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="panel p-4">
            <s.icon className="mb-2 text-cyber" size={18} />
            <p className="font-mono text-2xl font-bold tabular">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted">{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      {attempts?.length ? (
        <div className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Flame size={16} className="text-warn" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Recent results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="pb-2">Quiz</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Correct</th>
                  <th className="pb-2 text-right">Finished</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 6).map((a) => (
                  <tr key={a.id} className="border-b border-line/50">
                    <td className="py-2.5">{quizTitle.get(a.quiz_id) ?? "Quiz"}</td>
                    <td className="py-2.5 font-mono text-cyber">{a.score}/{a.total}</td>
                    <td className="py-2.5">{a.total ? `${Math.round((a.score / a.total) * 100)}%` : "—"}</td>
                    <td className="py-2.5 text-right text-muted">{new Date(a.finished_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Link href="/dashboard/modules" className="panel panel-hover group p-5">
          <BookOpen size={20} className="mb-2 text-cyber" />
          <h3 className="font-semibold">Weekly modules</h3>
          <p className="mt-1 text-sm text-muted">
            {thisWeekModule ? `This week: ${thisWeekModule.title}` : "No module published for this week yet."}
          </p>
        </Link>
        <Link href="/dashboard/quiz" className="panel panel-hover group p-5">
          <Gamepad2 size={20} className="mb-2 text-cyber" />
          <h3 className="font-semibold">Quiz games</h3>
          <p className="mt-1 text-sm text-muted">Timed, server-scored challenges. No copying allowed.</p>
        </Link>
        <Link href="/dashboard/attendance" className="panel panel-hover group p-5">
          <CalendarCheck size={20} className="mb-2 text-cyber" />
          <h3 className="font-semibold">Attendance</h3>
          <p className="mt-1 text-sm text-muted">Log today&apos;s presence and review your record.</p>
        </Link>
      </div>
    </div>
  );
}