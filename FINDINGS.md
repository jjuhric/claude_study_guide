# Claude Cert Quest — Findings

Reviewed: `index.html` (1400 lines, single-file HTML/CSS/JS, localStorage-only)
Date: 2026-08-10

## Project goal (as confirmed)

A working study tool for the **real** Anthropic Claude Certification Program
(Pearson VUE-administered, Credly badges), covering the four live exams:

- Claude Certified Associate – Foundations (**CCAO-F**)
- Claude Certified Developer – Foundations (**CCDV-F**)
- Claude Certified Architect – Foundations (**CCAR-F**)
- Claude Certified Architect – Professional (**CCAR-P**)

Intended to eventually support **multiple users** and tie into **real exam
content**, not just run as a solo offline toy.

---

## Status

Architecture decided: **Supabase** (auth + Postgres) · **GitHub Pages** (hosting)
· **content extracted to versioned JSON**.

Done on 2026-08-10:

- Cert codes corrected to `CCAR-F` / `CCAR-P` (§1.3), blurbs matched to the
  official target audiences, prices verified
- All fabricated exam facts removed (§0)
- State-migration hardening (§3.1) and the shuffle's 4-option assumption (§3.3)
- Hosting live at https://jjuhric.github.io/claude_study_guide/
- Content extracted to `data/*.json`; `index.html` 193KB → 39KB
- `test/smoke.js` added — 62 checks, dependency-free

Still open: Supabase auth + progress sync (needs an account created by the
owner), content validation against the official blueprints (§0, blocked on
Partner Academy access), and question-bank size (§2).

---

## 0. Fabricated exam facts — FIXED

The most serious content problem found, and the reason it matters most: the app
asserted precise, authoritative-sounding facts about a **real, paid**
certification that could not be verified against any public source, and which
were confirmed to be AI-generated rather than drawn from an official guide.

Removed:

- `60 questions · 120 min · pass 720/1000`, shown in every cert header and
  asserted identically for all four exams
