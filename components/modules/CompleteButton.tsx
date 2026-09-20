"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function CompleteButton({
  moduleId,
  completed,
}: {
  moduleId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(completed);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/mentee/module-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module_id: moduleId,
        completed: !done,
      }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(!done);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={done ? "btn-primary" : "btn-ghost"}
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin" />
      ) : done ? (
        <CheckCircle2 size={15} />
      ) : (
        <CheckCircle2 size={15} />
      )}
      {done ? "Module completed" : "Mark as complete"}
    </button>
  );
}