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
- [x] **4.3** CCDV-F — 7,086w → **9,570w**. Domain lessons 868–1,185w.
- [x] **4.4** CCAO-F — 7,793w → **10,252w**. Domain lessons 1,018–1,189w.
- [x] **4.5** Floors set from measured results, and **split by lesson type**:
      850 for domain lessons, 600 for foundation, 400 for masterclasses. One
      number would have been wrong — masterclasses are deliberately short
      single-topic deep-dives, and holding them to the domain floor would mean
      padding, which is the failure this whole phase was correcting.

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
- [x] **5.1** All 100 verified. Six factual defects found and fixed — see the
      commit; the worst was a card recommending `temperature: 0.0`, which
      contradicted another card in the same app and is rejected on current
      models.
- [x] **5.2** Backs expanded: **17.9w → 56w average**, minimum 46 (was 2).
      Suite floor set at 40.

### Phase 6 — tool reference content
The tools present themselves as authoritative references, so same bar.
- [x] **6.1** Model matrices and capability navigators — verified against FACTS.md; the allow-list checks from Phase 0 already enforce ids, names, rates and tool versions here, so this was a re-read rather than a rewrite. Fixed six surviving cache figures the allow-list could not see: the Haiku 4.5 minimum was stated as 2,048 (it is 4,096), the Opus 5 512 floor was missing everywhere, two places still claimed an "85% read discount", and the context-window line in the multi-turn walkthrough still said 200k.
- [x] **6.2** Pricing and ROI calculators — arithmetic, not just the rates. Found a dead Savings column in the FinOps calculator: its "baseline" called the same cost() closure, which read the cache and batch settings from scope, so the baseline carried the discounts it was measuring and the column read 0% for every input. Rewrote cost() to take hit rate and batch as parameters, added a cache-hit readout (the slider had no value display), and stated the two things the model omits — the +25% cache write premium and Batch's 24h latency. Locked with 8 arithmetic checks computed by hand from the rate card.
- [x] **6.3** API parameter references and error-mode tables. The error simulator listed **422 and 503**, neither of which Anthropic returns, each with an invented cause to match — 422 was carrying a claim about role alternation that FACTS.md does not support, so it went rather than getting reworded. Replaced with the real 400 sub-cases learners actually hit (budget_tokens rejected, prefill removed) and added a Retryable line to every entry, since retryability is the only thing a handler needs from the code. All four `stop_reason` enumerations listed four of the seven values; `pause_turn` and `refusal` are precisely the two that change control flow. Parameter reference gained `system` and `output_config`.
- [x] **6.4** Decision trees and recommendation engines. The model recommender still carried multipliers derived from Opus at $15/$75 — "20x more expensive than Haiku" (5x), "5x more expensive" than Sonnet (1.7x), "save 75%" (67%). Derived figures rot separately from the figures they came from, which is the lesson of this phase. Also found a **second pricing table** in `js/06-practice.js` holding Opus at $15/$75 as bare numeric fields, invisible to the Phase 0 rate check because it matches `$`-prefixed prose; its "P99 Latency" column was invented outright, as was a "P50 first-token under 500ms" claim in the recommender. Its Copy button toasted "copied to clipboard" without copying anything. Caching tree contradicted its own root question and advised padding prompts with filler to reach the cache floor; agent tree treated running out of context as sufficient reason for multi-agent.

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
