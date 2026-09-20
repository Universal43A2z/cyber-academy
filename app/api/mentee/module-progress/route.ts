import { json } from "@/lib/security/rate-limit";
import { z } from "zod";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  module_id: z.string().uuid(),
  completed: z.boolean(),
});

export async function POST(req: Request) {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  const { module_id, completed } = parsed.data;

  const admin = getSupabaseAdmin();
  const { data: module } = await admin
    .from("modules")
    .select("id,title")
    .eq("id", module_id)
    .eq("published", true)
    .maybeSingle();
  if (!module) return json({ error: "Module not found." }, 404);

  const { error } = await admin.from("module_progress").upsert(
    {
      user_id: user.id,
      module_id,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,module_id" }
  );

  if (error) return json({ error: "Could not update progress." }, 500);

  await auditLog({
    action: completed ? "module.completed" : "module.uncompleted",
    userId: user.id,
    email: user.email,
    ip: getClientIp(req),
    details: { module_id, module_title: module.title },
  });

  return json({ ok: true });
}