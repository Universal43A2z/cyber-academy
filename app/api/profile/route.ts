import { json } from "@/lib/security/rate-limit";
import { namesSchema, yearLevelSchema } from "@/lib/security/validators";
import { auditLog } from "@/lib/security/audit";
import { getSupabaseAdmin, getClientIp } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const server = await createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const ip = getClientIp(req);
  const admin = getSupabaseAdmin();
  const body = await req.json().catch(() => null);

  const full_name = namesSchema.safeParse(body?.full_name);
  const year_level = yearLevelSchema.safeParse(body?.year_level ?? null);

  if (!full_name.success) {
    return json({ error: full_name.error.issues[0]?.message ?? "Invalid name" }, 400);
  }
  if (!year_level.success) {
    return json({ error: "Invalid year level" }, 400);
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: full_name.data, year_level: year_level.data })
    .eq("id", user.id)
    .eq("role", "mentee");

  if (error) {
    return json({ error: "Could not update your profile." }, 500);
  }

  await auditLog({
    action: "profile.updated",
    userId: user.id,
    email: user.email,
    ip,
    details: { full_name: full_name.data, year_level: year_level.data ?? null },
  });

  return json({ ok: true, message: "Profile updated." });
}