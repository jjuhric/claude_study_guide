# Hangman Glossary — Content Checklist

Resumable checklist for Glossary Hangman's word pool. Rules for every entry
(from the approved games plan, `js/11-hangman.js`'s banner comment):

- Term + hint compiled **only** from that cert's own `lessons[].b` prose and
  `cards[].f`/`.b` — never invented, never sourced from memory.
- Hints are paraphrased, not copied at length, and introduce no fact beyond
  the source passage.
- Term length 2-30 chars (single words or short 2-3 word phrases both work —
  a literal space always displays and never costs a miss).
- No case-insensitive duplicate term within the same `(cert, domain)` pair.
- Target 10-15 terms per domain. After adding entries: `node
  tools/build-manifest.js`, then `node test/smoke.js` green, then commit.

Legend: `[x]` done · `[~]` seeded (a few terms, not yet at target) · `[ ]` not started.

## CCAO-F (7 domains) — [x] done, 37 terms, ~5-7/domain

All seven domains authored from the CCAO domain lessons: Prompting, Output
Evaluation, Model Selection, Workflow Integration, Knowledge Management,
Governance & Risk, Troubleshooting. Below the 10-15 target per domain but a
genuinely playable full spread — top up opportunistically.

## CCDV-F (7 domains) — [x] done, 51 terms

- [x] 0. API Mechanics — 11 terms
- [x] 1. Tool Use & Structured Output — 7 terms
- [x] 2. Agents & SDK — 7 terms
- [x] 3. Model Selection & Cost — 7 terms
- [x] 4. Prompt & Context Engineering — 6 terms
- [x] 5. Security — 7 terms
- [x] 6. MCP — 6 terms

## CCAR-F / CCAF (5 domains) — [x] done, 34 terms

- [x] 0. Agentic Architecture & Orchestration — 8 terms
- [x] 1. Claude Code Workflows — 6 terms
- [x] 2. Prompt Engineering & Structured Output — 5 terms
- [x] 3. Tool Design & MCP Integration — 6 terms
- [x] 4. Context, Retrieval & Reliability — 9 terms

## CCAR-P / CCAP (5 domains) — [~] seeded, 3 terms (domain 0 only)

- [~] 0. Multi-Agent Systems at Scale — 3 terms seeded (`task ledger`, `isolation`, `specialists`)
- [ ] 1. Reliability & Error Recovery
- [ ] 2. Cost, Latency & Model Strategy
- [ ] 3. Evaluation & Observability
- [ ] 4. Security & Governance of Agents

## Close-out (once every domain above is `[x]`)

- Raise `test/smoke.js`'s glossary check from "well-formed" to a per-domain
  minimum count (≥8), the same way the lesson-depth floors were raised only
  once the content actually cleared them.
- Delete this file (or collapse it to a one-line changelog entry).