- CCAO-F domain weightings ("Output Evaluation (21%, heaviest)", "Governance &
  Risk (15%)")
- CCAR-F domain weightings (`27% · 20% · 20% · 18% · 15%`)
- CCAR-F format claims ("4 of 6 named scenarios, each framing ~15 questions")
- An entire lesson section headed "A note on the exam format" stating "The real
  CCA-F exam draws 4 of 6 possible scenarios… each anchoring about 15 questions"
- A flashcard presenting six invented scenario names as "The 6 exam scenarios"

These were replaced with honest framing: study groupings are labelled as *this
app's* groupings, the 720 mock threshold is labelled as *this app's practice
benchmark* rather than an official pass mark, and each card now points to the
official exam guide in Partner Academy for real figures. Only facts confirmed
on Anthropic's public Pearson VUE / Skilljar pages are still stated as fact:
the four exam names, the codes, the prices ($99/$125/$125/$175), the target
audiences, and the retake policy.

**Why this mattered:** precise-but-invented weightings are worse than no
weightings. A learner allocates study time by them, so a fabricated 27/20/20/18/15
split actively misdirects preparation for a $125 exam.

**Verification note:** exam format, weightings, and passing scores are published
only inside Anthropic Partner Academy, which requires Claude Partner Network
membership to access. They could not be checked from outside. Anyone with
partner access should pull the official guides and reconcile the app's study
domains against them — that remains the single highest-value content task.

---

## 1. Scope gaps vs. the goal (highest priority)

### 1.1 Single-user, browser-local only
Everything is stored in one browser's `localStorage` under the key
`certquest` (index.html:234-237). There is no account system, no backend, no
sync — progress lives and dies with one browser profile on one machine.
Clearing browser data wipes it. **This is the biggest gap against "support
multiple users"** — it's not a tweak, it's a missing architecture tier
(accounts, auth, a real data store, and a way to serve the app somewhere
users can reach it, since a local HTML file can't share state between
people).

### 1.2 Question/lesson content isn't sourced from the real exam
The footer explicitly says: *"Question content is original practice
material inspired by published exam blueprints"* (index.html:182). All 99
questions and 28 lessons appear to be invented content, not pulled from or
validated against Anthropic's actual exam domains/weighting. Since these are
confirmed real, paid certifications, there's currently no way to know if the
app's domain list, question difficulty, or topic coverage line up with what
the real exam actually tests.

### 1.3 Wrong certification codes — FIXED
The Architect certs are coded internally as `CCA-F` / `CCA-P`
(index.html:198, 202 — the `code` field in the `CERTS` array). Per the
official Pearson VUE listing, the real codes are **`CCAR-F`** / **`CCAR-P`**.
Easy fix, but worth catching before this is user-facing.

---

## 2. Content completeness

- **Question bank is thin relative to what the app itself claims.** The cert
  header text says the real exam is *"60 questions · 120 min · pass
  720/1000"* (index.html:361, also repeated in flashcard copy at 703, 746),
  but each cert only has 24–25 practice questions total, and Mock Exam mode
  only draws 20 of them for a 40-minute timed run (index.html:552,
  `n=Math.min(20,c.questions.length)`). As-is, the "mock exam" is a
  1/3-scale approximation of the real thing, and nothing in the UI reconciles
  that gap for the user.
- **`ccap` (Architect–Professional) has 24 questions vs. 25 for the other
  three certs** (index.html:760-785) — minor parity gap.
- **No mechanism to grow or refresh the pool.** `pickQuestions()`
  (index.html:436-444) cycles unseen → previously-wrong → everything else.
  With only ~24-25 questions per cert, a user running repeated 10-question
  quiz rounds exhausts the unique pool within 2-3 rounds and starts seeing
  repeats indefinitely, with no signal that they've seen everything.
- At least one of the 28 lessons has no video resource in its `.vbox` block
  (27 `.vbox` blocks found across 28 lessons) — minor, not individually
  tracked down.
- The 38 embedded YouTube links were format-checked only (well-formed
  `youtube.com/watch?v=<id>` URLs, no placeholders) — **not fetched**, so
  it's worth a manual spot-check that they're still live before relying on
  them.

---

## 3. Robustness / latent bugs

### 3.1 State migration gap — FIXED
On load, only 4 of the 9 fields on the saved state object get a defensive
fallback (index.html:239: `S.domStats`, `S.mocks`, `S.days`,
`S.lessonsRead`). The other 5 — `xp`, `badges`, `seenCerts`, `answered`,
`cardsSeen` — have none. Concretely, if a user's saved state predates a
future schema change and is missing one of these:

- missing `S.badges` → `award()` throws outright (index.html:261)
- missing `S.answered` → `certProgress()` throws (index.html:302)
- missing `S.xp` → `addXP()` silently produces `NaN`, corrupting the XP bar
  and every level-gated badge with no visible error (index.html:254)
- missing `S.cardsSeen` → silently becomes `NaN`, permanently breaking the
  `cards25` badge for that save (index.html:534)

There's no schema-version field either. This is latent today (only one
shipped schema exists so far) but will bite the first time the data model
changes under users who already have saved progress — worth hardening
*before* multiple people start relying on it.

### 3.2 No empty-state guard for quiz/flashcard/mock — FIXED
`startQuiz`/`quizQ`, `startCards`/`cardView`, and `startMock`/`mockQ` assume
`c.questions`/`c.cards` are non-empty. Currently true for all 4 certs, so
unreachable today — but if a 5th cert (or a real-content migration) ever
ships with an empty bank mid-rollout, these will throw a `TypeError` instead
of showing a friendly "no content yet" state.

### 3.3 Hardcoded 4-option assumption in the answer shuffle — FIXED
The final `<script>` block (index.html:1389-1396) shuffles each question's
options and correctly remaps the answer index — but it hardcodes
`idx=[0,1,2,3]` (line 1391), assuming exactly 4 options. Safe for all 99
questions today; would silently corrupt answer-index mapping (no error) if a
future question is ever authored with a different option count.

