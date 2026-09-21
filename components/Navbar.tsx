"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import Logo from "./Logo";

const mentorLinks = [
  { href: "/mentor", label: "Overview" },
  { href: "/mentor/announcements", label: "Announcements" },
  { href: "/mentor/modules", label: "Modules" },
  { href: "/mentor/quiz", label: "Quizzes" },
  { href: "/mentor/mentees", label: "Mentees" },
  { href: "/mentor/feedback", label: "Feedback" },
  { href: "/mentor/logs", label: "Audit Logs" },
];

const menteeLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/modules", label: "Modules" },
  { href: "/dashboard/quiz", label: "Quizzes" },
  { href: "/dashboard/attendance", label: "Attendance" },
  { href: "/dashboard/feedback", label: "Feedback" },
  { href: "/dashboard/profile", label: "Profile" },
];

export default function Navbar({
  role,
  name,
}: {
  role: "mentor" | "mentee";
  name?: string | null;
}) {
  const router = useRouter();
  const links = role === "mentor" ? mentorLinks : menteeLinks;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition hover:bg-cyber/10 hover:text-cyber"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-md border border-cyber/30 bg-cyber/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-cyber sm:inline-flex">
            <Shield size={12} />
            {role}
          </span>
          <span className="hidden max-w-[140px] truncate text-xs text-muted lg:block">
            {name}
          </span>
          <button
            onClick={logout}
            className="btn-ghost !px-2.5 !py-1.5"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition hover:bg-cyber/10 hover:text-cyber"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}