import LogsViewer from "@/components/mentor/LogsViewer";

export const dynamic = "force-dynamic";

export default function MentorLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit log</h1>
        <p className="mt-1 text-sm text-muted">
          Every login, OTP, signup, attendance mark, quiz submission and content change — timestamped for investigation.
        </p>
      </div>
      <LogsViewer />
    </div>
  );
}