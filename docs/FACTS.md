# Verified Claude Facts

**The single source of truth for every Claude fact in this app.** Questions,
rationales, lessons, flashcards, and tool reference tables all cite this file.

**Rule: never write a Claude fact from memory.** It goes here with a source
first, or it does not go in the app. `test/smoke.js` enforces the model, price,
and parameter rows below.

Verified **2026-08-16** against the bundled `claude-api` skill (Anthropic's own
reference, model table cached 2026-06-24). Re-verify at every model launch;
`node test/smoke.js` fails when the app drifts from this file.

---

## 1. Current models

| Model | Model ID | Context | Max output | Input $/1M | Output $/1M |
|---|---|---:|---:|---:|---:|
| Claude Fable 5 | `claude-fable-5` | 1M | 128K | $10.00 | $50.00 |
| Claude Mythos 5 | `claude-mythos-5` | 1M | 128K | $10.00 | $50.00 |
| Claude Opus 5 | `claude-opus-5` | 1M | 128K | $5.00 | $25.00 |
| Claude Opus 4.8 | `claude-opus-4-8` | 1M | 128K | $5.00 | $25.00 |
| Claude Opus 4.7 | `claude-opus-4-7` | 1M | 128K | $5.00 | $25.00 |
| Claude Opus 4.6 | `claude-opus-4-6` | 1M | 128K | $5.00 | $25.00 |
| Claude Sonnet 5 | `claude-sonnet-5` | 1M | 128K | $3.00 | $15.00 |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | 1M | 128K | $3.00 | $15.00 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | **200K** | **64K** | $1.00 | $5.00 |

Notes that matter for the app's content:

- **Haiku 4.5 is the only exception** to 1M context and 128K output. Any claim
  that "all current models have a 200K window" is false; so is any claim that
  they all reach 128K output.
- **Sonnet 5 has introductory pricing of $2.00 / $10.00 per 1M through
  2026-08-31**, after which it is $3.00 / $15.00. Still active as of today —
  a pricing calculator should either use the standard rate or label the intro
  rate with its expiry.
- **Claude Mythos 5 is Project Glasswing only.** Do not present it as generally
  available.
- Model IDs are **complete as written — never append a date suffix.**
  `claude-sonnet-4-6-20251114` is not a model.
- Fast mode: Opus 5 and Opus 4.8 only, Claude API only, $10 / $50 per 1M.

## 2. Legacy, deprecated, and retired

| Model | ID | Status |
|---|---|---|
| Claude Opus 4.5 | `claude-opus-4-5` | Active (legacy) |
| Claude Sonnet 4.5 | `claude-sonnet-4-5` | Active (legacy) |
| Claude Opus 4.1 | `claude-opus-4-1` | Deprecated — retires 2026-08-05 |
| Claude Sonnet 4 | `claude-sonnet-4-0` | Deprecated |
| Claude Opus 4 | `claude-opus-4-0` | Deprecated |
| Claude Haiku 3 | `claude-3-haiku-20240307` | Deprecated — retires 2026-04-19 |
| Claude Sonnet 3.7 | `claude-3-7-sonnet-20250219` | **Retired** 2026-02-19 |
| Claude Haiku 3.5 | `claude-3-5-haiku-20241022` | **Retired** 2026-02-19 |
| Claude Opus 3 | `claude-3-opus-20240229` | **Retired** 2026-01-05 |
| Claude Sonnet 3.5 | `claude-3-5-sonnet-*` | **Retired** 2025-10-28 |
| Claude 2.1 / 2.0 | `claude-2.1` / `claude-2.0` | **Retired** 2025-07-21 |

- **`Claude 3.5 Opus` never existed.** Not retired — never released.
- **`claude-opus-4` is not a valid id.** The bare form has no alias; the
  deprecated model is `claude-opus-4-0`.
- **`claude-sonnet-4-5` is valid but superseded.** It is not retired, so it will
  not 404 — but presenting it as the current recommendation is wrong. Use
  `claude-sonnet-5`.

## 3. Extended thinking — by model generation

The most drift-prone fact in the whole app.

