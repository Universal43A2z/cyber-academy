"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  GraduationCap,
} from "lucide-react";

type Mode = "login" | "otp" | "signup";
type Stage = "form" | "otp";

const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "Uppercase", test: (p) => /[A-Z]/.test(p) },
  { label: "Lowercase", test: (p) => /[a-z]/.test(p) },
  { label: "Number", test: (p) => /[0-9]/.test(p) },
  { label: "Special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];


export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode: Mode =
    searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [stage, setStage] = useState<Stage>("form");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [role, setRole] = useState<"mentor" | "mentee">("mentee");
  const [mentorCode, setMentorCode] = useState("");
  const [otp, setOtp] = useState("");

  const passwordOk = PASSWORD_RULES.every((r) => r.test(password));

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        mode: mode === "signup" ? "signup" : "login",
        ...(mode === "signup"
          ? {
              full_name: fullName,
              role,
              year_level: yearLevel || null,
              mentor_code: role === "mentor" ? mentorCode : undefined,
            }
          : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    setMsg({ ok: true, text: data.message ?? "Code sent. Check your inbox." });
    // Switch signup tab progress; OTP stage receives the email regardless.
    setStage("otp");
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        token: otp,
        mode,
        ...(mode === "signup" ? { password: password || undefined } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    const sess = await fetch("/api/auth/session").then((r) => r.json());
    const isMentor = sess.profile?.role === "mentor";
    router.push(isMentor ? "/mentor" : "/dashboard");
    router.refresh();
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.error) {
      setMsg({ ok: false, text: data.error });
      return;
    }
    router.push(data.role === "mentor" ? "/mentor" : "/dashboard");
    router.refresh();
  }

  function resendCode() {
    setMsg(null);
    sendOtp({ preventDefault: () => {} } as FormEvent);
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "login", label: "Password login" },
    { id: "otp", label: "OTP login" },
    { id: "signup", label: "Create account" },
  ];

  return (
    <div className="panel w-full max-w-md p-6 sm:p-8">
      <div className="mb-6">
        <h1 className="font-mono text-lg font-bold uppercase tracking-widest">
          {stage === "otp"
            ? "Verify your code"
            : mode === "signup"
              ? "Create account"
              : "Secure access"}
        </h1>
        <p className="mt-1 text-xs text-muted">
          {stage === "otp"
            ? `A 6-digit code was sent to ${email}.`
            : "Authenticated, logged, and limited."}
        </p>
      </div>

      {stage === "otp" ? (
        <form onSubmit={verify} className="space-y-4">
          <div>
            <label className="label" htmlFor="otp">
              One-time passcode
            </label>
            <input
              id="otp"
              className="input text-center font-mono text-2xl tracking-[0.5em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={busy || otp.length !== 6}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
            Verify & unlock
          </button>
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setStage("form")}
              className="text-muted transition hover:text-foreground"
            >
              ← Back
            </button>
            <button type="button" onClick={resendCode} className="text-cyber hover:underline">
              Resend code
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg border border-line bg-panel-2 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setMode(t.id);
                  setMsg(null);
                }}
                className={`rounded-md px-2 py-1.5 font-mono text-[11px] uppercase tracking-wider transition ${
                  mode === t.id
                    ? "bg-cyber/15 text-cyber"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {msg && (
            <div
              className={`mb-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                msg.ok
                  ? "border-cyber/40 bg-cyber/10 text-cyber"
                  : "border-danger/40 bg-danger/10 text-danger"
              }`}
            >
              {msg.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{msg.text}</span>
            </div>
          )}

          {mode === "signup" && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="label" htmlFor="fullName">
                  Full name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="fullName"
                    className="input pl-9"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ada Lovelace"
                    required
                    minLength={2}
                  />
                </div>
              </div>
              <div>
                <label className="label">I am a</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("mentee")}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      role === "mentee"
                        ? "border-cyber/60 bg-cyber/10 text-cyber"
                        : "border-line text-muted hover:border-cyber/40"
                    }`}
                  >
                    Mentee
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("mentor")}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      role === "mentor"
                        ? "border-cyber/60 bg-cyber/10 text-cyber"
                        : "border-line text-muted hover:border-cyber/40"
                    }`}
                  >
                    Mentor
                  </button>
                </div>
              </div>
              {role === "mentor" && (
                <div>
                  <label className="label" htmlFor="mentorCode">
                    Mentor access code
                  </label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="mentorCode"
                      className="input pl-9 font-mono"
                      value={mentorCode}
                      onChange={(e) => setMentorCode(e.target.value)}
                      placeholder="Provided by the academy"
                      required
                    />
                  </div>
                </div>
              )}
              {role === "mentee" && (
                <div>
                  <label className="label" htmlFor="yearLevel">
                    Year level <span className="normal-case text-muted/60">(optional)</span>
                  </label>
                  <div className="relative">
                    <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      id="yearLevel"
                      className="input pl-9"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      placeholder="e.g. 2nd Year"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={mode === "signup" ? sendOtp : mode === "otp" ? sendOtp : login}
            className="space-y-4"
          >
            <div>
              <label className="label" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  className="input pl-9"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  required
                />
              </div>
            </div>
            {mode === "login" && (
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="password"
                    className="input pl-9"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted/70">
                  Wrong credentials are reported generically. 5+ failures trigger throttling.
                </p>
              </div>
            )}
            {mode === "signup" && (
              <div>
                <label className="label" htmlFor="pw">
                  Create a password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    id="pw"
                    className="input pl-9"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Str0ng!Pass"
                    required
                  />
                </div>
                <ul className="mt-2 grid grid-cols-1 gap-1">
                  {PASSWORD_RULES.map((r) => {
                    const ok = r.test(password);
                    return (
                      <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${ok ? "text-cyber" : "text-muted/60"}`}>
                        {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <button
              className="btn-primary w-full"
              disabled={busy || (mode === "signup" && !passwordOk)}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {mode === "signup"
                ? "Send OTP code"
                : mode === "otp"
                  ? "Email me a login code"
                  : "Sign in"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}