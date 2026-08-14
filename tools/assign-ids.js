/*
 * Assigns a stable id to any question or card that lacks one:
 *
 *     node tools/assign-ids.js
 *
 * Progress is keyed by these ids rather than by array position, so questions
 * can be added, removed, reordered, or reworded without silently reattaching a
 * learner's history to a different question.
 *
 * Idempotent by design: existing ids are never regenerated, because doing so
 * would orphan the progress that references them.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const IDS = ["ccao", "ccdv", "ccaf", "ccap"];

const seen = new Set();
let assigned = 0, kept = 0;

function newId(prefix) {
  for (;;) {
    const id = prefix + "-" + crypto.randomBytes(4).toString("hex");
    if (!seen.has(id)) { seen.add(id); return id; }
  }
}

// First pass: collect ids already in use, so a rerun cannot collide with them.
for (const cid of IDS) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "data", `${cid}.json`), "utf8"));
  for (const q of d.questions) if (q.id) seen.add(q.id);
  for (const c of d.cards) if (c.id) seen.add(c.id);
}

for (const cid of IDS) {
  const f = path.join(ROOT, "data", `${cid}.json`);
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  let touched = false;
  for (const q of d.questions) {
    if (q.id) { kept++; continue; }
    q.id = newId(cid + "q"); assigned++; touched = true;
  }
  for (const c of d.cards) {
    if (c.id) { kept++; continue; }
    c.id = newId(cid + "c"); assigned++; touched = true;
  }
  if (touched) fs.writeFileSync(f, JSON.stringify(d, null, 2) + "\n", "utf8");
  console.log(`  ${d.code.padEnd(8)} ${d.questions.length} questions, ${d.cards.length} cards`);
}
console.log(`assigned ${assigned} new id(s), kept ${kept} existing`);
