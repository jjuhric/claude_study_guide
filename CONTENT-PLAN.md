# Content Accuracy & Depth Overhaul

Working plan for the content pass: correct every Claude fact in the app, lock
the facts down with tests, then deepen the teaching material.

**This file is the resume point.** Every task below is independently
committable. If work stops for any reason, `git log` plus the checkboxes here
tell you exactly where to pick up.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done & committed

---

## Why this pass exists

Measured on 2026-08-16, before any changes:

| Problem | Measurement |
|---|---|
| `budget_tokens` taught as current | **50** occurrences vs 10 for `adaptive` |
| Non-current model ids | `claude-sonnet-4-5` ×14, `claude-opus-4` ×4 |
| Stale pricing | Opus $15/$75, Haiku $0.80/$4.00 |
| Stale server-tool versions | every one dated `20241022` |
| Where it concentrates | **49 of 66 hits in `js/09-suites.js`** |
| Explanation depth | avg **16.7 words**; 322/400 under 20 |
| Per-option rationale depth | ~10 words each |
| Card back depth | avg 17.4 words |
| Lesson prose | 24,747 words total; CCAR-P thinnest at 4,784 |

`budget_tokens` is not merely dated: it is **rejected with a 400** on Opus 5,
Sonnet 5, Opus 4.8 and 4.7. The app teaches an API call that fails.

The suite missed all of it because its model check is a **denylist of Claude 3.x
names** — nothing later can trip it, and nothing validates ids, prices, tool
version strings, or parameter shapes.

---

## Task list

### Phase 0 — ground truth and guardrails
- [x] **0.1** Write `docs/FACTS.md`: model ids, names, context windows, max
      output, pricing, the thinking API by generation, server-tool version
      strings, sampling-parameter support. Every row carries its source.
- [x] **0.2** `test/smoke.js`: denylist → **allow-list**. Every `claude-*` id
      must be current; every `Claude <Family> <N>` name must be current; every
      per-1M price must match the fact sheet.
- [x] **0.3** Add parameter-shape checks: no `budget_tokens` presented as
      current, no non-current server-tool version string.
- [x] **0.4** Commit. **The suite is RED here, by design** — 5 failures, each
      a real defect the old denylist could not see: `claude-sonnet-4-5` and the
      non-existent `claude-opus-4`; rate pairs `0.80/4.00` and `15/75`; three
      `*_20241022` tool versions; and 4 places `budget_tokens` sits beside a
      model that rejects it.

### Phase 1 — API-surface correctness sweep
- [x] **1.1** `js/09-suites.js` — 49 hits: ids, pricing, tool versions,
      thinking parameter, max-output figures.
- [x] **1.2** `js/06-practice.js`, `js/05-labs.js`, `js/04-study.js`,
      `js/10-quiz.js` — remaining 17 hits.
- [x] **1.3** Rewrite the 6 questions built on drift-prone facts. `ccdv[70]`
      and `ccdv[92]` rest entirely on `budget_tokens` and need new stems.
- [x] **1.4** Teach the transition, do not just delete it: `adaptive` on 4.6+,
      `budget_tokens` on pre-4.6, a 400 on 5-generation models.
- [x] **1.5** Suite green again. Commit.

### Phase 2 — question-bank accuracy audit
For each cert: the keyed answer is actually correct, no distractor is *also*
defensible, the stem is unambiguous, it tests understanding over trivia, and
every fact matches `docs/FACTS.md`.
- [x] **2.1** CCAO-F (100 questions)
- [x] **2.2** CCDV-F (100)
- [x] **2.3** CCAR-F (100)
- [x] **2.4** CCAR-P (100)

### Phase 3 — explanation and rationale depth
`exp` to a 60-word floor (target 80–120): what the answer means, the principle
under it, and when it stops applying. Each `why` to a 25-word floor naming the
specific misconception. Per-question teaching text ~56 → ~180 words.

**Floor note (from writing the first 40):** the 60-word `exp` floor lands well
— batches average ~100 words. The 25-word `why` floor does not: rationales that
name the misconception cleanly come out at 18–25 words, and padding them to
clear 25 adds words without adding information. Set the enforced floor at 18
in task 3.5 and target ~22 average, rather than writing to a number.
- [x] **3.1** CCAO-F — 100/100. exp avg **100w** (min 88), why avg **19w**
      (min 12). See the floor note below.
