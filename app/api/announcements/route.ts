import { json } from "@/lib/security/rate-limit";
import { announcementSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireMentor } from "@/lib/security/require-mentor";

export const runtime = "nodejs";

export async function GET() {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: announcements } = await server
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return json({ announcements: announcements ?? [] });
}

export async function POST(req: Request) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const parsed = announcementSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? "Invalid announcement" }, 400);
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", mentor.id)
    .maybeSingle();

  const { data: created, error } = await admin
    .from("announcements")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      author_name: profile?.full_name ?? "Mentor",
      created_by: mentor.id,
    })
    .select("id")
    .single();

  if (error) {
    return json({ error: "Could not publish the announcement." }, 500);
  }

  await auditLog({
    action: "announcement.published",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { title: parsed.data.title },
  });

  return json({ ok: true, message: "Announcement published.", id: created!.id });
}