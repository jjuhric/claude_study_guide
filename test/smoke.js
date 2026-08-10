/*
 * Smoke test for index.html. No dependencies — run with:  node test/smoke.js
 *
 * Boots the real app in a VM with a minimal DOM shim, the way a browser would
 * (each <script> block evaluated in order in one shared global), then renders
 * every screen for every certification.
 *
 * Guards three things that have bitten this project before:
 *   1. Saved state of the wrong shape crashing or silently going NaN.
 *   2. Unverified exam claims (domain weightings, question counts, pass marks)
 *      creeping back into content. Only facts confirmed on Anthropic's public
 *      pages may be stated as fact — see FINDINGS.md §0.
 *   3. A screen throwing at render for some certification.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const INDEX = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(INDEX, "utf8");
const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

let fails = 0;
const check = (cond, label) => { if (cond) console.log(`  ok    ${label}`); else { console.log(`  FAIL  ${label}`); fails++; } };

/* ---------- 1. every script block parses ---------- */
console.log(`script blocks: ${blocks.length}`);
blocks.forEach((src, i) => {
  try { new Function(src); check(true, `block ${i} parses (${src.length} chars)`); }
  catch (e) { check(false, `block ${i} SYNTAX ERROR: ${e.message}`); }
});

/* ---------- 2. migrate() repairs hostile saved state ---------- */
const start = html.indexOf("const S_DEFAULTS");
const end = html.indexOf("let S = migrate(store.get());");
if (start < 0 || end < 0) { check(false, "migrate() source located"); }
else {
  const migrate = new Function(html.slice(start, end) + "; return migrate;")();
  const cases = {
    "null (fresh user)": null,
    "empty object": {},
    "missing badges": { xp: 50, answered: {} },
    "missing answered": { xp: 50, badges: [] },
    "xp is NaN": { xp: NaN },
    "xp is a string": { xp: "120" },
    "badges is an object": { badges: {} },
    "answered is an array": { answered: [] },
    "cardsSeen undefined": { cardsSeen: undefined },
  };
  for (const [label, input] of Object.entries(cases)) {
    const s = migrate(input);
    const ok = Array.isArray(s.badges) && Array.isArray(s.seenCerts) && Array.isArray(s.days)
      && typeof s.xp === "number" && isFinite(s.xp)
      && typeof s.cardsSeen === "number" && isFinite(s.cardsSeen)
      && s.answered && typeof s.answered === "object" && !Array.isArray(s.answered)
      && s.domStats && s.mocks && s.lessonsRead && s.v === 1;
    check(ok, `migrate: ${label}`);
  }
  const kept = migrate({ xp: 300, badges: ["first"], cardsSeen: 7 });
  check(kept.xp === 300 && kept.badges[0] === "first" && kept.cardsSeen === 7, "migrate: valid values preserved");
}

/* ---------- 3. boot the app and render every screen ---------- */
const els = {};
const mkEl = id => ({
  id, innerHTML: "", textContent: "", style: {}, className: "",
  classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
  appendChild() {}, remove() {}, addEventListener() {},
});
for (const id of ["hdr", "app", "toast"]) els[id] = mkEl(id);

let domReady = null;
const storage = {};
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, isFinite, parseInt, parseFloat,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  confirm: () => false, alert: () => {},
  localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: () => mkEl("tmp"),
    body: { appendChild() {} },
    addEventListener: (ev, fn) => { if (ev === "DOMContentLoaded") domReady = fn; },
  },
  addEventListener: (ev, fn) => { if (ev === "DOMContentLoaded" || ev === "load") domReady = fn; },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

for (let i = 0; i < blocks.length; i++) {
  try { vm.runInContext(blocks[i], sandbox, { timeout: 15000 }); }
  catch (e) { check(false, `block ${i} threw at load: ${e.message}`); process.exit(1); }
}
if (!domReady) { check(false, "DOMContentLoaded handler registered"); process.exit(1); }
try { domReady(); check(true, "app boots without throwing"); }
catch (e) { check(false, `boot threw: ${e.message}`); process.exit(1); }

const evalIn = expr => vm.runInContext(expr, sandbox, { timeout: 15000 });
const call = (fn, ...args) => evalIn(`${fn}(${args.map(a => JSON.stringify(a)).join(",")})`);
const CERTS = evalIn("CERTS");

check(/Claude Certified Associate/.test(els.app.innerHTML), "home screen renders cert cards");
check(/Level/.test(els.hdr.innerHTML), "header renders");

for (const c of CERTS) {
  check(c.questions.length > 0 && c.cards.length > 0 && (c.lessons || []).length > 0,
    `${c.code}: ${c.questions.length}q / ${c.cards.length} cards / ${(c.lessons || []).length} lessons`);
  for (const [fn, label] of [["certView", "cert view"], ["learnList", "study guide"], ["startQuiz", "quiz"], ["startCards", "flashcards"], ["startMock", "mock exam"]]) {
    try { call(fn, c.id); check(els.app.innerHTML.length > 200, `${c.code}: ${label} renders`); }
    catch (e) { check(false, `${c.code}: ${label} threw -> ${e.message}`); }
  }
  try { call("lessonView", c.id, 0); check(els.app.innerHTML.length > 200, `${c.code}: lesson 0 renders`); }
  catch (e) { check(false, `${c.code}: lessonView threw -> ${e.message}`); }
}

/* ---------- 4. no unverified exam claims (FINDINGS.md §0) ---------- */
const allText = JSON.stringify(CERTS);
call("certView", "ccaf");
const certHeader = els.app.innerHTML;

check(/CCAR-F/.test(certHeader), "cert header uses official code CCAR-F");
check(CERTS.every(c => !/^CCA-[FP]$/.test(c.code)), "no stale CCA-F / CCA-P codes");
check(!/heaviest/i.test(allText) && !/\(\d{1,2}%\)/.test(allText), "no domain weightings or 'heaviest domain' rankings");
check(!/60 questions|120 min|pass 720\/1000/.test(certHeader + allText), "no unverified question count / time limit / pass mark");
check(!/The real CCA[R]?-[FP] exam/.test(allText), "no fabricated 'the real exam' claims");
check(!/The 6 exam scenarios/.test(allText), "no invented exam-scenario list");

/* ---------- 5. answer shuffle actually spreads correct answers ---------- */
const spread = {};
for (const c of CERTS) for (const q of c.questions) spread[q.a] = (spread[q.a] || 0) + 1;
check(Object.keys(spread).length === 4, `answer shuffle covers all 4 positions: ${JSON.stringify(spread)}`);

console.log(fails ? `\n${fails} FAILURE(S)` : "\nall checks passed");
process.exitCode = fails ? 1 : 0;
