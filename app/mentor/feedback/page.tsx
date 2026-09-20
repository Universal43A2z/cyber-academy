import FeedbackInbox from "@/components/mentor/FeedbackInbox";

export const dynamic = "force-dynamic";

export default function MentorFeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feedback inbox</h1>
        <p className="mt-1 text-sm text-muted">
          Reports and suggestions sent by mentees — route them to review and resolve so
          everyone knows it was seen.
        </p>
      </div>
      <FeedbackInbox />
    </div>
  );
}