| Model | Thinking config | Omitting `thinking` | `budget_tokens` | Sampling params |
|---|---|---|---|---|
| Fable 5 | `{type:"adaptive"}` or omit; `disabled` → **400** | Runs adaptive | **400** | **400** |
| Opus 5 | `{type:"adaptive"}` or omit; `disabled` only at effort ≤ `high` | Runs **adaptive** | **400** | **400** |
| Opus 4.8 / 4.7 | `{type:"adaptive"}`; `disabled` accepted | Runs **without** thinking | **400** | **400** |
| Sonnet 5 | `{type:"adaptive"}`; `disabled` accepted | Runs adaptive | **400** | Non-default → **400** |
| Opus 4.6 / Sonnet 4.6 | `{type:"adaptive"}` recommended | No thinking unless set | Deprecated, still works | Allowed |
| Sonnet 4.5 / Haiku 4.5 | `{type:"enabled", budget_tokens:N}` | No thinking | **Required** for thinking; min 1024, must be < `max_tokens` | Allowed |

**The teaching point:** `budget_tokens` is not merely dated. On Opus 5, Sonnet 5,
Opus 4.8, 4.7, and Fable 5 it is **rejected with a 400** — code written against
it fails outright. Adaptive thinking replaced it; depth is controlled with
`output_config.effort`, not a token count.

`thinking.display` controls visibility only — thinking happens and is billed the
same either way. Default is `"omitted"` (empty thinking text) on Fable 5,
Mythos 5, Opus 5, 4.8, 4.7, and Sonnet 5; `"summarized"` returns a readable
summary. The raw chain of thought is never returned on any model.

### Effort

`output_config: {effort: "low"|"medium"|"high"|"xhigh"|"max"}` — **inside
`output_config`, not top-level**. Default `high`. GA, no beta header.
`xhigh` arrived with Opus 4.7. Opus 4.6 / Sonnet 4.6 have
`low`/`medium`/`high`/`max` only. Sonnet 4.5 and Haiku 4.5 error on `effort`.

## 4. Sampling parameters

`temperature`, `top_p`, `top_k` are **removed** on Fable 5, Opus 5, Opus 4.8,
and Opus 4.7 — sending any of them returns a 400. Sonnet 5 rejects non-default
values. Opus 4.6, Sonnet 4.6, and older still accept them, and on Claude 4+
you may pass `temperature` **or** `top_p`, never both.

Steer with prompting instead. `temperature=0` never guaranteed identical output
on any model.

## 5. Server-tool version strings

Every one of these is dated, and the app had a whole generation of stale ones.

| Tool | Current `type` | `name` |
|---|---|---|
| Web search | `web_search_20260209` | `web_search` |
| Web fetch | `web_fetch_20260209` | `web_fetch` |
| Code execution | `code_execution_20260521` | `code_execution` |
| Code execution (PTC) | `code_execution_20260120` | `code_execution` |
| Computer use | `computer_20251124` | `computer` |
| Bash | `bash_20250124` | `bash` |
| Text editor | `text_editor_20250728` | **`str_replace_based_edit_tool`** |
| Memory | `memory_20250818` | `memory` |
| Tool search (regex) | `tool_search_tool_regex_20251119` | `tool_search_tool_regex` |
| Tool search (BM25) | `tool_search_tool_bm25_20251119` | `tool_search_tool_bm25` |
| Advisor | `advisor_20260301` | `advisor` |

- The `_20260209` web tools have **built-in dynamic filtering** and require
  Opus 5/4.8/4.7/4.6, Sonnet 5, or Sonnet 4.6. Do not also declare
  `code_execution` alongside them.
- Older models use the basic `web_search_20250305` / `web_fetch_20250910`.
- **The text editor's `type` and `name` change together.** Updating one and
  keeping `str_replace_editor` returns a 400.
- `undo_edit` is no longer a supported text-editor command.
- Bash and text editor are **schema-less** — declare `type` and `name` only,
  never an `input_schema`.

## 6. Output limits and streaming

- `max_tokens` is a hard cap on **thinking + response text together**, not just
  the answer.
