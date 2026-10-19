"use client";

import { CheckCircle2, XCircle, X } from "lucide-react";

export type ToastMsg = { ok: boolean; text: string } | null;

export default function Toast({
  msg,
  onDismiss,
}: {
  msg: ToastMsg;
  onDismiss: () => void;
}) {
  if (!msg) return null;

  const { ok, text } = msg;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"
      role={ok ? "status" : "alert"}
      aria-live={ok ? "polite" : "assertive"}
    >
      <div
        className={`toast-in pointer-events-auto w-full max-w-md overflow-hidden rounded-xl border bg-panel-2 shadow-2xl ${
          ok ? "border-cyber/50" : "border-danger/60"
        }`}
        style={{
          boxShadow: ok
            ? "0 10px 40px rgba(0,0,0,.5), 0 0 24px rgba(0,255,163,.14)"
            : "0 10px 40px rgba(0,0,0,.5), 0 0 24px rgba(255,46,99,.22)",
        }}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          {ok ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cyber" />
          ) : (
            <XCircle size={18} className="mt-0.5 shrink-0 text-danger" />
          )}
          <p
            className={`flex-1 text-sm font-medium leading-snug ${
              ok ? "text-cyber" : "text-foreground"
            }`}
          >
            {ok ? "Success" : "Sign-in failed"}
            <span
              className={`mt-0.5 block text-xs font-normal ${
                ok ? "text-cyber/80" : "text-muted"
              }`}
            >
              {text}
            </span>
          </p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 text-muted transition hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
        <div className="h-0.5 w-full bg-line/80">
          <div className={`toast-bar h-full w-full ${ok ? "bg-cyber" : "bg-danger"}`} />
        </div>
      </div>
    </div>
  );
}
