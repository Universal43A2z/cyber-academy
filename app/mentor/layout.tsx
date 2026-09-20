import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";

export const dynamic = "force-dynamic";

export default async function MentorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? user.user_metadata?.role ?? "mentee";
  if (role !== "mentor") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar role="mentor" name={profile?.full_name} />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</div>
      <footer className="border-t border-line py-4 text-center font-mono text-[11px] uppercase tracking-widest text-muted/70">
        f1 stackmind cyber academy · mentor control zone · built by akira
      </footer>
    </div>
  );
}