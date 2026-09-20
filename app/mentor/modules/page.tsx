import ModuleManager from "@/components/mentor/ModuleManager";

export const dynamic = "force-dynamic";

export default function MentorModulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly module publishing</h1>
        <p className="mt-1 text-sm text-muted">
          Create a lesson for a specific week; publish it and every mentee gets it in their dashboard.
        </p>
      </div>
      <ModuleManager />
    </div>
  );
}