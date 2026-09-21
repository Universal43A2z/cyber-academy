// Appends a "Watch and learn" section with YouTube links to every module's
// content. Idempotent: it replaces any existing "Watch and learn" section.
// Run from the repo root:  node supabase/apply-modules-videos.mjs
import { readFileSync } from "node:fs";
import { videoLinks } from "./video-links.data.mjs";

const env = readFileSync(".env.local", "utf8")
  .split("\n")
  .map((l) => l.trim());
const get = (k) => env.find((l) => l.startsWith(k + "="))?.split("=").slice(1).join("=").trim();
const BASE = get("NEXT_PUBLIC_SUPABASE_URL");
const KEY = get("SUPABASE_SERVICE_ROLE_KEY");

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const marker = "## Watch and learn";

for (const weekNo of Object.keys(videoLinks).map(Number)) {
  const [module, exists] = await Promise.all([
    fetch(`${BASE}/rest/v1/modules?week_no=eq.${weekNo}&select=week_no,content`, { headers }).then((r) => r.json()),
    fetch(`${BASE}/rest/v1/modules?week_no=eq.${weekNo}&select=week_no`, { headers }).then((r) => r.json()),
  ]);
  if (!Array.isArray(exists) || exists.length === 0) {
    console.log(`week ${weekNo}: skipped (no module)`);
    continue;
  }
  const cur = module[0]?.content ?? "";
  const base = cur.includes(`\n${marker}`) ? cur.slice(0, cur.indexOf(`\n${marker}`)).trimEnd() : cur.trimEnd();

  const items = videoLinks[weekNo].map(
    (v) => `- [${v.title} — ${v.channel}](${v.url})`
  );
  const section = `\n\n${marker}\n\nWatch these videos from professionals and educators to go deeper on this lesson:\n\n${items.join("\n")}\n`;

  const res = await fetch(`${BASE}/rest/v1/modules?week_no=eq.${weekNo}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ content: base + section }),
  });
  console.log(`week ${weekNo}: ${res.status} (${items.length} videos)`);
}