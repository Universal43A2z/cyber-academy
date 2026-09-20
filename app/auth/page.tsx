import Link from "next/link";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Sign in · F1 STACKMIND Cyber Academy" };

export default function AuthPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="grid-bg pointer-events-none fixed inset-0" />
      <div className="sweep-line" />
      <div className="relative z-10 mb-6">
        <Logo />
      </div>
      <Suspense fallback={<div className="relative z-10">Loading…</div>}>
        <AuthForm />
      </Suspense>
      <Link
        href="/"
        className="relative z-10 mt-6 font-mono text-xs uppercase tracking-widest text-muted transition hover:text-cyber"
      >
        ← back to overview
      </Link>
    </main>
  );
}