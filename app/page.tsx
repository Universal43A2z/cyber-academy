import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  Lock,
  Binary,
  Eye,
  FileWarning,
  Network,
  BookOpen,
  CalendarCheck,
  Gamepad2,
  Radar,
  UserCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
import Logo from "@/components/Logo";

const layers = [
  {
    icon: Lock,
    n: "L01",
    title: "Transport security",
    desc: "Full HTTPS with HSTS preload and a strict Content-Security-Policy served by the edge.",
  },
  {
    icon: Fingerprint,
    n: "L02",
    title: "Authentication",
    desc: "Supabase Auth with bcrypt-hashed credentials, email OTP verification and randomised presentation of errors.",
  },
  {
    icon: KeyRound,
    n: "L03",
    title: "Email OTP gate",
    desc: "No account is usable until a time-limited 6-digit code sent to the enrolled email address is verified.",
  },
  {
    icon: UserCheck,
    n: "L04",
    title: "Row-level security",
    desc: "Every table is locked with RLS policies — mentees only see their own rows, mentors only what they manage.",
  },
  {
    icon: ShieldCheck,
    n: "L05",
    title: "Role-based access",
    desc: "Mentee and mentor areas are isolated at the proxy and API layers with double-checked authorization.",
  },
  {
    icon: Network,
    n: "L06",
    title: "Rate limiting",
    desc: "Login, OTP and verification endpoints are throttled per IP to blunt credential stuffing and spam.",
  },
  {
    icon: FileWarning,
    n: "L07",
    title: "Validation & CSRF",
    desc: "Server-side schema validation on every mutation plus SameSite cookies and anti-tamper checks.",
  },
  {
    icon: Eye,
    n: "L08",
    title: "Application guards",
    desc: "Audit logging of every action, anti-copy quiz engine, tab-switch detection and server-side answer scoring.",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Weekly modules",
    desc: "Mentors publish structured cybersecurity lessons every week. Mentees read, complete and track progress.",
  },
  {
    icon: CalendarCheck,
    title: "Attendance",
    desc: "One tap marks you present for the week. Mentors view attendance records and trends per mentee.",
  },
  {
    icon: Gamepad2,
    title: "Quiz game",
    desc: "Timed interactive quizzes. Answers are scored server-side and questions are protected from copying.",
  },
  {
    icon: Radar,
    title: "Performance tracking",
    desc: "Mentors see quiz scores, module completions and last-active timestamps for every mentee.",
  },
  {
    icon: Activity,
    title: "Audit logs",
    desc: "Every login, OTP, attendance mark and quiz submission is timestamped and visible to mentors.",
  },
  {
    icon: Binary,
    title: "Built to defend",
    desc: "Purpose-built with an eight-layer security model and secure-by-default Supabase policies.",
  },
];

export default function LandPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="grid-bg pointer-events-none fixed inset-0" />
      <div className="sweep-line" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-muted sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyber" />
            systems online
          </span>
          <Link href="/auth" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/auth?mode=signup" className="btn-primary">
            Enroll
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-16 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyber/30 bg-cyber/5 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyber">
            <Shield size={13} />
            cyber career training platform
          </p>
          <h1 className="glow-text text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Train the next generation of{" "}
            <span className="text-cyber">cyber defenders</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            F1 STACKMIND Cyber Academy connects mentors with mentees through weekly
            security modules, automated attendance, and gamified quizzes — wrapped in
            an eight-layer security model.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth?mode=signup" className="btn-primary !px-6 !py-3 text-base">
              Create a mentee account <ArrowRight size={16} />
            </Link>
            <Link href="/auth?mode=login" className="btn-ghost !px-6 !py-3 text-base">
              Already enrolled? Sign in
            </Link>
          </div>
          <p className="mt-4 font-mono text-xs text-muted/70">
            OTP email verification · mentor access codes · no account until you prove it&apos;s yours
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="chip">{"// capabilities"}</span>
          <h2 className="font-mono text-xl font-bold uppercase tracking-widest">
            Everything the classroom needs
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="panel panel-hover group p-5">
              <f.icon className="mb-3 text-cyber transition group-hover:drop-shadow-[0_0_8px_rgba(0,255,163,0.7)]" size={22} />
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8-layer security */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <span className="chip">{"// defense model"}</span>
          <h2 className="font-mono text-xl font-bold uppercase tracking-widest">
            8-layer security
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {layers.map((l) => (
            <div key={l.n} className="panel panel-hover relative overflow-hidden p-5">
              <span className="absolute right-3 top-3 font-mono text-[10px] tracking-widest text-cyber/40">
                {l.n}
              </span>
              <l.icon className="mb-3 text-cyber" size={20} />
              <h3 className="mb-1.5 text-sm font-semibold">{l.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16">
        <div className="terminal p-8 md:p-12">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-cyber">
            $ f1-stackmind --enroll
          </p>
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">
            Ready to secure your seat in the cyber career track?
          </h2>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted">
            Sign up in under a minute. Your email code unlocks the dashboard,
            your weekly modules, and your first challenge.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth?mode=signup" className="btn-primary">
              Sign up now <ArrowRight size={15} />
            </Link>
            <Link href="/auth?mode=login" className="btn-ghost">
              Mentor? Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 md:flex-row">
          <Logo size={28} />
          <p className="font-mono text-xs text-muted/70">
            © {new Date().getFullYear()} F1 STACKMIND · secure by design · built by akira · deployed on Vercel + Supabase
          </p>
        </div>
      </footer>
    </main>
  );
}