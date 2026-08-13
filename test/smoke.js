/*
 * Smoke test for index.html + data/*.json. No dependencies:
 *
 *     node test/smoke.js
 *
 * Boots the real app in a VM with a minimal DOM shim and a fetch() shim that
 * serves data/*.json off disk, so the actual loader path runs — then renders
 * every screen for every certification.
 *
 * Guards four things that have bitten this project before:
 *   1. Saved state of the wrong shape crashing or silently going NaN.
 *   2. Unverified exam claims (domain weightings, question counts, pass marks)
 *      creeping back into content. Only facts confirmed on Anthropic's public
 *      pages may be stated as fact — see FINDINGS.md §0.
 *   3. A screen throwing at render for some certification.
 *   4. Content files going missing, malformed, or empty.
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const blocks = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);

let fails = 0;
const check = (cond, label) => { if (cond) console.log(`  ok    ${label}`); else { console.log(`  FAIL  ${label}`); fails++; } };

/* ---------- 1. scripts parse ---------- */
check(blocks.length === 2, `index.html has 2 script blocks (found ${blocks.length})`);
blocks.forEach((src, i) => {
  try { new Function(src); check(true, `block ${i} parses (${src.length} chars)`); }
  catch (e) { check(false, `block ${i} SYNTAX ERROR: ${e.message}`); }
});

/* ---------- 2. content files are present and well-formed ---------- */
const IDS = ["ccao", "ccdv", "ccaf", "ccap"];
const data = {};
for (const id of IDS) {
  const f = path.join(ROOT, "data", `${id}.json`);
  if (!fs.existsSync(f)) { check(false, `data/${id}.json exists`); continue; }
  let d;
  try { d = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { check(false, `data/${id}.json parses: ${e.message}`); continue; }
  data[id] = d;
  const qOk = Array.isArray(d.questions) && d.questions.length > 0
    && d.questions.every(q => q.q && Array.isArray(q.opts) && q.opts.length >= 2
      && Number.isInteger(q.a) && q.a >= 0 && q.a < q.opts.length && Number.isInteger(q.d));
  const cOk = Array.isArray(d.cards) && d.cards.length > 0 && d.cards.every(c => c.f && c.b);
  const lOk = Array.isArray(d.lessons) && d.lessons.length > 0 && d.lessons.every(l => l.h && l.b);
  check(qOk, `data/${id}.json: ${d.questions.length} questions, all with valid answer index`);
  check(cOk, `data/${id}.json: ${d.cards.length} cards well-formed`);
  check(lOk, `data/${id}.json: ${d.lessons.length} lessons well-formed`);
}

/* ---------- 3. migrate() repairs hostile saved state ---------- */
const mStart = html.indexOf("const S_DEFAULTS");
const mEnd = html.indexOf("let S = migrate(store.get());");
if (mStart < 0 || mEnd < 0) check(false, "migrate() source located");
else {
  const migrate = new Function(html.slice(mStart, mEnd) + "; return migrate;")();
  const cases = {
    "null (fresh user)": null, "empty object": {},
    "missing badges": { xp: 50, answered: {} }, "missing answered": { xp: 50, badges: [] },
    "xp is NaN": { xp: NaN }, "xp is a string": { xp: "120" },
    "badges is an object": { badges: {} }, "answered is an array": { answered: [] },
    "cardsSeen undefined": { cardsSeen: undefined },
  };
  for (const [label, input] of Object.entries(cases)) {
    const s = migrate(input);
    check(Array.isArray(s.badges) && Array.isArray(s.seenCerts) && Array.isArray(s.days)
      && typeof s.xp === "number" && isFinite(s.xp)
      && typeof s.cardsSeen === "number" && isFinite(s.cardsSeen)
      && s.answered && typeof s.answered === "object" && !Array.isArray(s.answered)
      && s.domStats && s.mocks && s.lessonsRead && s.v === 1, `migrate: ${label}`);
  }
  const kept = migrate({ xp: 300, badges: ["first"], cardsSeen: 7 });
  check(kept.xp === 300 && kept.badges[0] === "first" && kept.cardsSeen === 7, "migrate: valid values preserved");
}

/* ---------- 4. boot through the real loader ---------- */
const els = {};
const mkEl = id => ({
  id, innerHTML: "", textContent: "", style: {}, className: "",
  classList: { add() {}, remove() {}, contains: () => false },
  appendChild() {}, remove() {}, addEventListener() {},
});
for (const id of ["hdr", "app", "toast"]) els[id] = mkEl(id);

const storage = {};
const downloads = [];
let lastBlob = null;
const sandbox = {
  console,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  confirm: () => false, alert: () => {},
  localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    createElement: () => { const e = mkEl("tmp"); e.click = () => { downloads.push(e); }; return e; },
    body: { appendChild() {} },
    addEventListener() {},
    documentElement: {
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = v; },
      removeAttribute(k) { delete this.attrs[k]; },
      getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    },
  },
  addEventListener() {},
  // Enough of the download + file-read surface to exercise export/import.
  Blob: class { constructor(parts) { this.parts = parts; } },
  URL: { createObjectURL: b => { lastBlob = b; return "blob:test"; }, revokeObjectURL() {} },
  FileReader: class {
    readAsText(file) { this.result = file.__text; setTimeout(() => this.onload && this.onload(), 0); }
  },
  // Serve data/*.json off disk, mimicking the browser fetch the loader uses.
  fetch: url => {
    const f = path.join(ROOT, String(url).split("?")[0]);
    if (!fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404 });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(JSON.parse(fs.readFileSync(f, "utf8"))) });
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