- Stream anything above ~16K `max_tokens` — non-streaming requests hit SDK HTTP
  timeouts.
- 128K max output on every current model except Haiku 4.5 (64K).
- The old per-model output caps the app taught (Haiku 8,192; Sonnet 64,000) are
  not the current figures.

## 7. Prompt caching

Minimum cacheable prefix, which is **not monotonic across generations**:

| Models | Minimum |
|---|---:|
| Opus 5, Fable 5, Mythos 5 | 512 tokens |
| Opus 4.8, Sonnet 5, Sonnet 4.6, Sonnet 4.5, Opus 4.1, Opus 4, Sonnet 4 | 1024 |
| Opus 4.7, Haiku 3.5 | 2048 |
| Opus 4.6, Opus 4.5, Haiku 4.5 | 4096 |

- Cache **reads** cost ~0.1× base input; **writes** cost 1.25× (5-minute TTL) or
  2× (1-hour TTL). Break-even is 2 requests at 5m, 3 at 1h.
- Render order is `tools` → `system` → `messages`. Caching is a **prefix match**:
  any byte change invalidates everything after it.
- Max 4 `cache_control` breakpoints per request.
- Breakpoints look back at most **20 content blocks**.

## 8. Stop reasons

`end_turn`, `max_tokens`, `stop_sequence`, `tool_use`, `pause_turn`, `refusal`,
`model_context_window_exceeded`.

- `stop_details` is populated **only** when `stop_reason == "refusal"`; it is
  `null` otherwise, so guard before reading it.
- `pause_turn` means a server-side tool loop hit its iteration limit — re-send
  the assistant turn to resume. Do **not** add a "Continue." user message.
- `model_context_window_exceeded` is distinct from `max_tokens`: the context
  window was exhausted, not the requested output cap.

## 9. Other API surface

- **Assistant prefill is removed** on Fable 5, Opus 5, Sonnet 5, and the
  4.6/4.7/4.8 family — a trailing assistant turn returns a 400. Use
  `output_config.format` (structured outputs) or a system-prompt instruction.
- **`output_format` is deprecated API-wide.** Use `output_config.format`.
- Required Messages API fields: `model`, `max_tokens`, `messages`.
- Strict tool use: `strict: true` is a **top-level field on the tool
  definition**, not on `tool_choice`; the schema needs
  `additionalProperties: false` and `required`.
- Parallel tool use is on by default; return **all** `tool_result` blocks in a
  **single** user message.
- Structured outputs are incompatible with citations (400) and with prefill.
- MCP is JSON-RPC 2.0. The connector needs both `mcp_servers` **and** a
  matching `mcp_toolset` entry in `tools`, with beta `mcp-client-2025-11-20`.
- **Image tokens**: approximately `(width_px × height_px) / 750`. Images are
  downscaled so neither dimension exceeds 1568px before that formula applies,
  so resolution above that ceiling stops costing more — send the smallest
  size that keeps the needed detail legible. Images count as input tokens
  like any other content; there is no separate image budget or flat fee.

## 10. Error codes

| Code | Type | Retryable |
|---|---|---|
| 400 | `invalid_request_error` | No |
| 401 | `authentication_error` | No |
| 403 | `permission_error` | No |
| 404 | `not_found_error` | No |
| 413 | `request_too_large` | No |
| 429 | `rate_limit_error` | **Yes** |
| 500 | `api_error` | **Yes** |
| 529 | `overloaded_error` | **Yes** |

SDKs retry 429 and 5xx automatically (default `max_retries=2`). Catch typed
exception classes, most specific first — never string-match error messages.

---

## Re-verification checklist

At each model launch, re-check in this order — these are the rows that move:

1. §1 model table — new ids, pricing, context, max output
2. §2 retirements — anything newly 404ing
3. §3 thinking table — the parameter shape changes nearly every generation
4. §5 server-tool version strings — all dated, all drift silently
5. §7 cache minimums — not monotonic, easy to get wrong

Then run `node test/smoke.js`; it fails on any app content that disagrees.
