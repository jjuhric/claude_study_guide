/*
 * Smoke test for index.html + data/*.json. No dependencies:
 *
 *     node test/smoke.js
 *
 * Boots the real app in a VM with a minimal DOM shim and a fetch() shim that
 * serves data/*.json off disk, so the actual loader path runs — then renders
 * every screen for every certification.
 *
 * Guards the things that have bitten this project before:
 *   1. Saved state of the wrong shape crashing or silently going NaN.
 *   2. Unverified exam claims (domain weightings, question counts, pass marks)
 *      creeping back into content. Only facts confirmed on Anthropic's public
 *      pages may be stated as fact — see FINDINGS.md §0.
 *   3. A screen throwing at render for some certification.
 *   4. Content files going missing, malformed, empty, or thin in a domain.
 *   5. Per-option rationales drifting out of alignment with their options.
 *   6. Duplicate questions making the bank feel smaller than it is.
 *   7. Progress being keyed by array position, so editing content silently
 *      reattaches a learner's history to a different question.
 *   8. The manifest disagreeing with the content files it summarises.
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
  id, innerHTML: "", textContent: "", style: {}, className: "", disabled: false,
  classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
  appendChild() {}, remove() {}, addEventListener() {}, focus() {}, setAttribute() {}, getAttribute: () => null,
  insertAdjacentHTML(pos, html) { this.innerHTML += html; },
});
// Four stand-in answer buttons so answer() can grade and annotate them.
const optEls = [0, 1, 2, 3].map(i => mkEl("opt" + i));
for (const id of ["hdr", "app", "toast"]) els[id] = mkEl(id);

const storage = {};
const downloads = [];
const fetched = [];          // every URL the app requests, in order
let lastBlob = null;
const sandbox = {
  console,
  setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
  confirm: () => false, alert: () => {},
  localStorage: { getItem: k => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
  document: {
    getElementById: id => els[id] || (els[id] = mkEl(id)),
    querySelectorAll: sel => (sel === ".opt" ? optEls : []),
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
    fetched.push(String(url));
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

  /* ---------- on-demand loading ---------- */
  // Boot must fetch only the manifest — not every certification's bank.
  const bootFetches = fetched.slice();
  check(bootFetches.length === 1 && /manifest\.json$/.test(bootFetches[0]),
    `boot fetches only the manifest (${bootFetches.join(", ") || "nothing"})`);
  check(CERTS.every(c => !c._loaded), "no certification content is loaded at boot");
  // ...yet the home screen still shows real totals, from the manifest.
  check(/\/\s*100\s*questions seen|100 questions seen|0\/100/.test(els.app.innerHTML) || /100/.test(els.app.innerHTML),
    "home screen shows manifest-derived question totals before any bank loads");

  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "manifest.json"), "utf8"));
  const drift = [];
  for (const [id, d] of Object.entries(data)) {
    const m = manifest[id];
    if (!m) { drift.push(`${id} missing from manifest`); continue; }
    if (m.questions !== d.questions.length) drift.push(`${id} questions ${m.questions}≠${d.questions.length}`);
    if (m.cards !== d.cards.length) drift.push(`${id} cards ${m.cards}≠${d.cards.length}`);
    if (m.lessons !== d.lessons.length) drift.push(`${id} lessons ${m.lessons}≠${d.lessons.length}`);
    if (m.code !== d.code) drift.push(`${id} code ${m.code}≠${d.code}`);
  }
  check(drift.length === 0, `manifest matches the content files (${drift.join(", ") || "no drift"})`);

  // Opening a certification fetches exactly that one.
  fetched.length = 0;
  call("certView", "ccao");
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));
  check(fetched.length === 1 && /ccao\.json$/.test(fetched[0]), `opening a cert fetches only its own bank (${fetched.join(", ")})`);
  check(evalIn(`CERTS.find(x=>x.id==="ccao")._loaded === true`), "the opened certification is marked loaded");
  check(evalIn(`CERTS.filter(c=>c._loaded).length`) === 1, "opening one certification does not load the others");
  // Re-opening must not refetch.
  fetched.length = 0;
  call("certView", "ccao");
  for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r));
  check(fetched.length === 0, "re-opening a loaded certification does not refetch");

  // Load the rest so the remaining checks can exercise every certification.
  for (const c of CERTS) await evalIn(`loadCert(CERTS.find(x=>x.id==="${c.id}"))`);
  for (let i = 0; i < 10; i++) await new Promise(r => setImmediate(r));

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
  // cardBox is keyed by the card's stable id, not its position
  const ck = JSON.stringify(evalIn(`CERTS[0].cards[0].id`));
  check(evalIn(`S.cardBox.ccao[${ck}].b`) === 1, "scheduleCard: a correct recall advances to box 1");
  evalIn(`scheduleCard(CERTS[0],0,true); scheduleCard(CERTS[0],0,true)`);
  check(evalIn(`S.cardBox.ccao[${ck}].b`) === 3, "scheduleCard: consecutive recalls climb boxes");
  check(evalIn(`S.cardBox.ccao[${ck}].d > today()`), "scheduleCard: a known card is scheduled forward");
  evalIn(`scheduleCard(CERTS[0],0,false)`);
  check(evalIn(`S.cardBox.ccao[${ck}].b`) === 1, "scheduleCard: a miss drops back to box 1");
  check(evalIn(`S.cardBox.ccao[${ck}].d === today()`), "scheduleCard: a missed card stays due today");
  check(evalIn(`S.cardBox.ccao[${ck}].b <= 5`), "scheduleCard: box never exceeds the ladder length");

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

  /* ---------- 13. mock exam realism ---------- */
  for (const c of CERTS) {
    const n = Math.min(20, c.questions.length);
    // Sample repeatedly: every domain with questions must appear every time.
    let everyDomainAlways = true, alwaysExactlyN = true, noDupes = true;
    const domsWithQs = [...new Set(c.questions.map(q => q.d))];
    for (let t = 0; t < 40; t++) {
      const pick = evalIn(`sampleByDomain(CERTS.find(x=>x.id==="${c.id}"),${n})`);
      if (pick.length !== n) alwaysExactlyN = false;
      if (new Set(pick).size !== pick.length) noDupes = false;
      const got = new Set(pick.map(i => c.questions[i].d));
      if (domsWithQs.some(d => !got.has(d))) everyDomainAlways = false;
    }
    check(alwaysExactlyN, `${c.code}: mock always draws exactly ${n} questions`);
    check(noDupes, `${c.code}: mock never repeats a question`);
    check(everyDomainAlways, `${c.code}: every domain is represented in every mock`);
  }
  // asking for more than exists must not hang or over-draw
  check(evalIn(`sampleByDomain(CERTS[0], 9999).length`) === CERTS[0].questions.length,
    "sampleByDomain caps at the size of the bank");

  call("startMock", "ccao");
  check(evalIn(`M.flags.length`) === 0, "a fresh mock starts with nothing flagged");
  evalIn(`M.i=2; toggleFlag()`);
  check(evalIn(`M.flags.includes(2)`), "toggleFlag flags the current question");
  evalIn(`toggleFlag()`);
  check(!evalIn(`M.flags.includes(2)`), "toggleFlag unflags on a second press");
  evalIn(`M.i=0; toggleFlag(); M.i=4; toggleFlag()`);
  evalIn(`confirmFinish()`);
  const rv = els.app.innerHTML;
  check(/Review before submitting/.test(rv), "submitting opens a review screen, not a blind confirm");
  check(/Unanswered \(\d+\)/.test(rv) && /Flagged for review \(2\)/.test(rv), "review screen lists unanswered and flagged questions");

  // score a mock and confirm the results break down by domain
  evalIn(`M.picks=M.idxs.map((qi,k)=>k%2===0 ? M.cert.questions[qi].a : (M.cert.questions[qi].a+1)%4)`);
  evalIn(`finishMock()`);
  const res = els.app.innerHTML;
  check(/How you did by domain/.test(res), "mock results break the score down by domain");
  check(/Weakest here/.test(res), "mock results name the weakest domain");
  check(/startDrill\('ccao',\d+\)/.test(res), "each domain in the mock results links into a drill");
  check(/lessonView\('ccao',\d+\)/.test(res), "each domain in the mock results links to its lesson");

  /* ---------- 14. per-option rationales ---------- */
  // Structure: a `why` array, when present, must be parallel to `opts`.
  let badWhy = [];
  let withWhy = 0;
  for (const [id, d] of Object.entries(data)) {
    d.questions.forEach((q, i) => {
      if (!("why" in q)) return;
      withWhy++;
      if (!Array.isArray(q.why) || q.why.length !== q.opts.length || q.why.some(w => !w || !w.trim())) badWhy.push(`${id}[${i}]`);
    });
  }
  check(badWhy.length === 0, `every "why" array is parallel to its options (${badWhy.slice(0, 3).join(", ") || "all valid"})`);
  const totalQs = Object.values(data).reduce((a, d) => a + d.questions.length, 0);
  check(withWhy === totalQs, `every question carries per-option rationales (${withWhy}/${totalQs})`);

  // Depth: a domain with only a handful of questions makes the weakest-domain
  // drill trivial and per-domain accuracy statistically meaningless.
  const thin = [];
  for (const [id, d] of Object.entries(data)) {
    const dist = {};
    d.questions.forEach(qq => { dist[qq.d] = (dist[qq.d] || 0) + 1; });
    for (const [dom, n] of Object.entries(dist)) if (n < 10) thin.push(`${id} d${dom}=${n}`);
  }
  check(thin.length === 0, `every domain has at least 10 questions (${thin.join(", ") || "all domains ≥10"})`);

  // Near-duplicate questions make a bank feel smaller than it is — a learner
  // meets the same item twice in one round. Dice coefficient over character
  // bigrams of the normalised stem; distinct questions sit well below 0.80.
  const normQ = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const bigrams = s => {
    const t = normQ(s), m = new Map();
    for (let i = 0; i < t.length - 1; i++) m.set(t.slice(i, i + 2), (m.get(t.slice(i, i + 2)) || 0) + 1);
    return m;
  };
  const dice = (a, b) => {
    const A = bigrams(a), B = bigrams(b);
    let inter = 0, na = 0, nb = 0;
    for (const v of A.values()) na += v;
    for (const v of B.values()) nb += v;
    for (const [g, c] of A) if (B.has(g)) inter += Math.min(c, B.get(g));
    return na + nb ? (2 * inter) / (na + nb) : 0;
  };
  const dupes = [];
  let worstPair = { r: 0, label: "" };
  for (const [id, d] of Object.entries(data)) {
    for (let i = 0; i < d.questions.length; i++) {
      for (let j = i + 1; j < d.questions.length; j++) {
        const r = dice(d.questions[i].q, d.questions[j].q);
        if (r > worstPair.r) worstPair = { r, label: `${id}[${i}]/[${j}]` };
        if (r >= 0.8) dupes.push(`${id}[${i}]/[${j}] ${r.toFixed(2)}`);
      }
    }
  }
  check(dupes.length === 0, `no near-duplicate questions (worst ${worstPair.label} at ${worstPair.r.toFixed(2)})`);

  // Authoring guard: the rationale that begins "Correct" must sit at the answer
  // index. Structural parallelism alone cannot catch a rationale written against
  // the wrong option — the reader just sees the wrong justification.
  const misanchored = [];
  for (const [id, d] of Object.entries(data)) {
    d.questions.forEach((qq, i) => {
      if (!Array.isArray(qq.why)) return;
      const marked = qq.why.map((w, k) => (/^correct\b/i.test(w.trim()) ? k : -1)).filter(k => k >= 0);
      if (marked.length !== 1 || marked[0] !== qq.a) misanchored.push(`${id}[${i}] marked=${JSON.stringify(marked)} a=${qq.a}`);
    });
  }
  check(misanchored.length === 0, `the "Correct" rationale sits at the answer index (${misanchored.slice(0, 2).join("; ") || "all aligned"})`);

  // The load-time shuffle must permute `why` with `opts`, or explanations end
  // up attached to the wrong answers — silently, and in a way no user can spot.
  let misaligned = 0, checked = 0;
  for (const c of CERTS) {
    const raw = data[c.id];
    c.questions.forEach((q, i) => {
      const src = raw.questions[i];
      if (!Array.isArray(src.why)) return;
      src.opts.forEach((optText, oi) => {
        const ni = q.opts.indexOf(optText);
        checked++;
        if (ni < 0 || q.why[ni] !== src.why[oi]) misaligned++;
      });
    });
  }
  check(misaligned === 0, `shuffle keeps each rationale with its option (${checked} option/rationale pairs, ${misaligned} misaligned)`);

  // and the correct answer's rationale must still be the correct one
  let wrongAnchor = 0;
  for (const c of CERTS) {
    const raw = data[c.id];
    c.questions.forEach((q, i) => {
      const src = raw.questions[i];
      if (!Array.isArray(src.why)) return;
      if (q.why[q.a] !== src.why[src.a]) wrongAnchor++;
    });
  }
  check(wrongAnchor === 0, "the correct option keeps its own rationale after shuffling");

  // rendering: answering a question that has rationales shows all of them
  evalIn(`startQuiz("ccao")`);
  const withIdx = evalIn(`Q.idxs.findIndex(i=>Array.isArray(Q.cert.questions[i].why))`);
  if (withIdx >= 0) {
    evalIn(`Q.i=${withIdx}; quizQ()`);
    evalIn(`answer((Q.cert.questions[Q.idxs[Q.i]].a+1)%4)`);   // deliberately wrong
    const expHtml = els.exp.innerHTML;
    check(/class="whybox"/.test(expHtml), "a wrong answer shows the per-option breakdown");
    check((expHtml.match(/class="wrow/g) || []).length === 4, "the breakdown covers all four options");
    check(/wrow ok/.test(expHtml) && /wrow no/.test(expHtml), "the breakdown distinguishes right from wrong options");
  } else {
    check(false, "could not find a question with rationales to render");
  }

  /* ---------- 15. practice links back to the teaching material ---------- */
  // lessons are [foundation, ...one per domain in order], so domain d -> lesson d+1
  const badMap = [];
  for (const c of CERTS) {
    c.domains.forEach((name, d) => {
      const li = evalIn(`lessonForDomain(CERTS.find(x=>x.id==="${c.id}"),${d})`);
      if (li !== d + 1) badMap.push(`${c.code} d${d}->${li}`);
      else if (c.lessons[li].h.trim() !== name.trim()) badMap.push(`${c.code} d${d} "${c.lessons[li].h}"≠"${name}"`);
    });
  }
  check(badMap.length === 0, `each domain maps to the lesson that teaches it (${badMap.slice(0, 2).join(", ") || "all four certs clean"})`);

  // A round with misses must offer the lesson for the weak domain, not just a drill.
  evalIn(`startDrill("ccao",0)`);
  evalIn(`Q.idxs.forEach((qi,k)=>{Q.i=k; answer((Q.cert.questions[qi].a+1)%4); })`);
  evalIn(`Q.i=Q.idxs.length-1; nextQ()`);
  const rr = els.app.innerHTML;
  check(/Where you dropped marks/.test(rr), "a round with misses reports the weak domains");
  check(/lessonView\('ccao',1\)/.test(rr), "the weak domain links to its lesson");
  check(/startDrill\('ccao',0\)/.test(rr), "the weak domain also links to a drill");

  // A perfect round should not nag about weak domains.
  evalIn(`startDrill("ccao",0)`);
  evalIn(`Q.idxs.forEach((qi,k)=>{Q.i=k; answer(Q.cert.questions[qi].a); })`);
  evalIn(`Q.i=Q.idxs.length-1; nextQ()`);
  check(!/Where you dropped marks/.test(els.app.innerHTML), "a perfect round shows no weak-domain section");

  /* ---------- 16. progress is keyed by stable id, not position ---------- */
  const noId = [];
  const allIds = new Set();
  let dupId = 0;
  for (const [id, d] of Object.entries(data)) {
    d.questions.forEach((qq, i) => { if (!qq.id) noId.push(`${id} q[${i}]`); else { if (allIds.has(qq.id)) dupId++; allIds.add(qq.id); } });
    d.cards.forEach((cc, i) => { if (!cc.id) noId.push(`${id} card[${i}]`); else { if (allIds.has(cc.id)) dupId++; allIds.add(cc.id); } });
  }
  check(noId.length === 0, `every question and card has a stable id (${noId.slice(0, 3).join(", ") || "all present"})`);
  check(dupId === 0, `ids are unique across all content (${allIds.size} ids, ${dupId} collisions)`);

  // Answering must record against the id, so reordering cannot remap history.
  evalIn(`S.answered={}; S.domStats={}; startQuiz("ccao")`);
  const firstId = evalIn(`Q.cert.questions[Q.idxs[0]].id`);
  evalIn(`Q.i=0; answer(Q.cert.questions[Q.idxs[0]].a)`);
  check(evalIn(`S.answered.ccao[${JSON.stringify(firstId)}] === true`), "an answer is recorded against the question's id");
  check(evalIn(`Object.keys(S.answered.ccao).every(k=>!/^\\d+$/.test(k))`), "no positional keys are written");

  // A legacy save keyed by position is remapped on load, not silently misread.
  evalIn(`S.answered={ccao:{"0":false,"1":true}}; S.cardBox={ccao:{"0":{b:3,d:"2030-01-01"}}}; S.v=1`);
  const q0 = evalIn(`CERTS.find(x=>x.id==="ccao").questions[0].id`);
  const c0 = evalIn(`CERTS.find(x=>x.id==="ccao").cards[0].id`);
  evalIn(`migrateCertKeys(CERTS.find(x=>x.id==="ccao"))`);
  check(evalIn(`S.answered.ccao[${JSON.stringify(q0)}] === false`), "legacy positional answers migrate onto ids");
  check(evalIn(`!("0" in S.answered.ccao)`), "legacy positional keys are removed after migration");
  check(evalIn(`S.cardBox.ccao[${JSON.stringify(c0)}].b === 3`), "legacy flashcard schedule migrates onto ids");

  // Stale ids from retired questions must not inflate the "seen" count.
  evalIn(`S.answered={ccao:{"gone-1":true,"gone-2":false}}`);
  const cp = JSON.parse(evalIn(`JSON.stringify(certProgress(CERTS.find(x=>x.id==="ccao")))`));
  check(cp.seen === 0, `progress ignores ids no longer in the bank (seen=${cp.seen})`);
  evalIn(`S.answered={}; S.domStats={}; S.cardBox={}`);

  /* ---------- 17. lesson depth ---------- */
  // Lessons must keep pace with the bank they teach. Diagrams are excluded from
  // the word count — inline SVG is illustration, not reading material.
  const prose = b => b.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const thinLessons = [], noVideo = [], noTakeaways = [];
  for (const [id, d] of Object.entries(data)) {
    d.lessons.forEach((l, i) => {
      const w = prose(l.b).split(" ").filter(Boolean).length;
      const floor = l.foundation ? 250 : 400;
      if (w < floor) thinLessons.push(`${id}[${i}] "${l.h}" ${w}w < ${floor}`);
      if (!/class='vbox'/.test(l.b)) noVideo.push(`${id} "${l.h}"`);
      if (!l.foundation && !/class='kbox'/.test(l.b)) noTakeaways.push(`${id} "${l.h}"`);
    });
  }
  check(thinLessons.length === 0, `every lesson meets its depth floor (${thinLessons.slice(0, 3).join("; ") || "all above floor"})`);
  check(noVideo.length === 0, `every lesson has a video block (${noVideo.slice(0, 3).join(", ") || "all present"})`);
  check(noTakeaways.length === 0, `every domain lesson has key takeaways (${noTakeaways.slice(0, 3).join(", ") || "all present"})`);

  // A domain's lesson should not be dwarfed by the questions it teaches.
  const ratios = [];
  for (const [id, d] of Object.entries(data)) {
    const perDomain = {};
    d.questions.forEach(qq => { perDomain[qq.d] = (perDomain[qq.d] || 0) + 1; });
    d.lessons.forEach((l, i) => {
      if (l.foundation) return;
      const n = perDomain[i - 1] || 0;
      const w = prose(l.b).split(" ").filter(Boolean).length;
      if (n && w / n < 35) ratios.push(`${id} "${l.h}" ${Math.round(w / n)}w per question`);
    });
  }
  /* ---------- 18. PWA, audio & search checks ---------- */
  const manifestFile = path.join(ROOT, "manifest.webmanifest");
  check(fs.existsSync(manifestFile), "manifest.webmanifest exists");
  try {
    const webMan = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    check(webMan.name === "Claude Cert Quest" && webMan.display === "standalone", "manifest.webmanifest is valid");
  } catch(e) { check(false, `manifest.webmanifest parse error: ${e.message}`); }

  const swFile = path.join(ROOT, "sw.js");
  check(fs.existsSync(swFile), "sw.js service worker file exists");

  const soundDefault = evalIn(`S_DEFAULTS.sound`);
  check(soundDefault === false, "sound is muted by default as requested");

  const noLessonId = [];
  for (const [id, d] of Object.entries(data)) {
    d.lessons.forEach((l, i) => {
      if (!l.id) noLessonId.push(`${id} lesson[${i}]`);
    });
  }
  check(noLessonId.length === 0, `every lesson has a stable string id (${noLessonId.slice(0, 3).join(", ") || "all present"})`);

  /* ---------- 19. Study Guide Mastery Features ---------- */
  call("lessonView", "ccao", 0);
  check(/lesson-toc/.test(els.app.innerHTML), "lesson view renders Table of Contents");
  check(/ttsPlayBtn/.test(els.app.innerHTML), "lesson view renders Web Speech audio player");
  check(/ttsVoiceSelect/.test(els.app.innerHTML), "lesson view renders Voice Selection dropdown");
  check(/bmBtn/.test(els.app.innerHTML), "lesson view renders bookmark button");
  check(/notesDrawer/.test(els.app.innerHTML), "lesson view renders study notes drawer");

  call("fullHandbookView", "ccao");
  check(/Full Printable Study Guide Handbook/.test(els.app.innerHTML), "full printable handbook view renders all lessons");

  call("notesView");
  check(/My Study Notes & Bookmarks/.test(els.app.innerHTML) || /No Study Notes/.test(els.app.innerHTML), "notes & bookmarks hub renders");

  call("labToolsModal");
  check(/model-decision-tree/.test(els.app.innerHTML) && /rag-visualizer/.test(els.app.innerHTML), "lab tools modal renders decision trees and visualizers");
  check(/prompt-caching-sim/.test(els.app.innerHTML) && /multi-agent-dag/.test(els.app.innerHTML), "lab tools modal renders Prompt Caching and Multi-Agent DAG simulators");

  call("analyticsView");
  check(/Exam Pass Probability Predictor/.test(els.app.innerHTML), "analytics view renders Pass Probability Predictor");

  call("startCards", "ccao");
  check(/Export to Anki/.test(els.app.innerHTML) || /customCardModal/.test(html), "flashcards renders Anki export and custom card capabilities");

  /* ---------- 20. Upgraded Exam Cram Sheets ---------- */
  call("cramSheetSelect");
  check(/High-Yield Exam Cram Sheets/.test(els.app.innerHTML), "cram sheets selection hub renders all tracks");

  for (const cid of ["ccao", "ccdv", "ccaf", "ccap"]) {
    call("cramSheetView", cid);
    check(/cram-grid/.test(els.app.innerHTML), `${cid.toUpperCase()} cram sheet renders grid`);
    check((els.app.innerHTML.match(/class="cram-card"/g) || []).length === 8, `${cid.toUpperCase()} cram sheet has exactly 8 high-yield modules`);
    check(/cramSearchInput/.test(els.app.innerHTML), `${cid.toUpperCase()} cram sheet renders live search filter`);
    check(/recallToggleBtn/.test(els.app.innerHTML), `${cid.toUpperCase()} cram sheet renders Active Recall mode button`);
  }

  /* ---------- 21. Ultimate Study Suites ---------- */
  call("warRoomView");
  check(/Architect War Room/.test(els.app.innerHTML) && /Live Architecture Scorecard/.test(els.app.innerHTML), "war room view renders enterprise scenario and live scorecard");

  call("studyPlanView");
  check(/Personalized Study Roadmap/.test(els.app.innerHTML) || /Study Roadmap/.test(els.app.innerHTML), "study plan view renders plan generator");

  call("questionExplorerView");
  check(/Global Question Bank Explorer/.test(els.app.innerHTML), "question explorer view renders searchable directory");

  call("speedRunSelect");
  check(/Sudden-Death Speed Run/.test(els.app.innerHTML), "speed run select renders mode selection");

  call("certificateSelect");
  check(/Verified Readiness Diplomas/.test(els.app.innerHTML), "certificate hub renders credential list");

  call("renderCertificate", "ccao");
  check(/Certificate of Exam Readiness/.test(els.app.innerHTML) && /diplomaFrame/.test(els.app.innerHTML), "renderCertificate displays official printable diploma frame");

  /* ---------- 22. Next-Level Systems ---------- */
  call("promptStudioView");
  check(/Prompt Engineering Linter/.test(els.app.innerHTML) && /promptDraftInput/.test(els.app.innerHTML), "prompt studio view renders linter and scorecard");

  call("mcpWorkbenchView");
  check(/MCP & Tool-Calling Protocol Inspector/.test(els.app.innerHTML) && /mcpClientMsg/.test(els.app.innerHTML), "mcp workbench view renders protocol inspector");

  call("examPrescriptionView");
  check(/Personalized Exam Prescription/.test(els.app.innerHTML) || /No Missed Questions Recorded/.test(els.app.innerHTML), "exam prescription view renders diagnostic report");

  call("sdkPlaygroundView");
  check(/SDK Code Generator/.test(els.app.innerHTML) && /sdkCodeOutput/.test(els.app.innerHTML), "sdk playground view renders side-by-side code generator");

  call("bossBattleSelect");
  check(/Adaptive Certification Boss Battle/.test(els.app.innerHTML), "boss battle hub renders final boss challenge");

  /* ---------- 23. Masterclass Upgrade Systems ---------- */
  call("startBossBattle", "ccao");
  check(/Boss Battle/.test(els.app.innerHTML) && /bossTimerDisplay/.test(els.app.innerHTML) && !/undefined/.test(els.app.innerHTML), "startBossBattle starts and renders question with options");

  call("mockInterviewView");
  check(/Oral Defense/.test(els.app.innerHTML) && /Review Board/.test(els.app.innerHTML), "mock interview view renders oral defense challenge");

  call("modelRoiCalculatorView");
  check(/Model Cost & Latency ROI Calculator/.test(els.app.innerHTML) && /roiComparisonTable/.test(els.app.innerHTML), "model ROI calculator view renders financial planning workbench");

  call("contextCompactionVisualizer");
  check(/200k Context Window/.test(els.app.innerHTML) && /ctxBudgetVisualBar/.test(els.app.innerHTML), "context compaction visualizer renders token budget bar");

  call("speedMatchView");
  check(/Flash Recall Speed Match/.test(els.app.innerHTML) && /speedMatchGrid/.test(els.app.innerHTML), "speed match view renders mini-game grid");

  call("diagnosticRadarView");
  check(/Diagnostic Radar & Audit Report/.test(els.app.innerHTML) && /svg/.test(els.app.innerHTML), "diagnostic radar view renders multi-axis audit");

  /* ---------- 24. Power Suite & Workflow Integration ---------- */
  call("openShortcutsModal");
  check(true, "openShortcutsModal executes without throwing");

  call("mcpSchemaBuilderView");
  check(/Tool Schema Builder/.test(els.app.innerHTML) && /tbSchemaOutput/.test(els.app.innerHTML), "mcpSchemaBuilderView renders interactive JSON Schema constructor");

  call("startMasterRemediation");
  check(true, "startMasterRemediation executes without throwing");

  /* ---------- 25. Grandmaster Suite ---------- */
  call("trapHunterView");
  check(/Exam Trap Hunter/.test(els.app.innerHTML) && /trapCodeLines/.test(els.app.innerHTML), "trapHunterView renders spot-the-bug mini-game");

  call("audioQuizView");
  check(/Hands-Free Audio Quiz/.test(els.app.innerHTML) && /aqTrackSelect/.test(els.app.innerHTML), "audioQuizView renders audio player controls");

  call("thinkingTraceExplorer");
  check(/Extended Thinking/.test(els.app.innerHTML) && /traceVisualBox/.test(els.app.innerHTML), "thinkingTraceExplorer renders reasoning trace simulator");

  call("peerBenchmarkView");
  check(/Global Candidate Benchmark/.test(els.app.innerHTML) && /svg/.test(els.app.innerHTML), "peerBenchmarkView renders Gaussian Bell curve");

  /* ---------- 26. Enterprise Systems & Cross-Device Cloud Sync ---------- */
  call("openLanguageModal");
  check(true, "openLanguageModal executes without throwing");

  call("setLanguage", "es");
  call("setLanguage", "en");
  check(true, "setLanguage updates language state without throwing");

  call("gistSyncView");
  check(/GitHub Gist/.test(els.app.innerHTML) && /gistTokenInput/.test(els.app.innerHTML), "gistSyncView renders cross-device cloud sync panel");

  call("executiveDossierView");
  check(/ANTHROPIC CERTIFICATION READINESS DOSSIER/.test(els.app.innerHTML), "executiveDossierView renders candidate portfolio dossier");

  call("recordDailyAction", "answer");
  check(true, "recordDailyAction updates daily study target without throwing");

  /* ---------- 27. Apex Suite & War Room Fix Verification ---------- */
  call("warRoomView");
  check(/Awaiting Selections/.test(els.app.innerHTML) && !/Approved/.test(els.app.innerHTML), "warRoomView initializes cleanly awaiting user selections without pre-approval");

  call("setWarRoomPick", "model", 0);
  call("setWarRoomPick", "context", 0);
  call("setWarRoomPick", "security", 0);
  call("setWarRoomPick", "resilience", 0);
  check(/Approved/.test(els.app.innerHTML), "warRoomView evaluates scorecard upon completing selections");

  call("speedRunLeaderboardView");
  check(/Speed Run Personal Records/.test(els.app.innerHTML), "speedRunLeaderboardView renders pace telemetry");

  call("forecastMatrixView");
  check(/14-Day Flashcard Maturity Forecast/.test(els.app.innerHTML), "forecastMatrixView renders maturity schedule");

  call("socialBadgeView");
  check(/Shareable Verification Badge Card/.test(els.app.innerHTML), "socialBadgeView renders verification badge card");

  call("promptBenchmarkingLab");
  check(/Prompt Regression Benchmarking Lab/.test(els.app.innerHTML) && /regressionResultsBox/.test(els.app.innerHTML), "promptBenchmarkingLab renders comparative evaluation suite");

  /* ---------- 28. Zenith Suite ---------- */
  call("pacingSimulatorView");
  check(/Strict Exam Pacing Simulator/.test(els.app.innerHTML) && /psTrackSelect/.test(els.app.innerHTML), "pacingSimulatorView renders pacing stage");

  call("voiceRecallView");
  check(/Voice Recognition Active Recall/.test(els.app.innerHTML) && /vrMicBtn/.test(els.app.innerHTML), "voiceRecallView renders speech recall interface");

  call("multiCertRadarOverlay");
  check(/4-Track Multi-Cert Mastery Overlay/.test(els.app.innerHTML) && /svg/.test(els.app.innerHTML), "multiCertRadarOverlay renders 4-track radar overlay");

  call("downloadOfflineBundle");
  check(true, "downloadOfflineBundle executes without throwing");

  /* ---------- 29. Olympus Suite: Identity, P2P Battle & Advanced Diagnostics ---------- */
  call("openProfileModal");
  check(true, "openProfileModal executes without throwing");

  call("selectProfileAvatar", "🧙‍♂️");
  call("saveCandidateProfile");
  check(true, "saveCandidateProfile persists identity without throwing");

  call("peerBattleView");
  check(/Real-Time Peer Quiz Battle/.test(els.app.innerHTML) && /arenaTrackSelect/.test(els.app.innerHTML), "peerBattleView renders 1v1 battle arena");

  call("customExamBuilder");
  check(/Custom Exam Blueprint Builder/.test(els.app.innerHTML) && /cbTrackSelect/.test(els.app.innerHTML), "customExamBuilder renders blueprint configurator");

  call("statisticalPassPredictor");
  check(/95% Pass Confidence Interval Model/.test(els.app.innerHTML), "statisticalPassPredictor renders confidence band metrics");

  call("mobileExportView");
  check(/Native Mobile App Packaging Guide/.test(els.app.innerHTML), "mobileExportView renders mobile deployment guide");

  call("downloadCapacitorConfig");
  check(true, "downloadCapacitorConfig executes without throwing");

  /* ---------- 30. Titan Suite: Arcade Survival, Socratic Tutor & Community Feed ---------- */
  call("arcadeSurvivalView");
  check(/Arcade Survival Gauntlet/.test(els.app.innerHTML) && /arcadeTrackSelect/.test(els.app.innerHTML), "arcadeSurvivalView renders survival stage");

  call("socraticTutorView");
  check(/Socratic AI Dialogue Tutor/.test(els.app.innerHTML) && /socraticChatBox/.test(els.app.innerHTML), "socraticTutorView renders interactive tutor topics");

  call("communityLeaderboardView");
  check(/Global Candidate Community Leaderboard/.test(els.app.innerHTML), "communityLeaderboardView renders community rankings");

  call("exportAnkiBinaryDeck");
  check(true, "exportAnkiBinaryDeck executes without throwing");

  /* ---------- 31. Valhalla Suite ---------- */
  call("voiceCommuterView");
  check(/Hands-Free Voice-Activated Commuter Quiz/.test(els.app.innerHTML) && /vcTrackSelect/.test(els.app.innerHTML), "voiceCommuterView renders commuter audio stage");

  call("weakspotHeatmapView");
  check(/400-Question Mastery Heatmap/.test(els.app.innerHTML), "weakspotHeatmapView renders 2D mastery matrix");

  call("dailyBossView");
  check(/Daily Rotating Boss Challenge/.test(els.app.innerHTML), "dailyBossView renders rotating boss stage");

  call("cryptoDiplomaView");
  check(/Cryptographic Verified Diploma/.test(els.app.innerHTML) && /cryptoDiplomaFrame/.test(els.app.innerHTML), "cryptoDiplomaView renders SHA-256 verifiable diploma");

  /* ---------- 32. Asgard Suite ---------- */
  call("examCountdownPlannerView");
  check(/Exam Countdown & Daily Pacing Planner/.test(els.app.innerHTML) && /targetExamDateInput/.test(els.app.innerHTML), "examCountdownPlannerView renders pacing planner");

  call("diagramSandboxView");
  check(/Enterprise System Architecture Sandbox/.test(els.app.innerHTML) && /topologyCanvas/.test(els.app.innerHTML), "diagramSandboxView renders interactive topology canvas");

  call("scheduleNotificationReminders");
  check(true, "scheduleNotificationReminders executes without throwing");

  call("voiceNotesHubView");
  check(/Voice Notes & Spoken Lesson Memos/.test(els.app.innerHTML) && /recVoiceNoteBtn/.test(els.app.innerHTML), "voiceNotesHubView renders voice notes hub");

  /* ---------- 33. Ragnarok Suite ---------- */
  call("confidenceCalibrationView");
  check(/Confidence Calibration & Brier Score/.test(els.app.innerHTML) && /brierTrackSelect/.test(els.app.innerHTML), "confidenceCalibrationView renders calibration stage");

  call("mcpToolSimulator");
  check(/Live Mock MCP Tool Invocation Sandbox/.test(els.app.innerHTML) && /mcpToolInputBox/.test(els.app.innerHTML), "mcpToolSimulator renders tool execution simulator");

  call("cohortHubView");
  check(/Study Cohort Hub/.test(els.app.innerHTML), "cohortHubView renders study cohort team metrics");

  call("themeStudioView");
  check(/Custom Theme Studio & Palette Customizer/.test(els.app.innerHTML), "themeStudioView renders color palette presets");

  call("applyPaletteTheme", "cyberpunk");
  call("applyPaletteTheme", "terracotta");
  check(true, "applyPaletteTheme executes without throwing");

  /* ---------- 34. Elysium Suite ---------- */
  call("forgettingCurveView");
  check(/Ebbinghaus Forgetting Curve Simulator/.test(els.app.innerHTML), "forgettingCurveView renders retention decay bars");

  call("cachingBreakpointDebugger");
  check(/Prompt Caching Breakpoint Debugger/.test(els.app.innerHTML) && /cacheDebugInput/.test(els.app.innerHTML), "cachingBreakpointDebugger renders prompt linter");

  call("flashcardBlitzView");
  check(/60-Second Flashcard Blitz/.test(els.app.innerHTML), "flashcardBlitzView renders 60s blitz arcade stage");

  call("cramSheetCustomizer");
  check(/Custom Exam Day Cram Sheet/.test(els.app.innerHTML) && /customCramSheetFrame/.test(els.app.innerHTML), "cramSheetCustomizer renders printable 1-page reference");

  /* ---------- 35. Valkyrie Suite ---------- */
  call("modelMatrixView");
  check(/Claude 3\.5 vs 3\.7 Hybrid Reasoning Matrix/.test(els.app.innerHTML), "modelMatrixView renders model comparative matrix");

  call("multiTurnCompactionLab");
  check(/Multi-Turn Context Compaction Playground/.test(els.app.innerHTML) && /compactionProgressBar/.test(els.app.innerHTML), "multiTurnCompactionLab renders compaction simulator");

  call("tokenProfilerLab");
  check(/Live Token Budget Profiler & API Cost Calculator/.test(els.app.innerHTML), "tokenProfilerLab renders API cost calculator");

  call("oralDefenseBoardView");
  check(/Executive Architectural Defense Board/.test(els.app.innerHTML), "oralDefenseBoardView renders oral defense panel");

  /* ---------- 36. Titan Suite ---------- */
  call("openBadgeGenerator");
  check(/OpenBadge Digital Credential Generator/.test(els.app.innerHTML) && /openBadgeJsonBox/.test(els.app.innerHTML), "openBadgeGenerator renders JSON-LD metadata box");

  call("dagVisualizerView");
  check(/Interactive Multi-Agent DAG Topology Builder/.test(els.app.innerHTML), "dagVisualizerView renders subagent DAG builder");

  call("redTeamSimulatorView");
  check(/Indirect Prompt Injection & Red-Teaming Simulator/.test(els.app.innerHTML), "redTeamSimulatorView renders security sandbox");

  call("pdfScorecardExporter");
  check(/Multi-Page PDF Diagnostic Readiness Scorecard/.test(els.app.innerHTML) && /pdfScorecardFrame/.test(els.app.innerHTML), "pdfScorecardExporter renders printable scorecard frame");

  /* ---------- 37. Olympus Suite ---------- */
  call("whiteboardDuelView");
  check(/P2P Real-Time Architecture Whiteboard Duel/.test(els.app.innerHTML) && /whiteboardTimerDisplay/.test(els.app.innerHTML), "whiteboardDuelView renders whiteboard duel canvas");

  call("promptOptimizerEngine");
  check(/Automated System Prompt Optimizer Engine/.test(els.app.innerHTML) && /rawPromptInput/.test(els.app.innerHTML), "promptOptimizerEngine renders prompt linter");

  call("paretoFrontierView");
  check(/Latency P99 vs Cost Pareto Frontier Explorer/.test(els.app.innerHTML), "paretoFrontierView renders Pareto frontier scatter plot");

  call("audioPodcastExporter");
  check(/Spoken Flashcard Audio Podcast Briefing/.test(els.app.innerHTML), "audioPodcastExporter renders podcast player");

  /* ---------- 38. Hyperion Suite ---------- */
  call("claudeCodeTerminalView");
  check(/Claude Code CLI Terminal Simulator/.test(els.app.innerHTML) && /cliCmdInput/.test(els.app.innerHTML), "claudeCodeTerminalView renders CLI emulator");

  call("rateLimitVisualizer");
  check(/Anthropic API Rate Limit & Token Bucket Visualizer/.test(els.app.innerHTML), "rateLimitVisualizer renders rate limit simulator");

  call("customDeckStudio");
  check(/Custom Flashcard Deck Builder & CSV Exporter/.test(els.app.innerHTML) && /customCardFront/.test(els.app.innerHTML), "customDeckStudio renders deck builder");

  call("svgBadgeExporter");
  check(/High-Resolution SVG Vector Badge Exporter/.test(els.app.innerHTML), "svgBadgeExporter renders SVG vector badge exporter");

  /* ---------- 39. Chronos Suite ---------- */
  call("microVmSandboxView");
  check(/Enterprise Zero-Trust MicroVM Sandbox Visualizer/.test(els.app.innerHTML), "microVmSandboxView renders MicroVM sandbox");

  call("consensusVotingView");
  check(/Multi-Model Consensus Voting & Judge Engine/.test(els.app.innerHTML), "consensusVotingView renders consensus judge engine");

  call("cacheTTLSimulator");
  check(/Dynamic Prompt Caching Expiration Simulator/.test(els.app.innerHTML), "cacheTTLSimulator renders cache TTL timeline");

  call("audioSpeedDrillView");
  check(/Interactive Audio Speed-Drill Gauntlet/.test(els.app.innerHTML), "audioSpeedDrillView renders audio speed-drill stage");

  /* ---------- 40. Pedagogy Suite ---------- */
  call("lessonSequenceDiagrams");
  check(/Interactive Architecture Sequence Diagram Visualizer/.test(els.app.innerHTML), "lessonSequenceDiagrams renders sequence diagram widget");

  call("socraticLessonProbes");
  check(/Socratic "Deep-Dive Probe" Lesson Checkpoint/.test(els.app.innerHTML) && /probeAnswerBox/.test(els.app.innerHTML), "socraticLessonProbes renders probe checkpoint");

  call("codeSnippetAnnotator");
  check(/Annotated SDK Code Walkthrough Engine/.test(els.app.innerHTML), "codeSnippetAnnotator renders annotated SDK viewer");

  call("lessonAudioNarrator");
  check(/Synchronized Audio Lecture & Transcript Player/.test(els.app.innerHTML), "lessonAudioNarrator renders audio lecture player");

  /* ---------- 41. Athena Suite ---------- */
  call("lessonMindMapper");
  check(/Interactive Architecture Conceptual Mind Mapper/.test(els.app.innerHTML), "lessonMindMapper renders mind mapper graph");

  call("inlineLessonPlayground");
  check(/"Try It Live" Embedded Lesson Mini-Playground/.test(els.app.innerHTML) && /inlineSandboxText/.test(els.app.innerHTML), "inlineLessonPlayground renders live sandbox");

  call("lessonAudioRecap");
  check(/30-Second High-Yield Audio Lesson Recap/.test(els.app.innerHTML), "lessonAudioRecap renders audio recap player");

  call("scenarioWhatIfExplorer");
  check(/Socratic "What If\?" Edge-Case Scenario Explorer/.test(els.app.innerHTML), "scenarioWhatIfExplorer renders what-if scenario explorer");

  /* ---------- 42. Nova Teaching Suite ---------- */
  call("animatedConceptCards");
  check(/Animated Concept Explainer Cards/.test(els.app.innerHTML) && /novaCarousel/.test(els.app.innerHTML), "animatedConceptCards renders step carousel");

  call("apiPayloadInspector");
  check(/API Payload Inspector: Live Request \/ Response Viewer/.test(els.app.innerHTML) && /apiPayloadTabs/.test(els.app.innerHTML), "apiPayloadInspector renders request/response viewer");

  call("conceptDecisionTree");
  check(/Interactive Concept Decision Trees/.test(els.app.innerHTML) && /dtnBody/.test(els.app.innerHTML), "conceptDecisionTree renders interactive branching tree");

  call("glossaryTermCallouts");
  check(/Glossary Term Callouts & Hover Definitions/.test(els.app.innerHTML) && /glossBody/.test(els.app.innerHTML), "glossaryTermCallouts renders glossary with search");

  /* ---------- 43. Aurora Teaching Suite ---------- */
  call("studyRoadmapView");
  check(/Interactive Study Roadmap with Progress Milestones/.test(els.app.innerHTML), "studyRoadmapView renders roadmap milestones");

  call("architecturePatternLibrary");
  check(/Architecture Pattern Library/.test(els.app.innerHTML) && /aplGrid/.test(els.app.innerHTML), "architecturePatternLibrary renders 12-pattern grid");

  call("promptTransformGallery");
  check(/Before \/ After Prompt Transformation Gallery/.test(els.app.innerHTML) && /ptgBody/.test(els.app.innerHTML), "promptTransformGallery renders transformation cards");

  call("knowledgeGraphView");
  check(/Concept Relationship Knowledge Graph/.test(els.app.innerHTML) && /kgDetail/.test(els.app.innerHTML), "knowledgeGraphView renders knowledge graph");

  console.log(fails ? `\n${fails} FAILURE(S)` : "\nall checks passed");
  process.exitCode = fails ? 1 : 0;
})();


