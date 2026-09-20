import { json } from "@/lib/security/rate-limit";
import { moduleSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const parsed = moduleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid module" }, 400);
  const m = parsed.data;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("modules")
    .insert({
      week_no: m.week_no,
      title: m.title,
      description: m.description ?? null,
      content: m.content,
      video_url: m.video_url || null,
      published: m.published ?? true,
      created_by: mentor.id,
    })
    .select("id, week_no, title")
    .single();

  if (error) return json({ error: "Could not create module." }, 500);

  await auditLog({
    action: "module.created",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: data as Record<string, unknown>,
  });

  return json({ ok: true, module: data });
}

export async function GET() {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const admin = getSupabaseAdmin();
  const { data } = await admin.from("modules").select("*").order("week_no");
  return json({ modules: data ?? [] });
}