# Claude Cert Quest 🧭

[![Anthropic Certifications](https://img.shields.io/badge/Anthropic-Certifications%20Prep-d97757.svg)](https://www.pearsonvue.com/us/en/anthropic.html)
[![Offline Ready](https://img.shields.io/badge/PWA-Offline%20Ready%20(v35)-5a9e6f.svg)](https://jjuhric.github.io/claude_study_guide/)
[![Tests](https://img.shields.io/badge/Tests-413%20Passing-5b7fa6.svg)](test/smoke.js)
[![License](https://img.shields.io/badge/License-MIT-8a6fae.svg)](LICENSE)

A gamified study platform for the **Anthropic Claude Certification Program**:
**400 practice questions** with per-option rationales, **100 spaced-repetition
flashcards**, **44 lessons**, and **76 interactive labs and simulators** — all
reachable from the dashboard.

Content depth is measured, not asserted: answer explanations average **92 words**
(none below 74), flashcard backs average **56** (none below 46), and the lessons
total roughly **39,000 words**. Every Claude fact in the app traces to
[`docs/FACTS.md`](docs/FACTS.md), and the test suite fails when app content
disagrees with it.

**Live:** https://jjuhric.github.io/claude_study_guide/

> **Unofficial.** Not affiliated with or endorsed by Anthropic. Every question,
> lesson, and sandbox is original practice material — **not** real exam content.
> Exam format, domain weightings, and passing scores are published only in the
> official exam guides inside **Anthropic Partner Academy**. Verify there before
> relying on any figure shown here — see [Accuracy policy](#-accuracy-policy).

---

## 🎯 Certifications covered

| Code | Certification | Audience | Price |
| :--- | :--- | :--- | :--- |
| **CCAO-F** | Claude Certified Associate – Foundations | Consultants, sellers, delivery leads | $99 |
| **CCDV-F** | Claude Certified Developer – Foundations | Engineers building with the API, Claude Code, MCP | $125 |
| **CCAR-F** | Claude Certified Architect – Foundations | Solutions architects designing Claude systems | $125 |
| **CCAR-P** | Claude Certified Architect – Professional | Principal architects, production scale | $175 |

Names, codes, prices, and audiences are confirmed against Anthropic's public
Pearson VUE and Skilljar listings. Each certification has **100 questions and
25 flashcards**, with at least 10 questions per domain.

---

## 📚 How to study with it

| Mode | What it's for |
|---|---|
| 📖 **Study Guide** | Written lessons per domain. Read these first — the questions assume the grounding. |
| ⚔️ **Quiz Battle** | 10 questions with instant explanations. Prioritises unseen questions, then ones you got wrong. |
| 🃏 **Flashcards** | Spaced repetition — only shows cards that are **due**. |
| ⏱️ **Mock Exam** | Timed and scored, sampled proportionally across domains, with flag-for-review. |
| 🎯 **Review Misses** | Serves only questions you have previously answered wrong. |
| 🩹 **Weakest Domain** | Drills whichever domain you score lowest in; untested domains come first. |

Plus **76 labs and simulators** in six collapsible dashboard sections — Labs &
Simulators, Practice & Testing, Diagnostics & Analytics, Reference & Study Aids,
Audio & Voice, and Credentials/Sync/Community. They start collapsed so the
certification cards stay in view; open one, use **Expand all**, or type in the
filter box, which expands whichever sections match.

**Spaced repetition.** Flashcards use Leitner boxes: recall a card and it moves
up a box and returns later (1 → 2 → 4 → 9 → 21 days); miss it and it drops to
box 1 and comes back immediately. When nothing is due, the app says so rather
than inviting pointless drilling — the spacing *is* the mechanism.

**Prep progress.** Each certification page shows one score blended from six
components (lessons read, question coverage, accuracy, domain breadth, card
retention, mock performance) and always names the weakest one. It measures
progress through *this app's* material — it is not a prediction about the real
exam.

**Keyboard.** `1`–`4` answer, `Enter`/`Space` advance. On flashcards, `Space`
flips, `1` is still-learning, `2` is knew-it. `Ctrl`/`Cmd`+`K` opens search.

---

## 💻 Running locally

Content loads from `data/*.json`, and browsers block `fetch()` on `file://`
URLs — so **opening `index.html` directly will not work**. Serve the folder:

```bash
python -m http.server 4173
```

Then open http://localhost:4173.

---

## 🗂️ Project layout

```
index.html               shell only: head, body markup, ordered <script src> tags
css/app.css              all styles
js/00-data.js            certifications, badges, titles
js/01-state.js           state, persistence, theme, backup
js/02-ui.js              UI helpers, audio, search, analytics
js/03-home.js            dashboard, tool registry, cert view
js/04-study.js           lessons, handbook, notes, cram sheets
js/05-labs.js            simulators, studios, workbenches
js/06-practice.js        timed modes, drills, mini-games
js/07-progress.js        sync, profile, planning, reporting
js/08-tools.js           arcade, community, voice, calibration
js/09-suites.js          teaching suites and widgets
js/10-quiz.js            quiz, flashcards, mock exam
js/11-boot.js            relocated init + content loader (loads last)
docs/FACTS.md            verified Claude API facts; the source every fact cites
data/manifest.json       per-cert counts, loaded at boot for the home screen
data/<cert>.json         questions, flashcards, and lessons, one file per cert
tools/build-manifest.js  regenerates the manifest from the content files
tools/check-lesson-lengths.js  prints per-lesson word counts
test/smoke.js            dependency-free offline test suite
test/links.js            checks recommended videos are still live
sw.js                    service worker (offline PWA cache)
manifest.webmanifest     PWA install metadata
```

**These are classic scripts, not ES modules.** The app uses ~470 inline event
handlers (`onclick="foo()"`) that resolve against **global scope**. Module scope
would break every one of them. All files share one global scope, in the order
`index.html` lists them — so **load order matters**, and `11-boot.js` must stay
last.

**Anything that runs at load time belongs in `11-boot.js`.** Each file hoists
only its own declarations, so init code that calls a function defined in a later
file will throw. The test suite loads the files in declared order specifically
so it catches this.

Certification content loads **on demand**: a first visit fetches only the
manifest and the shell; a bank arrives when you open that certification.

---

## 🧪 Tests

No dependencies. `smoke.js` boots the app in a VM with a DOM shim, loading
`js/*.js` in the same order the browser does, then renders every screen for
every certification. Runs offline:

```bash
node test/smoke.js
```

`links.js` checks every recommended video against YouTube's oEmbed endpoint and
reports any that have been deleted, with the lesson referencing them. It needs
the network, so it is kept separate — run it periodically:

```bash
node test/links.js
```

### What the suite enforces

- Every module parses, is listed in `index.html`, and is cached by `sw.js`
- Saved state of the wrong shape cannot crash or silently become `NaN`
- Every `S.<key>` the app reads is initialised, and no function is defined twice
- Every registered tool resolves to a real function and renders a dashboard card
- **Every zero-argument tool view is reachable from the dashboard** — the check
  that caught 64 tools with no UI entry point
- **Every Claude fact matches [`docs/FACTS.md`](docs/FACTS.md)** — an
  allow-list, not a denylist, so a model id, display name, per-1M rate, or
  server-tool version string that is not current fails the build rather than
  ageing quietly. Bare numeric rate fields are checked too; a second pricing
  table hid stale Opus rates from the dollar-prefixed check for a full phase
- `budget_tokens` never appears beside a model that rejects it without saying
  so, and the shift to adaptive thinking is taught rather than silently erased
- Error tables list only status codes Anthropic actually returns, and all seven
  `stop_reason` values are covered
- No invented metrics: latency percentiles (Anthropic publishes none) and cost
  multiples wider than the lineup's own 10x spread both fail
- The FinOps calculator is pinned to figures computed by hand from the rate
  card, so its arithmetic breaks the build rather than misleading a reader
- Unverified exam figures may appear only alongside an explicit hedge
- No near-duplicate questions; every domain has at least 10
- Per-option rationales stay aligned with their options through the shuffle
- Lessons clear a word floor (850, or 600 for a foundation lesson and 400 for a
  masterclass), keep pace with the domain they teach at ≥40 words per question
  it covers (not just an overall floor — a lesson can clear that and still be
  thin if its domain outgrew it), and have a video block and takeaways
- Every question, card and **lesson** is keyed by a stable id, not array
  position — reordering or inserting content cannot silently reattach a
  learner's saved progress to the wrong item; a legacy position-keyed save
  migrates onto ids the first time it loads
- Answer explanations clear 60 words, per-option rationales 10, flashcard backs
  40 — the floors that stop depth regressing once it has been added
- The Batches API's real limit (100,000 requests / 256MB) is enforced app-wide
  — a stale 10,000/32MB figure turned up five separate times despite an
  earlier phase's changelog claiming it was already fixed everywhere
- No context-window figure states 200K as if it applied to every current
  model — Haiku 4.5 is the exception, not the rule, and this was wrong in
  three lessons and two tools under wording specific enough to dodge the
  first version of this check
- No retired Claude 3-generation model is described as current
- Every modal opener puts a *visible* overlay on the page, with a way to close it
- Font modes name the face they will really render in, not the one they are called

---

## ✍️ Contributing content

### Adding questions

Questions live in `data/<cert-id>.json`:

```json
{
  "id": "ccaoq-380ef56e",
  "d": 0,
  "q": "Question text",
  "opts": ["A", "B", "C", "D"],
  "a": 1,
  "exp": "Why the correct answer is correct.",
  "why": ["Why A is wrong.", "Correct. Why B is right.", "…", "…"]
}
```

- `d` indexes into that certification's `domains` array in `js/00-data.js`
- `a` indexes into `opts`; option order is shuffled at load and `why` is
  permuted with it, so the authored position does not matter
- Write the correct option's `why` entry starting with **"Correct."** — the
  suite verifies it sits at the answer index
- Give every new entry an `id` by hand: `<cert><q|c>-<8 hex>`, e.g.
  `ccaoq-380ef56e` for a question, `ccaoc-0d1d2a7c` for a card. Progress is
  keyed by id, so **never change or reuse one** — editing a question in place
  keeps its history, and a collision silently merges two questions' records.
  The suite fails on a missing or duplicate id.
- Then regenerate the manifest, which the home screen's counts come from:

```bash
node tools/build-manifest.js
```

Lesson depth is checked separately — `node tools/check-lesson-lengths.js` prints
every lesson's word count, so a thin lesson is visible before the suite fails it.

**Never write a Claude fact from memory.** Model ids, prices, context windows,
parameter shapes, cache minimums, tool version strings and status codes all
drift, and the plausible-sounding version is usually last year's. Look it up,
record it in [`docs/FACTS.md`](docs/FACTS.md) with its source, and cite that.
The suite checks app content against the fact sheet, so an uncited fact that
happens to be wrong fails the build — but only for facts the sheet covers, and
it cannot catch a figure derived from one. Anthropic publishes no latency
figures at all: if you cannot cite it, do not state it.

### Adding a tool

1. Write the view function (zero arguments, renders into `$("app")`)
2. Register it in the `TOOLS` array in `js/03-home.js`
3. Run `node test/smoke.js` — it fails if a tool view exists but is unreachable

### Adding a modal

Build the overlay and append it when you want it shown; the `.modal-overlay`
class is visible by default. Give it an id and a control that calls
`document.getElementById('<id>').remove()`, or it is a full-screen fixed layer
with no way out. The suite checks both.

### Anything that runs at load time

Put it in `js/11-boot.js`. Each file hoists only its own declarations, so init
code in an earlier file that calls a function defined in a later one throws at
boot. The suite loads the files in declared order to catch exactly this.

---

## 🧾 Accuracy policy

This app prepares people for a **real, paid** certification, so a
confident-sounding invention costs someone real study time. An earlier version
of this material stated precise exam facts — `60 questions · 120 min · pass
720/1000`, and domain weightings of `27% · 20% · 20% · 18% · 15%` — that came
from no source at all. Precise-but-invented weightings are worse than none: a
learner allocates study time by them.

Four rules, all enforced by `test/smoke.js`:

1. **Never state an exam figure as fact.** Question counts, time limits, and
   pass marks are corroborated only by third-party study sites, never by
   Anthropic, so they may appear only next to an explicit hedge. Domain
   weightings have no corroboration at all and are not stated anywhere.
2. **Never name a retired or non-existent model.** Every Claude 3.x model is
   retired and 404s. `Claude 3.5 Opus` never existed — that one was a
   fabrication, not staleness.
3. **Label this app's own constructs as its own.** The study domains are *this
   app's* groupings; the 720 mock threshold is *this app's* practice benchmark,
   not an official pass mark. Prep progress measures progress through this
   material and is not a prediction about the exam.
4. **Keep every question original.** Pearson VUE exams are under NDA;
   reproducing real items is braindumping, and it gets candidates decertified.

Only facts confirmed on Anthropic's public Pearson VUE and Skilljar pages are
stated plainly: the four exam names, their codes, the prices, the target
audiences, and the retake policy.

## 🚧 Known gaps

- **Domains are unvalidated.** The per-certification domain lists are this
  project's own groupings, never reconciled against the official blueprints —
  those live inside **Anthropic Partner Academy**, which needs Claude Partner
  Network membership. Anyone with that access should pull the official guides
  and reconcile; it is the highest-value work left.
- **Single user, one browser.** Progress lives in `localStorage` under the key
  `certquest`. There are no accounts and no sync, so clearing site data wipes
  it — **Export Backup** is the only safety net. Multi-user support needs an
  auth and storage tier (Supabase is the intended shape) that does not exist yet.

---

## 📜 License

MIT — see [LICENSE](LICENSE).
