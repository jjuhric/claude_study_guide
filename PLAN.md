# Restructure & Accuracy Plan

Working plan for: duplicate-function bug fix, model-accuracy pass, file
restructure, and README rewrite.

**This file is the resume point.** Every task below is independently
committable. If work stops for any reason, `git log` plus the checkboxes here
tell you exactly where to pick up. Do not batch tasks across a commit boundary.

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done & committed

---

## Findings that shaped this plan

**1. The duplicate functions are not dead code — one is a live bug.**

Five functions are defined twice; the second definition silently wins.

| Function | Dead (line) | Live (line) | Action |
|---|---|---|---|
| `getFreshState` | 558 | 606 | **MERGE** — see below |
| `cramSheetSelect` | 2332 | 2712 | delete the older |
| `startBossBattle` | 4077 | 4177 | delete the older |
| `renderBossQuestion` | 4097 | 4216 | delete the older |
| `pickBossAnswer` | 4123 | 4246 | delete the older |

Four follow an "append a fixed version, leave the old one" pattern (there are
literally `FIX 1: BOSS BATTLE REPAIRED` and `UPGRADED EXAM CRAM SHEETS`
sections), so deleting the older copy is safe.

`getFreshState` is the opposite and is the reason this is urgent: the **live**
version dropped 21 keys the dead one had. Neither `getFreshState` nor
`S_DEFAULTS` initialises them, so on a fresh profile they are `undefined`:

```
arcadeHighScore  blitzHighScore  cohortCode  customTheme  dailyBossHistory
dailyTarget      examDate        gistId      gistToken    lang
notifsEnabled    profile{handle,avatar,title,uid}         voiceNotes
```

`S.profile` has **31 reads, only 13 guarded** → 18 unguarded reads of an
undefined object (`S.profile.handle` throws). `S.dailyTarget` has 16 reads and
1 guard. So Daily Target, Daily Boss, Arcade, Blitz, Cohort, Gist Sync, Theme
Studio, Voice Notes and anything showing a profile are broken or throwing for
new users. Deleting the wrong copy would make this permanent.

**2. The model-accuracy problem includes a model that never existed.**

~119 stale references: ~56 in `index.html`, ~63 in `data/*.json`.

- `Claude 3.5 Sonnet` ×37, `Claude 3.5 Haiku` ×33, `Claude 3.7 Sonnet` ×8,
  `Claude 3 Opus` ×7, plus `claude-3-*` model ids
- **`Claude 3.5 Opus` ×7 — this model was never released.** That is a
  fabrication, not staleness, and it is exactly the class of error this project
  has spent several passes removing.

**3. ES modules are not an option for the restructure.**

The app has **403 inline `onclick=`** plus 71 other inline handlers (474 total),
all of which resolve against **global scope**. `<script type="module">` uses
module scope, so every one of them would break unless 368 functions were
re-exported onto `window`. That is a huge blast radius for zero user benefit.

**Decision: split into plain `<script src>` classic scripts.** They share one
global scope exactly like the current single block, so behaviour is unchanged.
No build step, works on GitHub Pages, and load order is explicit via numbered
filenames.

**4. Two things the split will break if not handled.**

- `test/smoke.js` reads `index.html` and extracts `<script>` blocks, asserting
  `blocks.length === 2`. It must instead read `js/*.js` in order. All 326
  checks depend on this harness.
- `sw.js` caches an explicit `ASSETS` list. New JS/CSS files must be added or
  offline mode serves a broken app. Cache version must bump.

---

## Target structure

```
index.html          shell only: <head>, body markup, ordered <script src> tags
css/app.css         extracted from the inline <style> block
js/00-data.js       CERTS, BADGES, TITLES, TOOL_GROUPS, TOOLS, static content
js/01-state.js      store, S_DEFAULTS, getFreshState, migrate, save, theme, backup
js/02-ui.js         $, esc, toast, announce, confetti, renderHeader, audio synth
js/03-home.js       home, renderToolGrid, toolCard, filterTools, certView
js/04-study.js      lessons, handbook, bookmarks & notes, narrator, reading progress
js/05-quiz.js       quiz, drill, review, mock, boss battle, speed run, pacing
js/06-flashcards.js flashcards, Leitner SRS, blitz, custom decks
js/07-labs.js       prompt studio, SDK playground, MCP workbench, simulators
js/08-diagnostics.js analytics, heatmap, radar, forecast, calibration, predictor
js/09-audio.js      audio quiz, speed drill, recap, voice notes/recall/commuter
js/10-share.js      diplomas, badges, gist sync, cohort, leaderboards, export
js/11-boot.js       content loader, keyboard handlers, SW registration, boot
```

The file already carries **130 section banner comments**, so the split follows
existing boundaries rather than inventing new ones.

---

## Task list

### Phase 0 — safety net
- [x] **0.1** Baseline recorded: `smoke.js` **326 ok / 0 fail**.
      `links.js` **FAILS — 3 dead videos**, each referenced by two lessons:
      `kQmXZJp_6io`, `0k_3uM5jUqM`, `Z3mN7U3O4fE` (all HTTP 404). These were
      added with the Masterclass content and are a pre-existing regression, not
      caused by this work. Folded into Phase 2 as task 2.8.
- [x] **0.2** Tagged `pre-restructure` at the last known-good commit.

