import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Mail, User, GraduationCap, ShieldCheck, CalendarDays } from "lucide-react";
import ProfileForm from "@/components/dashboard/ProfileForm";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My profile</h1>
        <p className="mt-1 text-sm text-muted">
          Your identity inside the academy. Bookmarked by your mentor&apos;s dashboard.
        </p>
      </div>

      <div className="panel space-y-3 p-6">
        <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Account</h2>
        {[
          { icon: User, label: "Full name", value: profile?.full_name ?? "—" },
          { icon: Mail, label: "Email", value: profile?.email ?? user?.email ?? "—" },
          { icon: GraduationCap, label: "Year level", value: profile?.year_level ?? "Not set" },
          { icon: ShieldCheck, label: "Role", value: profile?.role ?? "mentee" },
          { icon: CalendarDays, label: "Enrolled", value: profile?.created_at ? formatDate(profile.created_at) : "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            <row.icon size={15} className="shrink-0 text-cyber" />
            <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted">
              {row.label}
            </span>
            <span>{row.value}</span>
          </div>
        ))}
      </div>

      <ProfileForm initialName={profile?.full_name ?? null} initialYear={profile?.year_level ?? null} />
    </div>
  );
}