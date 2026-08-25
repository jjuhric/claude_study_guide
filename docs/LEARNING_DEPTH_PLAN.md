# Learning Depth — Content Checklist

Resumable checklist for Phase 1 of the multi-modal learning plan: one plain-
language analogy and one worked example (`.exbox`) per lesson, starting with
the 16 Masterclasses (currently zero of either across all of them).

Rules for every addition:

- The analogy and example must map to a fact the lesson's own prose already
  states — never a new claim riding in on the analogy. Same sourcing
  discipline as `docs/FACTS.md` and the Hangman glossary.
- Analogy: 2-4 sentences, plain language, no jargon in the analogy itself
  (the jargon it's explaining can follow immediately after).
- Worked example: use the existing `.exbox` class (see any domain lesson,
  e.g. `ccao` "Model Selection" — `<div class='exbox'><div class='lbl'>...`),
  a concrete scenario with a real (if illustrative) number or decision.
- After each lesson: `node test/smoke.js` green, then commit. One lesson or
  a small same-cert batch per commit — never one monolithic content commit.

Legend: `[ ]` not started · `[x]` done.

## CCAO-F

- [x] 8. Advanced Prompt Architecture & XML Structuring
- [x] 9. Production Model Economics, Caching & Batches API
- [x] 10. Enterprise Evaluation Benchmarking & LLM-as-a-Judge
- [x] 11. AI Governance, Risk & Policy Compliance

## CCDV-F

- [x] 8. Model Context Protocol (MCP) Server Architecture
- [x] 9. Claude Code CLI & Headless CI/CD Automation
- [x] 10. Advanced Tool Design, Structured Output & Idempotency
- [x] 11. High-Performance Streaming & Extended Thinking (also fixed a factual
      contradiction found while reading it: an "Exam Rule" section taught
      `budget_tokens: 4096` as current two paragraphs after the lesson's own
      text says that parameter is rejected on current models)

## CCAR-F

- [x] 6. Enterprise Production Hybrid RAG Architecture
- [x] 7. Workflow Topologies & Agent Orchestration
- [x] 8. Proactive Context Management & 80% Compaction
- [x] 9. Resilience, Rate Limiting & Graceful Degradation

## CCAR-P

- [x] 6. Production Multi-Agent Systems & Blackboard Architecture
- [x] 7. Zero-Trust Security & MicroVM Container Sandboxing
- [x] 8. OpenTelemetry Observability & Multi-Tenant Cost Attribution
- [x] 9. High Availability, Circuit Breakers & Scaled Red-Teaming

**All 16 Masterclasses done.** Word counts rose from 410-518 to 541-709;
every one now carries a genuine plain-language analogy and a worked example
grounded in that lesson's own already-stated facts.

## Next (after Masterclasses)

Domain lessons thinnest on worked examples (currently ~1 `.exbox` per
1,000+ words) — audit and list once the 16 above are done.

## Close-out

Once every item above is `[x]`: raise `test/smoke.js`'s check from
"has an exbox" presence to a stricter quality bar if warranted, then delete
this file (or collapse to a changelog line), matching
`docs/HANGMAN_GLOSSARY_PLAN.md`'s own close-out rule.
