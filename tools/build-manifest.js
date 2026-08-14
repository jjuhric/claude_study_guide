/*
 * Regenerates data/manifest.json from the content files:
 *
 *     node tools/build-manifest.js
 *
 * The home screen runs off these counts so a first visit downloads a few
 * hundred bytes rather than every certification's question bank. Run this
 * after adding or removing questions, cards, or lessons — test/smoke.js fails
 * if the manifest and the content files disagree.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IDS = ["ccao", "ccdv", "ccaf", "ccap"];

const manifest = {};
for (const id of IDS) {
  const f = path.join(ROOT, "data", `${id}.json`);
  if (!fs.existsSync(f)) { console.error(`missing data/${id}.json`); process.exit(1); }
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  manifest[id] = {
    code: d.code,
    questions: (d.questions || []).length,
    cards: (d.cards || []).length,
    lessons: (d.lessons || []).length,
  };
}

const out = path.join(ROOT, "data", "manifest.json");
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n", "utf8");
for (const [id, m] of Object.entries(manifest)) {
  console.log(`  ${m.code.padEnd(8)} ${String(m.questions).padStart(3)} questions  ${m.cards} cards  ${m.lessons} lessons`);
}
console.log(`wrote data/manifest.json (${fs.statSync(out).size} bytes)`);
