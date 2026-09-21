"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const IDLE_MS = 20 * 60 * 1000;

export default function InactiveLogout() {
  const router = useRouter();
  const lastActivity = useRef<number>(0);

  useEffect(() => {
    lastActivity.current = Date.now();

    const bump = () => {
      lastActivity.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
    const onFocus = () => bump();

    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    window.addEventListener("focus", onFocus);

    const tick = window.setInterval(() => {
      if (Date.now() - lastActivity.current >= IDLE_MS) {
        window.clearInterval(tick);
        fetch("/api/auth/logout", { method: "POST" }).finally(() => {
          router.replace("/auth?expired=1");
        });
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.removeEventListener("focus", onFocus);
      window.clearInterval(tick);
    };
  }, [router]);

  return null;
}