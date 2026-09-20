import { createSupabaseServerClient } from "@/lib/supabase/server";
import FeedbackPanel from "@/components/feedback/FeedbackPanel";
import type { FeedbackReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardFeedbackPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const { data: reports } = await supabase
    .from("feedback_reports")
    .select("id, user_id, user_email, subject, message, category, status, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback reports</h1>
        <p className="mt-1 text-sm text-muted">
          Tell your mentor what is working and what to fix — reports for bugs, content
          and suggestions land straight in their inbox.
        </p>
      </div>
      <FeedbackPanel reports={(reports ?? []) as FeedbackReport[]} />
    </div>
  );
}