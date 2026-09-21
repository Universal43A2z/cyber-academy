import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { weekLabel, formatDate } from "@/lib/utils";
import PrintButton from "@/components/mentor/PrintButton";

export const dynamic = "force-dynamic";

export default async function MenteeReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();
  if (!sessionUser) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, year_level, role, created_at")
    .eq("id", id)
    .eq("role", "mentee")
    .maybeSingle();
  if (!profile) notFound();

  const admin = getSupabaseAdmin();
  const [{ data: attendances }, { data: attempts }, { data: progress }, { data: feedback }] =
    await Promise.all([
      admin.from("attendances").select("*").eq("user_id", id).order("week_no"),
      admin
        .from("quiz_attempts")
        .select("id, quiz_id, score, total, finished_at, answers")
        .eq("user_id", id)
        .order("finished_at", { ascending: false }),
      admin
        .from("module_progress")
        .select("module_id, completed, completed_at")
        .eq("user_id", id)
        .eq("completed", true),
      admin
        .from("feedback_reports")
        .select("subject, message, category, status, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const { data: modules } = await admin
    .from("modules")
    .select("id, week_no, title")
    .in("id", (progress ?? []).map((p) => p.module_id));
  const moduleTitle = new Map((modules ?? []).map((m) => [m.id, m.title]));

  const { data: quizzes } = await admin
    .from("quizzes")
    .select("id, title")
    .in("id", (attempts ?? []).map((a) => a.quiz_id));
  const quizTitle = new Map((quizzes ?? []).map((q) => [q.id, q.title]));

  const present = (attendances ?? []).filter((a) => a.status !== "absent").length;
  const attTotal = attendances?.length ?? 0;
  const scores = (attempts ?? []).map((a) => a.score);
  const totals = (attempts ?? []).map((a) => a.total).reduce((s, t) => s + t, 0) || 1;
  const avg = scores.length ? Math.round((scores.reduce((s, x) => s + x, 0) / totals) * 100) : null;
  const best = scores.length ? Math.max(...scores) : null;

  const compliance = {
    attendanceRate: attTotal ? Math.round((present / attTotal) * 100) : 0,
    modulesDone: (progress ?? []).length,
    moduleTotal: undefined as number | undefined,
  };

  const { count: moduleTotal } = await admin
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("published", true);
  compliance.moduleTotal = moduleTotal ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print-hidden">
        <Link
          href="/mentor/mentees"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition hover:text-cyber"
        >
          <ArrowLeft size={13} /> all mentees
        </Link>
        <PrintButton />
      </div>

      <div className="panel p-6 md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
              F1STACKMIND Cyber Academy · mentee report
            </p>
            <h1 className="mt-1 text-2xl font-bold">{profile.full_name || "Mentee"}</h1>
            <p className="mt-1 text-sm text-muted">
              {profile.email} · {profile.year_level ?? "year not set"}
            </p>
          </div>
          <div className="text-right font-mono text-xs text-muted">
            <p>generated {formatDate(new Date().toISOString())}</p>
            <p>enrolled {formatDate(profile.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-line p-3">
            <p className="font-mono text-2xl font-bold tabular text-cyber">
              {compliance.attendanceRate}%
            </p>
            <p className="text-xs text-muted">attendance rate</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-mono text-2xl font-bold tabular text-cyber">
              {compliance.moduleTotal ? Math.round((compliance.modulesDone / compliance.moduleTotal) * 100) : 0}%
            </p>
            <p className="text-xs text-muted">modules complete</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="font-mono text-2xl font-bold tabular text-cyber">
              {avg !== null ? `${avg}%` : "—"}
            </p>
            <p className="text-xs text-muted">quiz average</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <h2 className="mb-2 font-mono text-sm font-bold uppercase tracking-widest">
              Attendance
            </h2>
            {attendances?.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="pb-2">Week</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(attendances ?? []).map((a) => (
                    <tr key={a.id} className="border-b border-line/40">
                      <td className="py-1.5 font-mono text-xs">{weekLabel(a.week_no)}</td>
                      <td className="py-1.5 font-mono text-xs uppercase">{a.status}</td>
                      <td className="py-1.5 font-mono text-xs text-muted">{formatDate(a.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted">No attendance records.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-mono text-sm font-bold uppercase tracking-widest">
              Quiz performance <span className="normal-case text-muted">· best {best ?? "—"} pts</span>
            </h2>
            {attempts?.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                    <th className="pb-2">Quiz</th>
                    <th className="pb-2">Score</th>
                    <th className="pb-2 text-right">Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {(attempts ?? []).map((a) => (
                    <tr key={a.id} className="border-b border-line/40">
                      <td className="py-1.5">{quizTitle.get(a.quiz_id) ?? "Quiz"}</td>
                      <td className="py-1.5 font-mono text-xs">
                        {a.score}/{a.total} · {a.total ? `${Math.round((a.score / a.total) * 100)}%` : "—"}
                      </td>
                      <td className="py-1.5 font-mono text-xs text-muted">{formatDate(a.finished_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted">No quiz attempts yet.</p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-mono text-sm font-bold uppercase tracking-widest">
              Completed modules <span className="normal-case text-muted">· {progress?.length ?? 0} total</span>
            </h2>
            {progress?.length ? (
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {(progress ?? []).map((p) => (
                  <li key={p.module_id} className="rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-cyber">
                      {moduleTitle.get(p.module_id) ?? "Module"}
                    </span>
                    <p className="font-mono text-[11px] text-muted">
                      done {p.completed_at ? formatDate(p.completed_at) : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No modules marked complete.</p>
            )}
          </section>

          {feedback?.length ? (
            <section>
              <h2 className="mb-2 font-mono text-sm font-bold uppercase tracking-widest">Feedback sent</h2>
              <ul className="space-y-2">
                {(feedback ?? []).slice(0, 5).map((f, i) => (
                  <li key={i} className="rounded-lg border border-line p-3 text-sm">
                    <p className="font-semibold">{f.subject}</p>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{f.message}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted">
                      {f.category} · {f.status} · {formatDate(f.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <p className="mt-6 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-widest text-muted">
          f1stackmind cyber academy · mentor export · built by akira
        </p>
      </div>
    </div>
  );
}