# Claude Cert Quest

A gamified study companion for the [Anthropic Claude Certification
Program](https://www.pearsonvue.com/us/en/anthropic.html) — practice questions,
flashcards, written lessons, and timed mock exams for all four certifications,
with XP, levels, badges, and study streaks.

**Live:** https://jjuhric.github.io/claude_study_guide/

> Unofficial and not affiliated with or endorsed by Anthropic. Every question
> and lesson here is original practice material — **not** real exam content.
> Exam format, domain weightings, and passing scores are published only in the
> official exam guides inside Anthropic Partner Academy. Verify there before
> relying on anything shown here. See [FINDINGS.md](FINDINGS.md) §0.

## Certifications covered

| Code | Certification | Price |
|---|---|---|
| CCAO-F | Claude Certified Associate – Foundations | $99 |
| CCDV-F | Claude Certified Developer – Foundations | $125 |
| CCAR-F | Claude Certified Architect – Foundations | $125 |
| CCAR-P | Claude Certified Architect – Professional | $175 |

Names, codes, and prices confirmed against Anthropic's public Pearson VUE and
Skilljar listings.

## How to study with it

Six modes per certification, designed around what actually moves exam results —
spaced retrieval, targeted weak-spot work, and timed rehearsal:

| Mode | What it's for |
|---|---|
| 📖 **Study Guide** | Written lessons per domain. Read these first — the questions assume the grounding. |
| ⚔️ **Quiz Battle** | 10 questions with instant explanations. Prioritizes unseen questions, then ones you got wrong. |
| 🃏 **Flashcards** | Spaced repetition. Only shows cards that are **due**. |
| ⏱️ **Mock Exam** | 20 questions, 40 minutes, scored. Samples proportionally across domains, supports flag-for-review, and breaks results down by domain. |
| 🎯 **Review Misses** | Serves only questions you have previously answered wrong. |
| 🩹 **Weakest Domain** | Drills whichever domain you score lowest in — untested domains come first. |

**Spaced repetition.** Flashcards use Leitner boxes. Recall a card and it moves
up a box and returns later (1 → 2 → 4 → 9 → 21 days); miss it and it drops to
box 1 and comes back immediately, plus once more in the same session. When
nothing is due, the app says so rather than inviting you to drill pointlessly —
the spacing *is* the mechanism. You can always override and drill the full deck.

**Prep progress.** Each certification page shows a single score blended from six
components (lessons read, question coverage, accuracy, domain breadth, card
retention, mock performance) and always names the weakest one with a button
that takes you straight there. It measures progress through *this app's*
material — it is not a prediction about the real exam.

**Keyboard.** `1`–`4` answer, `Enter`/`Space` advance. On flashcards, `Space`
flips, `1` is still-learning, `2` is knew-it.

## Running locally

The app loads its content from `data/*.json`, and browsers block `fetch()` on
`file://` URLs — so **opening `index.html` directly will not work**. Serve the
folder over HTTP:

```bash
python -m http.server 4173
```

Then open http://localhost:4173.

## Tests

No dependencies. `smoke.js` boots the app in a VM with a DOM shim, renders every
screen for every certification, exercises the spaced-repetition scheduler, and
checks content integrity. Runs offline:

```bash
node test/smoke.js
```

`links.js` checks every recommended video against YouTube's oEmbed endpoint and
reports any that have been deleted or made private, with the lesson that
references them. It needs the network, so it is kept separate — run it
periodically, since recommended videos do rot:

```bash
node test/links.js
```

## Layout

```
index.html      app shell: UI, gameplay, progress tracking (localStorage)
data/*.json     questions, flashcards, and lessons, one file per certification
test/smoke.js   dependency-free smoke test
FINDINGS.md     code review, known gaps, and the content-integrity policy
```

## Contributing content

Questions and lessons live in `data/<cert-id>.json` so they can be reviewed and
diffed without touching the app. Question shape:

```json
{
  "d": 0,
  "q": "Question text",
  "opts": ["A", "B", "C", "D"],
  "a": 1,
  "exp": "Why the correct answer is correct."
}
```

`d` indexes into that certification's `domains` array in `index.html`; `a`
indexes into `opts`. An optional `why` array, parallel to `opts`, explains why
each option is right or wrong and is shown after answering — write the correct
option's entry starting with "Correct." so the test can verify it is anchored to
the right index. Option order is shuffled at load (and `why` is permuted with
it), so the authored position of the correct answer does not matter.

**242 questions across four certifications**, at least 10 per domain — the
threshold below which weakest-domain drilling and per-domain accuracy stop
meaning anything. `node test/smoke.js` enforces both that floor and the
rationale requirement.

**Keep all questions original.** Pearson VUE exams are under NDA — reproducing
real exam items is braindumping, which gets candidates decertified and creates
legal exposure. Align to the *published* blueprint; never copy live items.
