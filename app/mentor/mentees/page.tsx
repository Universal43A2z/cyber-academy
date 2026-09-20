import MenteesTable from "@/components/mentor/MenteesTable";

export const dynamic = "force-dynamic";

export default function MentorMenteesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentee performance</h1>
        <p className="mt-1 text-sm text-muted">
          Live view of attendance, quiz scores, and module completion for every enrolled mentee.
        </p>
      </div>
      <MenteesTable />
    </div>
  );
}