### 3.4 Streak badge timing
`streak3` is only evaluated once, at page load (index.html:240 →
`checkDayStreak()`). A user who crosses their 3rd consecutive study day
mid-session won't get the badge until their next reload. Minor, cosmetic.

---

## 4. Not a bug — flagging so it doesn't get "fixed" by mistake

In the raw question data, 92 of 99 questions have their correct answer
hardcoded to option B (`a:1`), and **none** are C or D. Read in isolation,
that looks like a serious scoring bug. It isn't: a Fisher–Yates shuffle at
the very end of the file (index.html:1389-1396) randomizes each question's
option order once per page load and correctly remaps the stored answer
index. What the user actually sees is a properly randomized A–D distribution.
Noting this because it's the kind of thing that looks broken until you read
all the way to the bottom of the file.

One related nuance: the shuffle runs once per page load, not once per
attempt — if a question resurfaces later in the same session (e.g. via the
wrong-answer-priority pool), its option order is identical to the first
time it was shown. Minor, not a scoring bug.

---

## 5. What's solid (no action needed)

A full cross-reference of the file found:
- No dead functions — every one of the 39 top-level functions has a live
  call site.
- No broken `onclick` handlers — every referenced function is defined.
- No unearnable badges — all 19 badges in `BADGES` have a reachable
  `award()` call site, including the dynamic per-cert `scholar_*` and
  `pass_*` variants.
- The 720+ mock-exam pass threshold is genuinely implemented
  (index.html:596-597), not just claimed in copy.
- No out-of-range domain (`d`) or answer (`a`) indices anywhere in the 99
  questions.
- No `TODO`/`FIXME`/`lorem ipsum`/`console.log`/`debugger`/placeholder URLs
  anywhere in the file.
- No cross-cert content duplication — each cert's questions/lessons are
  topically distinct and correctly scoped to its own domain list.

---

## 6. Priority order

1. ~~Decide the multi-user/backend architecture.~~ **Done** — Supabase +
   GitHub Pages + JSON content extraction.
2. **Source and validate content against the official exam guides** — blocked
   on Partner Academy access (§0). Until someone with Claude Partner Network
   membership pulls the real blueprints, the app's study domains remain
   unvalidated groupings. Highest-value remaining content task.
3. ~~Fix the `CCA-F`/`CCA-P` → `CCAR-F`/`CCAR-P` code typo.~~ **Done**, and
   verified against the official Pearson VUE listing.
4. ~~Harden the state-load backfill.~~ **Done** — `S_DEFAULTS` + `migrate()`
   with a schema version; every field is shape-checked on load. Covered by a
   Node test exercising missing/NaN/wrong-type saved state.
5. **Implement the chosen architecture.** Hosting and JSON extraction are
   **done** — the app is live and loads `data/*.json` at runtime, verified
   end-to-end against the deployed site. Remaining: **Supabase auth and
   progress sync**, which is blocked until the owner creates a Supabase
   project (account creation can't be delegated). Once the project URL and
   `anon` public key exist, the work is: schema + row-level security policies,
   an auth flow, and swapping the `store` object in `index.html` from
   `localStorage` to a synced backend with an offline fallback.
6. **Grow the question banks** (currently 24–25 per cert; `ccap` has 24). Now
   that the invented "60 questions" claim is gone the app is no longer
   self-contradictory, but the pool is still small enough that a learner
   exhausts it in 2–3 quiz rounds.

## 7. Note on exam-content integrity

Aligning practice material to the **published** exam blueprint (objectives,
domains, weightings, Partner Academy prep courses) is legitimate and is what
this app should do. Reproducing **actual live exam questions** is not — Pearson
VUE exams are under NDA, and redistributing real items is braindumping, which
gets candidates decertified and creates legal exposure for whoever publishes
it. Keep all questions original, as they are today.
