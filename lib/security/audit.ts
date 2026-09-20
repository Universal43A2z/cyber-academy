import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Write an entry to the audit log using the service-role client so the
 * action is recorded even when RLS would otherwise reject it on behalf of
 * the acting user (defense-in-depth + reliable investigation trail).
 */
export async function auditLog(opts: {
  action: string;
  userId?: string | null;
  email?: string | null;
  details?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await getSupabaseAdmin()
      .from("activity_logs")
      .insert({
        user_id: opts.userId ?? null,
        email: opts.email ?? null,
        action: opts.action,
        details: opts.details ?? {},
        ip: opts.ip ?? null,
      });
  } catch (err) {
    // Logging must never break the request it is auditing.
    console.error("[audit] failed to write log:", err);
  }
}