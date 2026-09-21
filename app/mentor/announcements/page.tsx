import AnnouncementComposer from "@/components/mentor/AnnouncementComposer";

export const dynamic = "force-dynamic";

export default function MentorAnnouncementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="mt-1 text-sm text-muted">
          Broadcast updates to every mentee. They appear at the top of the dashboard overview.
        </p>
      </div>
      <AnnouncementComposer />
    </div>
  );
}