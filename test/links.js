/*
 * Checks every external video link in data/*.json against YouTube's oEmbed
 * endpoint, which returns 404 for videos that have been deleted or made
 * private. No dependencies, no API key:
 *
 *     node test/links.js
 *
 * Kept out of smoke.js deliberately — this one needs the network, so it should
 * never be the reason an offline run fails. Run it periodically: recommended
 * videos rot, and a study guide pointing at dead links quietly loses trust.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IDS = ["ccao", "ccdv", "ccaf", "ccap"];
const TIMEOUT_MS = 15000;
const CONCURRENCY = 4;

// videoId -> [{cert, lesson, title}]
const refs = new Map();
for (const id of IDS) {
  const f = path.join(ROOT, "data", `${id}.json`);
  if (!fs.existsSync(f)) continue;
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const lesson of d.lessons || []) {
    const re = /<a href='https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]+)'[\s\S]*?vtitle'>(.*?)<\/span>/g;
    let m;
    while ((m = re.exec(lesson.b)) !== null) {
      if (!refs.has(m[1])) refs.set(m[1], []);
      refs.get(m[1]).push({ cert: d.code, lesson: lesson.h, title: m[2] });
    }
  }
}

async function check(id) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}&format=json`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (r.status === 200) {
      const j = await r.json();
      return { id, ok: true, who: j.author_name, title: j.title };
    }
    return { id, ok: false, status: r.status };
  } catch (e) {
    return { id, ok: null, status: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(t);
  }
}

(async function run() {
  const ids = [...refs.keys()];
  console.log(`checking ${ids.length} unique videos across ${[...refs.values()].reduce((a, v) => a + v.length, 0)} references\n`);

  const results = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    results.push(...await Promise.all(ids.slice(i, i + CONCURRENCY).map(check)));
  }

  const dead = results.filter(r => r.ok === false);
  const unknown = results.filter(r => r.ok === null);

  for (const r of results.filter(r => r.ok)) console.log(`  ok    ${r.id}  ${r.who} | ${r.title.slice(0, 64)}`);
  for (const r of unknown) console.log(`  ??    ${r.id}  unreachable (${r.status}) — network issue, not necessarily dead`);
  for (const r of dead) {
    console.log(`  DEAD  ${r.id}  HTTP ${r.status}`);
    for (const w of refs.get(r.id)) console.log(`          used in ${w.cert} / ${w.lesson} as "${w.title}"`);
  }

  console.log(dead.length ? `\n${dead.length} dead link(s) — replace them in data/*.json` : "\nall video links are live");
  process.exitCode = dead.length ? 1 : 0;
})();