### Phase 1 — duplicate-function bug (do first: smallest, highest value)
- [x] **1.1** Merge `getFreshState`: keep the live (later) body, restore the 21
      missing keys from the dead one, delete the dead copy.
- [x] **1.2** Add the same 21 keys to `S_DEFAULTS` so `migrate()` repairs
      existing saves instead of leaving them `undefined`.
- [x] **1.3** Delete the four superseded copies (`cramSheetSelect`,
      `startBossBattle`, `renderBossQuestion`, `pickBossAnswer`), keeping the
      later definition in each case.
- [x] **1.4** Test: assert no function is defined twice in the whole codebase.
- [x] **1.5** Test: assert every key read as `S.<key>` exists in `S_DEFAULTS`
      (this is the check that would have caught the bug).
- [x] **1.6** Verify + commit. Baseline 326 -> **332 checks**.
- [x] **1.7** *(added)* The 1.5 check immediately found a sixth uninitialised
      key, `flashSchedule`: the Forgetting Curve Simulator read it (never
      written anywhere) with field `.box`, while Leitner state actually lives in
      `S.cardBox` with field `.b`. The chart showed all zeros for every user.
      Fixed to read the real schedule.
- [x] **1.8** *(added)* `migrate()` coerced `studyPlan: null` to `{}`, so the
      `if (!S.studyPlan) return;` guard never fired and every new user had a
      truthy empty study plan. `migrate()` is now null-aware.

### Phase 2 — accuracy pass (before the split: one file, not twelve)
- [x] **2.1** Re-verify the current model lineup against the `claude-api` skill
      / official docs. Do **not** write model facts from memory.
- [x] **2.2** Remove every `Claude 3.5 Opus` reference — the model never
      existed. Replace with a real model or drop the claim.
- [x] **2.3** Update stale model names and ids in `index.html` (~56).
- [x] **2.4** Update stale model names and ids in `data/*.json` (~63).
- [x] **2.5** Re-check API-surface claims added since the last audit (prefill,
      sampling params, thinking budget vs effort, stop reasons).
- [x] **2.6** Test: assert no reference to a non-existent model, and that
      version-pinned model names are on an allow-list.
- [x] **2.7** Verify + commit.
- [x] **2.8** Replaced the 3 dead Masterclass videos (7 references) with
      topically-matched, individually verified-live equivalents.
      `node test/links.js` now exits clean.
- [x] **2.9** *(added)* The rename surfaced two further errors: a CCDV-F
      question asked Sonnet's context window with **200,000** as the correct
      answer (current Opus/Sonnet are **1M**; only Haiku 4.5 is 200K), and a
      lesson credited "Claude 3.5" with Extended Thinking — a feature it never
      had. Both corrected. Stale pricing was also wrong: Haiku listed at
      $0.80/$4.00 (now $1.00/$5.00) and Opus at $15.00/$75.00 (now $5.00/$25.00);
      Sonnet's $3.00/$15.00 was already correct and deliberately left alone.

### Phase 3 — file restructure (largest; strictly mechanical)
- [x] **3.1** Create `css/app.css` from the inline `<style>` block; link it.
- [x] **3.2** Split the main script into `js/00-data.js` … `js/10-share.js` on
      existing section boundaries. **Move only — no edits during the move**, so
      the diff stays reviewable.
- [x] **3.3** Extract the boot block to `js/11-boot.js`.
- [x] **3.4** Rewrite `index.html` as a shell with ordered `<script src>` tags.
- [x] **3.5** Update `test/smoke.js` to load `js/*.js` in order instead of
      extracting `<script>` blocks from `index.html`.
- [x] **3.6** Update `sw.js`: add all new assets, bump cache version.
- [x] **3.7** Test: assert every file in `js/` is referenced by `index.html`
      **and** listed in `sw.js` (guards the offline-breaks-silently failure).
- [x] **3.8** Verified: **349 checks** pass, `links.js` clean.
- [x] **3.9** *(added)* The split exposed a hoisting hazard the plan predicted
      in the abstract but not the instance: five top-level statements ran at
      load, and the day-streak initialiser called `checkDayStreak()` defined
      ~400 lines later. One script hoists all declarations; twelve do not, so
      that call would have thrown `ReferenceError` at boot. All five were
      relocated to `js/11-boot.js`, which loads last. Behaviour is unchanged.
- [x] **3.10** *(added)* `"use strict"` was file-scoped on the single script.
      Restored in each module so the split does not silently drop to sloppy
      mode.

### Phase 4 — documentation
- [ ] **4.1** Rewrite `README.md`: new structure, accurate tool count, how to
      add a tool (registry + test), how to add questions, the model-accuracy
      policy, and the local-server requirement.
- [ ] **4.2** Update `FINDINGS.md` with what Phases 1–3 fixed and what remains.
- [ ] **4.3** Commit.

### Phase 5 — final verification
- [ ] **5.1** `node test/smoke.js` and `node test/links.js` both green.
- [ ] **5.2** Confirm the deployed site serves the restructured app and the
      dashboard still renders all 76 tool cards.
- [ ] **5.3** Delete this file, or reduce it to a short changelog entry.

---

## Rules for resuming

1. Read this file, then `git log --oneline -10`. The last commit tells you which
   task completed; the first unchecked box is next.
2. One task per commit. Never leave the tree with failing tests.
3. Run `node test/smoke.js` before every commit.
4. Phase 3 is move-only. If a move tempts an edit, note it and do it after.
