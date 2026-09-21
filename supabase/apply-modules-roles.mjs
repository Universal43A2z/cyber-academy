// Applies the Cybersecurity Roles modules (weeks 9-13) from role-modules.data.mjs
// to Supabase via the admin API, and regenerates the idempotent SQL file so the
// repo keeps a runnable record. Run from the repo root:
//   node supabase/apply-modules-roles.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { roleModules } from "./role-modules.data.mjs";

const env = readFileSync(".env.local", "utf8")
  .split("\n")
  .map((l) => l.trim());
const get = (k) => env.find((l) => l.startsWith(k + "="))?.split("=").slice(1).join("=").trim();
const BASE = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");

if (!BASE || !KEY) {
  console.error("Missing Supabase keys in .env.local");
  process.exit(1);
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const esc = (s) => s.replace(/'/g, "''");

const sql = [
  "-- Adds the Cybersecurity Roles modules (weeks 9-13). Regenerate with:",
  "--   node supabase/apply-modules-roles.mjs",
  "-- Idempotent: each week is only inserted if it does not already exist.",
  "",
  "create unique index if not exists modules_week_no_key on public.modules (week_no);",
  "",
];

for (const m of roleModules) {
  const exists = await fetch(
    `${BASE}/rest/v1/modules?week_no=eq.${m.week_no}&select=week_no`,
    { headers }
  ).then((r) => r.json());

  const body = {
    week_no: m.week_no,
    title: m.title,
    description: m.description,
    content: m.content,
    published: true,
  };

  if (Array.isArray(exists) && exists.length > 0) {
    const res = await fetch(`${BASE}/rest/v1/modules?week_no=eq.${m.week_no}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    console.log(`week ${m.week_no}: updated (${res.status})`);
  } else {
    const res = await fetch(`${BASE}/rest/v1/modules`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    console.log(`week ${m.week_no}: inserted (${res.status})`);
  }

  sql.push(
    `insert into public.modules (week_no, title, description, content, published)`,
    `select ${m.week_no}, '${esc(m.title)}', '${esc(m.description)}', $C${m.week_no}$${m.content}$C${m.week_no}$, true`,
    `where not exists (select 1 from public.modules where week_no = ${m.week_no});`,
    ""
  );
}

writeFileSync("supabase/insert-modules-roles.sql", sql.join("\n"));
console.log("wrote supabase/insert-modules-roles.sql");