import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  Gamepad2,
  Trophy,
  Flame,
  Megaphone,
  Award,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { currentWeekNo, weekLabel, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const week = currentWeekNo();

  const [{ data: profile }, { data: attendances }, { data: modules }, { data: attempts }, { data: progress }, { data: thisWeekModule }, { data: announcements }] =
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
      supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4),
    ]);

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id,title")
    .in("id", attempts?.map((a) => a.quiz_id) ?? []);

  const quizTitle = new Map((quizzes ?? []).map((q) => [q.id, q.title]));

  // Leaderboard: top mentees by quiz average (min. one attempt).
  const admin = getSupabaseAdmin();
  const [{ data: allProfiles }, { data: allAttempts }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email").eq("role", "mentee"),
    admin.from("quiz_attempts").select("user_id, score, total"),
  ]);
  const byUser = new Map<string, { scores: number[]; totals: number[] }>();
  for (const a of allAttempts ?? []) {
    if (!byUser.has(a.user_id)) byUser.set(a.user_id, { scores: [], totals: [] });
    byUser.get(a.user_id)!.scores.push(a.score);
    byUser.get(a.user_id)!.totals.push(a.total);
  }
  const leaderboard = (allProfiles ?? [])
    .map((p) => {
      const row = byUser.get(p.id);
      if (!row || !row.scores.length) return null;
      const tot = row.totals.reduce((s, t) => s + t, 0) || 1;
      const avg = Math.round((row.scores.reduce((s, x) => s + x, 0) / tot) * 100);
      const best = Math.max(...row.scores);
      return { id: p.id, name: p.full_name || p.email, avg, best };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5);

  // Achievements computed from the mentee's own data.
  const present = attendances?.filter((a) => a.status !== "absent").length ?? 0;
  const best = attempts?.length ? Math.max(...attempts.map((a) => a.score)) : null;
  const avg =
    attempts?.length
      ? Math.round((attempts.reduce((s, a) => s + a.score, 0) / attempts.reduce((s, a) => s + (a.total || 1), 0)) * 100)
      : null;
  const done = progress?.filter((p) => p.completed).length ?? 0;
  const modulesTotal = modules?.length ?? 0;
  const modulePct = modulesTotal ? Math.round((done / modulesTotal) * 100) : 0;

  const hasQuiz = (attempts?.length ?? 0) > 0;
  const perfect = (attempts ?? []).some((a) => a.score === a.total);
  const dedicated = present >= 5;
  const scholar = modulesTotal > 0 && done === modulesTotal;
  const sharpshooter = avg !== null && avg >= 75;

  const badges: { label: string; hint: string; earned: boolean }[] = [
    { label: "First steps", hint: "take your first quiz", earned: hasQuiz },
    { label: "Perfect shot", hint: "score 100% on any quiz", earned: perfect },
    { label: "Dedicated", hint: "attend 5+ weeks", earned: dedicated },
    { label: "Scholar", hint: "finish every module", earned: scholar },
    { label: "Sharpshooter", hint: "75%+ quiz average", earned: sharpshooter },
  ];

  const stats = [
    { icon: CalendarCheck, label: "Weeks attended", value: `${present}/${attendances?.length ?? 0}`, sub: "no missed week" },
    { icon: BookOpen, label: "Modules done", value: `${done}/${modulesTotal}`, sub: `${modulePct}% complete` },
    { icon: Gamepad2, label: "Quizzes taken", value: `${attempts?.length ?? 0}`, sub: "score the best" },
    { icon: Trophy, label: "Best quiz score", value: best !== null ? `${best}` : "—", sub: avg !== null ? `${avg}% avg` : "no attempts" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            session: {profile?.role ?? "mentee"} · auto-logout after 20min idle
          </p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            Welcome back, <span className="text-cyber">{profile?.full_name?.trim().split(/\s+/)[0] || "operator"}</span>
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

      <div className="panel flex items-center gap-4 px-5 py-4">
        <BookOpen size={18} className="shrink-0 text-cyber" />
        <div className="flex-1">
          <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted">
            <span>training progress</span>
            <span>{done}/{modulesTotal} modules · {modulePct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel-2">
            <div className="h-full bg-cyber transition-all" style={{ width: `${modulePct}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {leaderboard.length ? (
          <div className="panel p-5 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-warn" />
              <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Leaderboard</h2>
            </div>
            <ul className="space-y-2">
              {leaderboard.map((r, i) => (
                <li
                  key={r.name}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                    r.id === uid
                      ? "border-cyber/50 bg-cyber/10"
                      : "border-line bg-panel-2"
                  }`}
                >
                  <span className="w-5 font-mono text-xs text-muted">#{i + 1}</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="font-mono text-xs text-cyber">{r.avg}%</span>
                  <span className="font-mono text-[11px] text-muted">best {r.best}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-[11px] text-muted">
              ranked by average after at least one quiz
            </p>
          </div>
        ) : null}

        <div className={`panel p-5 ${leaderboard.length ? "lg:col-span-3" : "lg:col-span-5"}`}>
          <div className="mb-3 flex items-center gap-2">
            <Award size={16} className="text-cyber" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Achievements</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {badges.map((b) => (
              <div
                key={b.label}
                title={b.hint}
                className={`rounded-lg border p-3 text-center transition ${
                  b.earned
                    ? "border-cyber/60 bg-cyber/10 text-cyber"
                    : "border-line bg-panel-2 text-muted/50"
                }`}
              >
                <Award size={20} className={`mx-auto ${b.earned ? "" : "opacity-30"}`} />
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wider">{b.label}</p>
                <p className="text-[10px] opacity-70">{b.earned ? "earned" : b.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {announcements?.length ? (
        <div className="panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone size={16} className="text-cyber" />
            <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Announcements</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-lg border border-line bg-panel-2 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-cyber">
                  {a.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{a.body}</p>
                <p className="mt-2 font-mono text-[11px] text-muted">
                  {a.author_name} · {formatDate(a.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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