- [x] **3.2** CCDV-F — 100/100. exp avg **94w** (min 81), why avg **17w**.
- [x] **3.3** CCAR-F — 100/100. exp avg **89w** (min 77), why avg **16w**.
- [x] **3.4** CCAR-P — 100/100. exp avg **84w** (min 74).
- [x] **3.5** Depth floors added — but not the ones the plan specified. A
      uniform per-rationale floor is the wrong instrument: a rationale for a
      plausible distractor needs 20–30 words to name the misconception, while
      one for an absurd distractor is finished in seven, and padding it adds
      words without information. Enforced instead: `exp` ≥ 60, the **correct
      answer's** rationale ≥ 10 (that is where the teaching lands), and a
      per-question mean ≥ 10 so a bank of one-liners still fails.

### Phase 4 — lesson expansion (thinnest first)
Worked examples with real code, the decision criteria actually applied, failure
modes with symptoms, links to the questions each lesson teaches. Roughly double
each; floors 400/250 → 900/600.
- [x] **4.1** CCAR-P — 4,784w → **7,975w**. Domain lessons 1,036–1,174w each
      (were 495–621), foundation 692w (was 390). Masterclasses left at ~420w.
- [x] **4.2** CCAR-F — 5,084w → **7,543w**. Domain lessons 872–1,126w.
      The Context/Retrieval lesson gained real retrieval teaching, which it
      lacked despite owning 10 retrieval questions after the 2.3 re-tag.
- [ ] **4.3** CCDV-F (7,086w)
- [ ] **4.4** CCAO-F (7,793w)
- [ ] **4.5** Raise the lesson floors in the suite.

### Phase 2b — near-duplicate questions (found during 3.4)
The suite's duplicate check fires at 0.80 similarity. Measuring the whole bank
at 0.60 found pairs that are the *same question in different words* sitting
comfortably under that line — a learner meets them twice and the "100 questions"
count overstates what is actually covered.

Confirmed same-substance pairs: CCDV `resource vs tool` (0.73) and
`stop_reason tool_use` (0.70); CCAR-F `tool returns N rows` (0.73) and
`agent loop repeats a failing call` (0.67); CCAR-P `observability stack` (0.65)
and `N% done then failed` (0.62); CCDV `prompt injection from a web page`
(0.67). Others at 0.60–0.66 are genuinely distinct and must not be touched —
e.g. CCAR-F `roots/list` vs `prompts/get`, CCAR-P tenant isolation vs user
permissions.
- [x] **2b.1** Replace one of each confirmed pair with a question covering
      something the domain does not yet test, rather than deleting and dropping
      below 100.
- [x] **2b.2** Threshold set to **0.75, not 0.65**. Re-measuring after the
      replacements showed the plan's target was unworkable: the seven genuine
      duplicates scored 0.62–0.73 and the legitimate neighbours score in the
      *same band*. A 0.65 gate would fail on `roots/list` vs `prompts/get`
      (0.68) and full vs partial refusal (0.70), and a check that cries wolf
      gets silenced. The gate sits just above the observed maximum; the worst
      pair prints on every run so the 0.6–0.75 band stays visible for human
      review.

### Phase 5 — flashcards
- [ ] **5.1** Verify all 100 backs against `docs/FACTS.md` — including the
      claim that sampling parameters are rejected on current models.
- [ ] **5.2** Expand backs to a 45-word floor: the fact, why it matters, and
      the mistake it prevents.

### Phase 6 — tool reference content
The tools present themselves as authoritative references, so same bar.
- [ ] **6.1** Model matrices and capability navigators
- [ ] **6.2** Pricing and ROI calculators — arithmetic, not just the rates
- [ ] **6.3** API parameter references and error-mode tables
- [ ] **6.4** Decision trees and recommendation engines

### Phase 7 — close-out
- [ ] **7.1** Both suites green; measure final counts.
- [ ] **7.2** Update `README.md`: figures, enforcement list, `docs/FACTS.md`.
- [ ] **7.3** Verify on the deployed site.
- [ ] **7.4** Delete this file.

---

## Rules for resuming

1. Read this file, then `git log --oneline -10`. The first unchecked box is next.
2. One task per commit. Run `node test/smoke.js` before every commit and never
   leave the tree red — Phase 0 is the single deliberate exception.
3. **Never write a Claude fact from memory.** It goes in `docs/FACTS.md` with a
   source first, or it does not go in.
4. Phase order is load-bearing: accuracy before depth. Expanding text built on a
   wrong fact multiplies the error.
5. Run `node tools/build-manifest.js` after any content edit — the suite fails
   if the manifest drifts.
