// Applies the restructured quiz bank (see quizzes.data.mjs) to the live DB.
//   - Unpublishes every existing quiz (records/attempts preserved).
//   - Inserts any new quiz that does not already exist by title, with its
//     questions. Re-running is safe.
// Usage: node supabase/apply-quizzes.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const getEnv = (key) =>
  (env.match(new RegExp(`^${key}=["']?(.*?)["']?\\s*$`, "m")) || [])[1];

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const BASE = SUPABASE_URL?.endsWith("/") ? SUPABASE_URL : `${SUPABASE_URL}/`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const { curriculumQuizzes } = await import(path.join(__dirname, "quizzes.data.mjs"));

// Build module question lookup keyed by week_no.
const moduleByWeek = new Map();
const moduleTitles = new Map();
for (const entry of curriculumQuizzes) {
  if (entry.kind === "module") {
    moduleByWeek.set(entry.week_no, entry.questions);
    moduleTitles.set(entry.week_no, entry.title);
  }
}

// Expand exams to concrete question arrays (copies of the covered modules' questions).
const resolved = curriculumQuizzes.map((entry) => {
  if (entry.kind === "exam") {
    const questions = entry.fromWeeks.flatMap((w) => moduleByWeek.get(w) ?? []);
    return { ...entry, questions };
  }
  return entry;
});

async function api(pathname, init) {
  const res = await fetch(`${BASE}rest/v1/${pathname}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${init.method} ${pathname} -> ${res.status}: ${body}`);
  }
  return res.json();
}

// 1. Unpublish all existing quizzes so only the new bank is visible.
const existing = await api(
  `quizzes?select=id,title,published`,
  {
    method: "GET",
    headers: { ...headers, Prefer: "return=representation" },
  }
);
const existingList = Array.isArray(existing) ? existing : [existing];
console.log(`Existing quizzes: ${existingList.length}`);
if (existingList.length > 0) {
  const ids = existingList.map((r) => r.id);
  await api(`quizzes?id=in.(${ids.join(",")})`, {
    method: "PATCH",
    body: JSON.stringify({ published: false }),
  });
  console.log(`Unpublished ${existingList.length} previous quizzes.`);
}

// 2. Insert new quizzes + questions.
let insertedQuizzes = 0;
const existingTitles = new Set(existingList.map((r) => r.title));

for (const entry of resolved) {
  const { title, description, time_limit_sec, questions } = entry;
  const week_no = entry.week_no;
  if (existingTitles.has(title)) {
    console.log(`skip (exists): ${title}`);
    continue;
  }

  const [quiz] = await api("quizzes", {
    method: "POST",
    body: JSON.stringify({
      week_no,
      title,
      description,
      time_limit_sec,
      published: true,
    }),
  });

  const rows = questions.map((qs, i) => ({
    quiz_id: quiz.id,
    question: qs.q,
    options: qs.o,
    correct_index: qs.c,
    points: 1,
    position: i,
  }));

  await api("quiz_questions", {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });

  insertedQuizzes++;
  console.log(`created: ${title} (${questions.length} questions)`);
}

console.log(`\nDone. Inserted ${insertedQuizzes} new quizzes. Total live: ${resolved.length} + ${existingList.length} hidden.`);