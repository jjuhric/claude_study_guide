# Claude Cert Quest 🧭

[![Anthropic Certifications](https://img.shields.io/badge/Anthropic-Certifications%20Prep-d97757.svg)](https://www.pearsonvue.com/us/en/anthropic.html)
[![Offline Ready](https://img.shields.io/badge/PWA-Offline%20Ready%20(v24)-5a9e6f.svg)](https://jjuhric.github.io/claude_study_guide/)
[![Tests Passing](https://img.shields.io/badge/Tests-312%20Passing-5b7fa6.svg)](test/smoke.js)
[![License](https://img.shields.io/badge/License-MIT-8a6fae.svg)](LICENSE)

An enterprise-grade, gamified study platform and interactive simulator suite for the **Anthropic Claude Certification Program** — featuring 400 practice questions with 4-way per-option rationales, 100 Leitner spaced repetition flashcards, 44 deep-dive technical lessons, and 76+ interactive architectural sandboxes, animated concept cards, live API payload inspectors, interactive decision trees, glossary callout engines, mind mappers, inline lesson playgrounds, audio recaps, scenario explorers, sequence diagram visualizers, Socratic lesson probes, annotated SDK code walkthroughs, MicroVM execution models, Consensus voting engines, CLI emulators, rate limit visualizers, multiplayer arenas, AI tutors, topology validators, MCP execution engines, memory decay models, oral defense boards, and cryptographic credentials.

**🚀 Live Production App:** [https://jjuhric.github.io/claude_study_guide/](https://jjuhric.github.io/claude_study_guide/)

> **Disclaimer:** Unofficial community study companion — not affiliated with or endorsed by Anthropic. Every question, lesson, and sandbox is original practice material, **not** live exam content. Exam format, domain weightings, and official blueprints are published in the official exam guides inside **Anthropic Partner Academy**.

---

## 🎯 Certifications Covered

| Code | Certification | Target Audience | Focus Domains |
| :--- | :--- | :--- | :--- |
| **CCAO-F** | **Claude Certified Associate** (*Foundations*) | Consultants, Sellers, Delivery Leads | Prompting, Evaluation, Model Selection, Workflow Integration, Governance & Risk |
| **CCDV-F** | **Claude Certified Developer** (*Foundations*) | Engineers, Developers, Builders | Messages API, Tool Use, SDK & Streaming, Claude Code, Security, MCP |
| **CCAR-F** | **Claude Certified Architect** (*Foundations*) | Solutions Architects, System Designers | Agentic Topologies, Hybrid RAG, 80% Context Management, Tool Design |
| **CCAR-P** | **Claude Certified Architect** (*Professional*) | Principal Architects, Technical Leads | Multi-Agent Blackboard Systems, Zero-Trust MicroVMs, Circuit Breakers, FinOps |

---

## 🛠️ 76+ Interactive Labs, Simulators & Toolkits

Claude Cert Quest includes a comprehensive suite of hands-on sandboxes and diagnostic engines built right into the home dashboard:

| Tool | Category | What it does |
| :--- | :--- | :--- |
| 🎴 **Animated Concept Cards** | Pedagogy | 5-step auto-advancing animated cards walking through the full Claude API request lifecycle. |
| 🔬 **API Payload Inspector** | Pedagogy | Select Basic / Caching / Tool-Use / Extended Thinking and inspect the exact JSON request + response with annotated field tooltips. |
| 🌳 **Concept Decision Trees** | Pedagogy | Interactive branching flowcharts for "Should I use Extended Thinking?", "Is my prompt cacheable?", and "Do I need multi-agent?" |
| 📝 **Glossary Term Callouts** | Pedagogy | 10 key terms (Token Bucket, BFS Orchestrator, FIFO Truncation, etc.) with definitions, exam context, and filterable live search. |
| 🧠 **Mind Mapper** | Pedagogy | Interactive visual node graph mapping Claude architectural relationships. |
| 🧪 **Inline Playground** | Pedagogy | Edit live XML tags embedded directly inside study guide lesson text. |
| 📖 **30s Audio Recap** | Pedagogy | 30-second high-yield audio lesson recaps highlighting top exam rules. |
| ❓ **What-If Explorer** | Pedagogy | Explore Socratic edge-case scenario decision trees in study lessons. |
| 📊 **Sequence Diagrams** | Pedagogy | Interactive step-by-step architecture sequence visualizers embedded in lessons. |
| 💡 **Socratic Lesson Probes** | Pedagogy | Deep-dive conceptual reflection probes at the bottom of study guide lessons. |
| 🔍 **SDK Code Annotator** | Pedagogy | Annotated Python & TypeScript SDK code walkthroughs with parameter callouts. |
| 🎙️ **Audio Lectures** | Pedagogy | Synchronized audio lectures for each lesson with autoscrolling transcript highlights. |
| 🔒 **MicroVM Sandbox** | Security | Step-through interactive model of Firecracker MicroVM tool execution environments. |
| ⚖️ **Consensus Voting Engine** | Evaluation | Simulate Majority Vote and LLM-as-a-Judge evaluation setups across Sonnet and Haiku. |
| ⏱️ **Cache TTL Simulator** | Performance | Interactive timeline mapping 5-minute prompt caching TTL renewal windows and cache warming. |
| 🎙️ **Audio Speed Drill** | Audio | 10-second rapid voice answer challenges with live speech waveform feedback. |
| 💻 **Claude CLI Simulator** | Developer | Interactive terminal simulator executing `claude` CLI commands (`/cost`, `/compact`, `/help`). |
| ⚡ **Rate Limit Visualizer** | Infrastructure | Simulate Tier 1-4 TPM/RPM token bucket refills and 429 exponential backoff with jitter. |
| 📊 **Custom Deck Builder** | Spaced Repetition | Build, edit, and export custom CSV flashcard study decks directly into the Leitner study pool. |
| 🏆 **Vector SVG Badge** | Credential | Export scalable SVG vector badges with embedded cryptographic SHA-256 integrity seals. |
| ⚔️ **P2P Whiteboard Duel** | Multiplayer | 3-minute real-time architecture wiring duel against live peers over BroadcastChannel. |
| 🧪 **Prompt Optimizer Engine** | Prompting | Refactor unformatted raw prompts into XML positive framing with thinking budget placeholders. |
| 📈 **Pareto Frontier Explorer** | Analytics | Scatter plot mapping P99 latency vs request cost to pinpoint Pareto-optimal model choices. |
| 🎙️ **Audio Podcast Briefing** | Audio | Stream continuous spoken active recall flashcards with automated pause-and-reveal timing. |
| 🏆 **OpenBadge Credential Generator** | Credential | Export W3C OpenBadge v2.0 JSON-LD metadata for LinkedIn & digital portfolio sharing. |
| 🧩 **Multi-Agent DAG Builder** | Orchestration | Construct, visualize, and validate subagent DAG topologies with automatic SDK export. |
| ⚡ **Red-Team Attack Simulator** | Security | Test system prompt defenses against indirect prompt injection and tool hijacking attacks. |
| 📊 **PDF Diagnostic Scorecard** | Reporting | Export a multi-page printable candidate readiness PDF report with domain breakdowns. |
| 📊 **Claude 3.5 vs 3.7 Matrix** | Model Selection | Side-by-side comparative matrix evaluating Sonnet 3.7 extended thinking vs Haiku model tradeoffs. |
| 🧩 **Compaction Playground** | Context | Multi-turn chat simulator demonstrating 80% capacity semantic compaction into `<rolling_state>` tags. |
| ⚡ **Token Budget & Cost Profiler** | FinOps | Real-time API billing profiler across thinking budget tokens and prompt caching read discounts. |
| 🎙️ **Architectural Defense Board** | Interview | Defend enterprise system designs before a simulated panel of CISO, FinOps, and Chief Architect executives. |
| 📉 **Memory Decay Curve Simulator** | Spaced Repetition | Ebbinghaus mathematical retention decay modeling ($R = e^{-t/S}$) with optimal review dates. |
| ⚡ **Cache Breakpoint Debugger** | Prompting | Detect prefix invalidations, dynamic timestamp bugs, and sub-1024 token minimum floor errors. |
| 🎮 **60-Second Flashcard Blitz** | Arcade | Fast-paced active recall arcade challenge matching terms and definitions before time expires. |
| 🖨️ **1-Page Custom Cram Sheet** | Cramming | Printable high-yield single-page reference sheet formatted for last-minute test day review. |
| 📊 **Brier Confidence Calibration** | Metacognition | Rate subjective certainty before answering to compute your mathematical Brier calibration score. |
| 🔌 **Mock MCP Tool Simulator** | Developer | Test real-time Anthropic Messages API `tool_use` requests and stream simulated `tool_result` payloads. |
| 👥 **Study Cohort Hub** | Team | Join or create private study groups with 6-digit team codes and compare aggregate readiness radars. |
| 🎨 **Custom Theme Studio** | Personalization | Switch interface accents between Claude Terracotta, Cyberpunk Neon, Midnight Slate, and Solarized Gold. |
| ⏱️ **Exam Date Countdown Planner** | Planning | Set scheduled Pearson VUE test date to calculate personalized daily question & lesson pacing. |
| 🧩 **System Architecture Sandbox** | Topology | Assemble and validate multi-tier enterprise pipelines with routers, caching, tools, and sandboxes. |
| 🎙️ **Voice Notes & Audio Memos** | Audio | Record and playback 15-second auditory self-study voice annotations attached to lessons. |
| 🔔 **Web Notification Reminders** | Reminders | Browser notification alerts for due flashcards and daily study streak preservation. |
| 👤 **Candidate Identity & Profile** | Identity | Customize candidate callsigns, pick from 10 avatar badges, and manage unique verification IDs. |
| 👥 **Real-Time Peer Quiz Battle** | Multiplayer | 1v1 rapid-recall arena with 6-digit room codes, WebRTC/BroadcastChannel sync, and live scorecards. |
| 🎮 **Arcade Survival Gauntlet** | Arcade | Sudden-death endless quiz gauntlet with 3 lives, accelerating countdown clocks, and multipliers. |
| 💬 **Socratic AI Dialogue Tutor** | Tutoring | Interactive multi-turn Socratic dialogues exploring XML tags, caching thresholds, and determinism. |
| 🎧 **Voice-Activated Commuter Mode** | Audio | Hands-free speech narration with voice answer recognition ("Option 1-4") for driving/walking. |
| 📊 **400-Question Mastery Heatmap** | Diagnostic | 2D visual pixel matrix mapping mastery (green/red/gray) across all 400 questions in the bank. |
| 🏆 **Rotating Daily Boss Challenge** | Daily | 24-hour rotating 5-question boss challenge with a 60-second clock and daily XP bounties. |
| 📄 **Cryptographic Verifiable Diploma** | Credential | Printable graduation diploma with computed SHA-256 integrity signature and verification seal. |
| 🏛️ **Architect War Room** | Architecture | Interactive multi-tier enterprise scenario challenges with live $/P99 latency scorecards. |
| 🧪 **Golden Prompt Studio** | Prompting | Real-time XML linter, positive framing validator, and thinking token budget advisor. |
| 🔌 **MCP Protocol Inspector** | Protocol | Step through Model Context Protocol (MCP) JSON-RPC 2.0 initialization and tool execution loops. |
| 🧩 **Tool Schema Builder** | Developer | Visual constructor and validator for Anthropic Messages API tool JSON schemas with 1-click SDK export. |
| 💻 **SDK Code Playground** | Developer | Side-by-side Python 3.10+ and TypeScript SDK generator with Prompt Caching and Extended Thinking. |
| 👑 **Adaptive Boss Battle** | Testing | 25-question computer-adaptive final mock exam simulation with pacing telemetry. |
| ⚡ **Exam Trap Hunter** | Mini-Game | Spot subtle API misconfigurations, un-jittered retry loops, and negative prompt traps in code snippets. |
| 💰 **Model Cost & ROI Calculator** | FinOps | Calculate exact monthly bills and P99 latency across Sonnet, Haiku, and Opus with Prompt Caching (85% off) and Batch API (50% off). |
| 🧱 **200k Context & 80% Compaction** | Context | Interactive visual token budget bar demonstrating FIFO truncation failure vs structured `<key_facts>` semantic compaction. |
| 🎙️ **Hands-Free Audio Quiz** | Audio | Continuous spoken active recall using Web Speech TTS with pause-and-reveal timing. |
| 🧠 **Extended Thinking Trace Explorer** | Reasoning | Visual chain-of-thought simulator demonstrating `<thinking>` block generation under different token budgets. |
| 📊 **Global Candidate Benchmark Curve** | Analytics | Statistical Gaussian Bell Curve calculating your global percentile placement out of 1000. |
| ⏱️ **Strict Exam Pacing Simulator** | Pacing | 90-second per-question countdown clock simulation with post-run pacing telemetry. |
| 🎙️ **Voice Recognition Flashcards** | Audio | Practice active recall by speaking answers into your microphone with automated keyword matching. |
| 📈 **4-Track Mastery Radar Overlay** | Analytics | Multi-layered polygonal radar diagram overlaying all 4 certification tracks on a unified mastery chart. |
| 🧩 **Custom Exam Blueprint Builder** | Testing | Configure tailored mock exams with custom domain ratios, question counts, and time limits. |
| 📊 **95% Pass Probability Model** | Analytics | Mathematical standard error and Wald normal approximation calculating true pass confidence intervals. |
| 📋 **8-Module Exam Cram Sheets** | Cramming | Track-by-track quick-reference cheat sheets with Active Recall blur mode and audio briefings. |
| 📄 **Executive Candidate Dossier** | Portfolio | Generates a printable candidate readiness portfolio formatted for LinkedIn and employer sponsorship. |
| ☁️ **GitHub Gist Cloud Sync** | Sync | Seamless cross-device progress synchronization across Desktop, Laptop, and Mobile via private GitHub Gists. |
| 🌐 **Multi-Language Localization** | Global | Instant UI language switching between English, Español, 日本語, Deutsch, and Français. |
| 🌐 **Global Community Leaderboard** | Community | Opt-in community telemetry ranking candidates by total XP, speed-run streaks, and global percentile. |
| 📦 **Anki Deck Exporter** | Spaced Repetition | 1-click export of pre-formatted Anki spaced repetition decks with custom CSS. |
| 📦 **Offline Bundle Downloader** | Offline | Download a self-contained zero-dependency offline package for air-gapped study environments. |
| 📱 **Native Mobile Packaging Guide** | Mobile | Capacitor configuration and packaging instructions for native iOS (.ipa) and Android (.apk) apps. |

---

## ⌨️ Power-User Keyboard Shortcuts

Drill at maximum speed without touching the mouse. Press **`?`** or **`Ctrl + /`** anytime to open the HUD:

* **`1` – `4`**: Instant answer selection in Quizzes, Mocks, and Boss Battles.
* **`Space` / `Enter`**: Flip flashcards or advance to next question.
* **`F`**: Toggle question flag during Mock Exams.
* **`Ctrl + K`**: Open Universal Study Material Search.
* **`Ctrl + B`**: Open Bookmarks & Notes Hub.
* **`Ctrl + M`**: Toggle Web Audio Sound (On / Mute).
* **`Ctrl + T`**: Cycle Theme (Dark / Light / Auto).
* **`Esc`**: Close any active modal.

---

## 🧪 Automated Testing & Verification

Claude Cert Quest has a zero-dependency test suite validating every component:

```bash
# Run comprehensive offline test suite (312 assertions)
node test/smoke.js
```

### What `test/smoke.js` verifies:
* ✅ Content integrity of all 400 questions, 4-way per-option rationales, and 100 flashcards.
* ✅ Exact domain-to-lesson mapping across all 4 certification tracks.
* ✅ Web Audio synthesizer, state migration, and Leitner spaced repetition ladders.
* ✅ Full rendering and state validation for all 76+ interactive tools, multiplayer channels, and simulators.
* ✅ Compliance with official NDAs and unverified exam claim policies.

---

## 💻 Running Locally

Because the application loads structured study data via `fetch()`, serve the directory over HTTP:

```bash
# Start a local HTTP server
npx serve .
# or
python -m http.server 4173
```

Then open `http://localhost:4173` in your browser.

---

## 📜 License

MIT License — feel free to use, modify, and build upon this study companion.
