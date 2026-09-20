import { createSupabaseServerClient } from "@/lib/supabase/server";
import { currentWeekNo } from "@/lib/utils";
import AttendancePanel from "@/components/attendance/AttendancePanel";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user!.id;

  const { data: history } = await supabase
    .from("attendances")
    .select("id, week_no, status, note, date")
    .eq("user_id", uid);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="mt-1 text-sm text-muted">
          Mark yourself present each week so your mentor can track participation.
        </p>
      </div>
      <AttendancePanel
        week={currentWeekNo()}
        history={
          (history ?? []) as {
            id: string;
            week_no: number;
            status: "present" | "late" | "absent";
            note: string | null;
            date: string;
          }[]
        }
      />
    </div>
  );
}