(async function run() {
  for (let i = 0; i < blocks.length; i++) {
    try { vm.runInContext(blocks[i], sandbox, { timeout: 15000 }); }
    catch (e) { check(false, `block ${i} threw at load: ${e.message}`); process.exit(1); }
  }
  // let the loader's promise chain settle
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));

  const evalIn = expr => vm.runInContext(expr, sandbox, { timeout: 15000 });
  const call = (fn, ...args) => evalIn(`${fn}(${args.map(a => JSON.stringify(a)).join(",")})`);
  const CERTS = evalIn("CERTS");

  check(!/Could not load study content/.test(els.app.innerHTML), "loader did not fall into its error state");
  check(/Claude Certified Associate/.test(els.app.innerHTML), "home screen renders cert cards after load");
  check(/Level/.test(els.hdr.innerHTML), "header renders");

  for (const c of CERTS) {
    check(c.questions.length > 0 && c.cards.length > 0 && (c.lessons || []).length > 0,
      `${c.code}: ${c.questions.length}q / ${c.cards.length} cards / ${(c.lessons || []).length} lessons loaded`);
    for (const [fn, label] of [["certView", "cert view"], ["learnList", "study guide"], ["startQuiz", "quiz"], ["startCards", "flashcards"], ["startMock", "mock exam"]]) {
      try { call(fn, c.id); check(els.app.innerHTML.length > 200, `${c.code}: ${label} renders`); }
      catch (e) { check(false, `${c.code}: ${label} threw -> ${e.message}`); }
    }
    try { call("lessonView", c.id, 0); check(els.app.innerHTML.length > 200, `${c.code}: lesson 0 renders`); }
    catch (e) { check(false, `${c.code}: lessonView threw -> ${e.message}`); }
  }

  /* ---------- 5. a truncated data file explains itself, never throws ---------- */
  evalIn(`(function(){const c=CERTS.find(x=>x.id==="ccao"); c.__q=c.questions; c.__c=c.cards; c.questions=[]; c.cards=[];})()`);
  for (const [fn, label] of [["startQuiz", "quiz"], ["startCards", "flashcards"], ["startMock", "mock exam"]]) {
    try { call(fn, "ccao"); check(/available yet/.test(els.app.innerHTML), `empty content: ${label} explains instead of throwing`); }
    catch (e) { check(false, `empty content: ${label} threw -> ${e.message}`); }
  }
  evalIn(`(function(){const c=CERTS.find(x=>x.id==="ccao"); c.questions=c.__q; c.cards=c.__c; delete c.__q; delete c.__c;})()`);
  check(evalIn(`CERTS.find(x=>x.id==="ccao").questions.length`) === data.ccao.questions.length, "content restored after guard test");

  /* ---------- 6. no unverified exam claims (FINDINGS.md §0) ---------- */
  const allText = JSON.stringify(CERTS) + JSON.stringify(data) + html;
  call("certView", "ccaf");
  const certHeader = els.app.innerHTML;

  check(/CCAR-F/.test(certHeader), "cert header uses official code CCAR-F");
  check(CERTS.every(c => !/^CCA-[FP]$/.test(c.code)), "no stale CCA-F / CCA-P codes");
  check(!/heaviest/i.test(allText) && !/\(\d{1,2}%\)/.test(allText), "no domain weightings or 'heaviest domain' rankings");
  // Exam format figures (question count, time limit, pass mark) are not confirmed by
  // Anthropic — only corroborated by third-party study sites. They may appear only
  // alongside an explicit hedge, so a reader always sees the evidence tier.
  const FIGURE = /\b720\b|100[–-]1000|\d+\s*(exam\s*)?questions\b|120\s*min/i;
  const EXAM_CONTEXT = /exam|pass(ing)?\s*(mark|score)|scaled score|blueprint/i;
  const HEDGE = /unconfirmed|widely report|official exam guide|practice benchmark|not a verified/i;
  const unhedged = [];
  for (const [id, d] of Object.entries(data)) {
    const fields = [
      ...d.cards.map((c, i) => [`${id} card[${i}]`, `${c.f} ${c.b}`]),
      ...d.lessons.map((l, i) => [`${id} lesson[${i}]`, l.b]),
      ...d.questions.map((q, i) => [`${id} question[${i}]`, `${q.q} ${q.exp || ""}`]),
    ];
    for (const [where, text] of fields) {
      // Only a figure stated in an exam-format context needs the hedge; "20 minutes
      // with a primer" is not a claim about the exam.
      if (FIGURE.test(text) && EXAM_CONTEXT.test(text) && !HEDGE.test(text)) unhedged.push(where);
    }
  }
  check(unhedged.length === 0, `exam format figures always carry a hedge (${unhedged.slice(0, 3).join(", ") || "none unhedged"})`);
  check(!/60 questions|pass 720\/1000/.test(html), "index.html states no unverified exam format");
  check(!/The real CCA[R]?-[FP] exam/.test(allText), "no fabricated 'the real exam' claims");
  check(!/The 6 exam scenarios/.test(allText), "no invented exam-scenario list");

  /* ---------- 6. answer shuffle spreads correct answers ---------- */
  const spread = {};
  for (const c of CERTS) for (const q of c.questions) spread[q.a] = (spread[q.a] || 0) + 1;
  check(Object.keys(spread).length === 4, `answer shuffle covers all 4 positions: ${JSON.stringify(spread)}`);

  // and the shuffle must not corrupt the mapping: every correct option text
  // must still be the one the source file marked correct
  let mismatches = 0;
  for (const c of CERTS) {
    const src = data[c.id];
    c.questions.forEach((q, i) => { if (q.opts[q.a] !== src.questions[i].opts[src.questions[i].a]) mismatches++; });
  }
  check(mismatches === 0, `shuffle preserves the correct answer for all questions (${mismatches} mismatches)`);

  /* ---------- 7. spaced repetition ---------- */
  evalIn(`S.cardBox={}; scheduleCard(CERTS[0],0,true)`);
  check(evalIn(`S.cardBox.ccao["0"].b`) === 1, "scheduleCard: a correct recall advances to box 1");
  evalIn(`scheduleCard(CERTS[0],0,true); scheduleCard(CERTS[0],0,true)`);
  check(evalIn(`S.cardBox.ccao["0"].b`) === 3, "scheduleCard: consecutive recalls climb boxes");
  check(evalIn(`S.cardBox.ccao["0"].d > today()`), "scheduleCard: a known card is scheduled forward");
  evalIn(`scheduleCard(CERTS[0],0,false)`);
  check(evalIn(`S.cardBox.ccao["0"].b`) === 1, "scheduleCard: a miss drops back to box 1");
  check(evalIn(`S.cardBox.ccao["0"].d === today()`), "scheduleCard: a missed card stays due today");
  check(evalIn(`S.cardBox.ccao["0"].b <= 5`), "scheduleCard: box never exceeds the ladder length");

  evalIn(`S.cardBox={}`);
  check(evalIn(`dueCards(CERTS[0]).length`) === data.ccao.cards.length, "dueCards: an unseen deck is entirely due");
  check(evalIn(`(function(){CERTS[0].cards.forEach((_,i)=>scheduleCard(CERTS[0],i,true));return dueCards(CERTS[0]).length})()`) === 0,
    "dueCards: cards scheduled ahead drop out of the queue");
  try { call("startCards", "ccao"); check(/Nothing due right now/.test(els.app.innerHTML), "startCards: caught-up screen instead of pointless drilling"); }
  catch (e) { check(false, `startCards caught-up threw -> ${e.message}`); }
  evalIn(`S.cardBox={}`);

  /* ---------- 8. targeted practice ---------- */
  // Every "do this next" button must point at a function that actually exists.
  for (const g of evalIn(`prepProgress(CERTS[0]).parts.map(p=>p.go)`)) {
    check(evalIn(`typeof ${g}`) === "function", `prep next-step action ${g}() is defined`);
  }
  const rp = evalIn(`JSON.stringify((function(){const r=prepProgress(CERTS[0]);return {s:r.score,n:r.parts.length,w:r.weakest.k}})())`);
  const rpo = JSON.parse(rp);
  check(rpo.s >= 0 && rpo.s <= 100, `prepProgress: score in range (${rpo.s})`);
  check(rpo.n === 6 && !!rpo.w, `prepProgress: ${rpo.n} components, weakest identified (${rpo.w})`);

  for (const [fn, label] of [["startWeakest", "weakest-domain drill"], ["startReview", "review misses"]]) {
    try { call(fn, "ccao"); check(els.app.innerHTML.length > 200, `${label} renders`); }
    catch (e) { check(false, `${label} threw -> ${e.message}`); }
  }
  try { call("startDrill", "ccao", 0); check(/Drilling/.test(els.app.innerHTML), "domain drill renders with its mode label"); }
  catch (e) { check(false, `startDrill threw -> ${e.message}`); }
  // a drill must only serve questions from the domain asked for
  check(evalIn(`Q.idxs.every(i=>CERTS[0].questions[i].d===0)`), "domain drill serves only that domain's questions");

  /* ---------- 9. cert page surfaces the new guidance ---------- */
  call("certView", "ccao");
  const cv = els.app.innerHTML;
  check(/class="prepring"/.test(cv), "cert page renders the prep-progress ring");
  check((cv.match(/class="meter"/g) || []).length === 6, "cert page renders all 6 prep components");
  check(/class="nextstep"/.test(cv) && /Do this next/.test(cv), "cert page tells you what to do next");
  check((cv.match(/class="mode"/g) || []).length === 6, "cert page offers all 6 study modes");
  check(/dombar drillable/.test(cv), "domain rows are drillable");
  check(/not a prediction about the real exam/.test(cv), "prep score is scoped honestly");

  /* ---------- 10. theme ---------- */
  const root = sandbox.document.documentElement;
  evalIn(`S.theme="auto"; applyTheme()`);
  check(root.getAttribute("data-theme") === null, "theme auto: no override, follows the OS");
  evalIn(`S.theme="dark"; applyTheme()`);
  check(root.getAttribute("data-theme") === "dark", "theme dark: data-theme set on the root element");
  evalIn(`S.theme="light"; applyTheme()`);
  check(root.getAttribute("data-theme") === "light", "theme light: overrides a dark OS preference");
  evalIn(`S.theme="auto"; applyTheme(); cycleTheme()`);
  check(["light", "dark", "auto"].includes(evalIn(`S.theme`)), "cycleTheme moves through the three states");
  evalIn(`S.theme="auto"; applyTheme()`);
  // dark theme must not leave white-on-white or black-on-black anywhere
  check(!/#toast\{[^}]*color:#fff/.test(html), "toast text is not hardcoded white (breaks in dark)");
  check(!/\.exbox pre\{background:#fff/.test(html), "code blocks use a themed background");

  /* ---------- 11. export / import ---------- */
  evalIn(`S.xp=1234; S.badges=["first"]; save()`);
  downloads.length = 0;
  evalIn(`exportProgress()`);
  check(downloads.length === 1, "exportProgress triggers a download");
  check(/^cert-quest-progress-\d{4}-\d{2}-\d{2}\.json$/.test(downloads[0].download || ""),
    `export filename is dated (${downloads[0] && downloads[0].download})`);
  const exported = lastBlob && lastBlob.parts && lastBlob.parts[0];
  let round = null;
  try { round = JSON.parse(exported); } catch (e) { /* reported below */ }
  check(round && round.xp === 1234 && round.badges[0] === "first", "exported JSON round-trips the live state");

  // importing replaces state, and runs through the same repair path as a load
  evalIn(`S.xp=0; S.badges=[]; save()`);
  sandbox.confirm = () => true;
  evalIn(`importProgress({__text:${JSON.stringify(JSON.stringify({ xp: 999, badges: ["first", "combo5"], cardsSeen: "bad" }))}})`);
  await new Promise(r => setTimeout(r, 20));
  check(evalIn(`S.xp`) === 999, "importProgress restores exported values");
  check(evalIn(`S.badges.length`) === 2, "importProgress restores badges");
  check(evalIn(`typeof S.cardsSeen === "number" && isFinite(S.cardsSeen)`), "importProgress repairs bad fields via migrate()");

  // a malformed file must not wipe progress
  let alerted = 0; sandbox.alert = () => { alerted++; };
  evalIn(`importProgress({__text:"not json at all"})`);
  await new Promise(r => setTimeout(r, 20));
  check(evalIn(`S.xp`) === 999 && alerted === 1, "a malformed import is rejected without destroying progress");
  sandbox.confirm = () => false;
  evalIn(`importProgress({__text:${JSON.stringify(JSON.stringify({ xp: 5 }))}})`);
  await new Promise(r => setTimeout(r, 20));
  check(evalIn(`S.xp`) === 999, "declining the import confirmation keeps current progress");

  /* ---------- 12. accessibility ---------- */
  check(/aria-live="polite"/.test(html) && /id="live"/.test(html), "a live region exists for announcements");
  check(/<main id="app">/.test(html), "app content is in a <main> landmark");
  check(/aria-disabled/.test(html), "answered options expose their disabled state");
  check(/class="vhide"> — correct answer/.test(html), "correctness is conveyed by text, not colour alone");
  check(/prefers-reduced-motion/.test(html), "reduced-motion preference is respected");
  check(/focus-visible/.test(html), "keyboard focus is visible");
  check(/role="progressbar"/.test(html), "the XP bar is exposed as a progressbar");

  console.log(fails ? `\n${fails} FAILURE(S)` : "\nall checks passed");
  process.exitCode = fails ? 1 : 0;
})();
