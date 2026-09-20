import { json } from "@/lib/security/rate-limit";
import { moduleSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { requireMentor } from "@/lib/security/require-mentor";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Bad id" }, 400);

  const parsed = moduleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid module" }, 400);
  const m = parsed.data;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("modules")
    .update({
      week_no: m.week_no,
      title: m.title,
      description: m.description ?? null,
      content: m.content,
      video_url: m.video_url || null,
      published: m.published ?? true,
    })
    .eq("id", id)
    .select("id, week_no, title")
    .single();

  if (error) return json({ error: "Could not update module." }, 500);

  await auditLog({
    action: "module.updated",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: data as Record<string, unknown>,
  });

  return json({ ok: true, module: data });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const mentor = await requireMentor();
  if (!mentor) return json({ error: "Mentor access required." }, 403);

  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "Bad id" }, 400);

  const admin = getSupabaseAdmin();
  const { error } = await admin.from("modules").delete().eq("id", id);
  if (error) return json({ error: "Could not delete module." }, 500);

  await auditLog({
    action: "module.deleted",
    userId: mentor.id,
    email: mentor.email,
    ip: getClientIp(req),
    details: { module_id: id },
  });

  return json({ ok: true });
}