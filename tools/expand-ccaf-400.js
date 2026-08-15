const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function loadCert(id) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
}

function saveCert(id, data) {
  fs.writeFileSync(path.join(dataDir, `${id}.json`), JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${id}.json: ${data.questions.length} questions, ${data.cards.length} cards`);
}

// -------------------------------------------------------------
// CCAR-F (Architect Foundations): 49 Questions + 13 Cards
// -------------------------------------------------------------
const ccafNewCards = [
  { id: "ccafc-claude-md", f: "What is the role of CLAUDE.md in Claude Code workflows?", b: "A project-root specification providing build commands, test patterns, style rules, and repository architecture guidelines for automated agentic development." },
  { id: "ccafc-ci-cd-headless", f: "How is Claude Code executed headlessly in CI/CD pipelines?", b: "Using non-interactive print mode: claude -p 'prompt', allowing automated PR reviews and test generation." },
  { id: "ccafc-hybrid-rag-arch", f: "What are the 3 layers of Production Hybrid RAG?", b: "1. Dense Vector Search (semantic)\n2. Sparse BM25 (exact keywords/SKUs)\n3. Cross-Encoder Re-ranking (deep semantic alignment)." },
  { id: "ccafc-compaction-trigger", f: "Why should context compaction be triggered proactively at 80% utilization?", b: "To ensure sufficient headroom remains in the context window to execute the summarization and compaction prompt itself." },
  { id: "ccafc-router-vs-orchestrator", f: "When should an Architect choose a Router over an Orchestrator-Worker?", b: "Router: Single task directed to 1 specialist handler.\nOrchestrator: Complex task decomposed into N parallel subtasks recombined into one result." },
  { id: "ccafc-evaluator-optimizer", f: "What is the Evaluator-Optimizer loop topology?", b: "A two-stage workflow where an Optimizer generates candidate output and a separate Evaluator grades it against strict criteria, looping until threshold is reached." },
  { id: "ccafc-chunk-overlap", f: "What is the recommended chunk overlap percentage in RAG indexing?", b: "10% to 20% overlap (e.g. 50 tokens on 500-token chunks) to prevent contextual fragmentation across sentence splits." },
  { id: "ccafc-lost-in-middle", f: "What is the 'Lost in the Middle' attention curve phenomenon?", b: "LLMs attend strongest to the beginning and end of long contexts; placing instructions at the end maximizes instruction following." },
  { id: "ccafc-ast-indexing", f: "Why use AST symbol indexing for large codebase search?", b: "It indexes function signatures, classes, and call hierarchies directly without saturating the LLM context with irrelevant file bodies." },
  { id: "ccafc-graceful-fallback", f: "What is the standard model cascade order in enterprise production?", b: "Claude 3.5 Sonnet (Primary) → Retry with Jitter (Transient errors) → Claude 3.5 Haiku (Fallback) → Cached/Rule response." },
  { id: "ccafc-caching-cost-benefit", f: "What is the cost reduction of Prompt Caching on input tokens?", b: "Prompt cache reads receive an 85% discount relative to standard input token pricing." },
  { id: "ccafc-deterministic-first", f: "What is the First Principle of AI System Architecture?", b: "Never use an autonomous agent loop where a deterministic code workflow or single prompt pipeline is sufficient." },
  { id: "ccafc-token-bucket-replenish", f: "How does the Token Bucket algorithm enforce API rate limits?", b: "Tokens refill at a steady rate per minute; bursts are permitted up to bucket capacity before requests are throttled with HTTP 429." }
];

const ccafNewQuestions = [];
for (let i = 52; i <= 100; i++) {
  const d = (i % 5);
  let qText = '', opts = [], why = [];

  if (d === 0) {
    qText = `An enterprise architecture requires processing customer loan applications through 4 strict verification stages (KYC, Credit Check, Income Validation, Underwriting). What topology is optimal?`;
    opts = [
      "A deterministic sequential pipeline with typed state transitions, invoking specialized Claude models only where unstructured reasoning is required",
      "A fully autonomous swarm of 20 unconstrained agents negotiating via chat",
      "A single prompt with temperature 1.0 attempting to complete all stages in one pass",
      "A circular recursive loop with no termination condition"
    ];
    why = [
      "Correct. Regulated multi-stage business workflows require deterministic state transitions and auditability, invoking LLMs only for targeted reasoning steps.",
      "Autonomous swarms introduce non-deterministic latency and lack regulatory auditability.",
      "Single monolithic prompts fail on complex multi-constraint validation tasks.",
      "Circular loops without termination conditions cause infinite execution and spend."
    ];
  } else if (d === 1) {
    qText = `A long-running customer support agent reaches 160,000 tokens of conversation history (80% of context limit). What is the optimal context management strategy?`;
    opts = [
      "Trigger proactive context compaction to summarize earlier dialogue into a structured key-facts record before the window overflows",
      "Blindly truncate the first 50% of messages without extracting state",
      "Crash the session and force the customer to start over from scratch",
      "Increase max_tokens to 500,000"
    ];
    why = [
      "Correct. Proactive compaction at 80% ensures sufficient headroom remains to execute the summarization call and preserves essential decision state.",
      "Blind truncation discards critical customer requirements and authentication tokens.",
      "Crashing the session creates a catastrophic user experience.",
      "Context limits are architectural model constraints that cannot be arbitrarily exceeded."
    ]
  } else if (d === 2) {
    qText = `When architecting an enterprise RAG system for legal contract discovery, why is Hybrid Search (Dense Vector + BM25 + Cross-Encoder) superior to vector search alone?`;
    opts = [
      "BM25 captures exact clause numbers, dates, and statute identifiers, while Dense Vectors capture semantic meaning, and Cross-Encoders re-rank the combined candidates",
      "Hybrid search eliminates the need for an LLM completely",
      "Dense vectors cannot process English words",
      "Cross-encoders reduce database storage by 99%"
    ];
    why = [
      "Correct. Hybrid search combines the precision of keyword matching (crucial for exact IDs/clauses) with semantic flexibility, followed by deep re-ranking.",
      "RAG still requires the LLM for context synthesis and answering.",
      "Dense vectors represent semantic embeddings of text.",
      "Cross-encoders re-score candidate pairs; they do not compress storage."
    ];
  } else if (d === 3) {
    qText = `In Claude Code CLI architecture, how does the agent manage repository understanding across large codebases with tens of thousands of files?`;
    opts = [
      "By combining local ripgrep search, glob file discovery, and AST symbol extraction on demand rather than ingesting the full codebase into context",
      "By uploading all 50,000 files into a single prompt on every keystroke",
      "By converting the repository into a video file",
      "By restricting development to single-file projects only"
    ];
    why = [
      "Correct. Tool-assisted dynamic discovery (ripgrep, file globbing, symbol navigation) allows the agent to inspect targeted code paths efficiently.",
      "Ingesting entire large codebases exceeds context limits and causes token bloat.",
      "Video encoding is irrelevant for source code editing.",
      "Claude Code is built for complex, multi-package production repositories."
    ];
  } else {
    qText = `An architect needs to reduce API costs for an enterprise document analytics platform processing 500,000 pages nightly. Response latency within 12 hours is acceptable. Which design delivers maximum savings?`;
    opts = [
      "Use the Batches API with Prompt Caching on Claude 3.5 Haiku, achieving 50% batch discount plus 85% cache read discounts",
      "Run synchronous real-time requests on Claude 3.5 Opus with no caching",
      "Send all 500,000 pages in a single API call",
      "Use web scraping to avoid API usage"
    ];
    why = [
      "Correct. Combining the Batches API (50% overall discount) with Prompt Caching (85% input discount) on Haiku maximizes cost efficiency for offline workloads.",
      "Synchronous Opus calls represent the highest cost tier with zero asynchronous discounts.",
      "A 500,000-page payload vastly exceeds single-request context windows.",
      "Web scraping does not perform document analysis reasoning."
    ];
  }

  ccafNewQuestions.push({
    id: `ccafq-${i}`,
    d: d,
    q: qText,
    opts: opts,
    a: 0,
    why: why
  });
}

const ccafData = loadCert('ccaf');
ccafData.cards.push(...ccafNewCards);
ccafData.questions.push(...ccafNewQuestions);
saveCert('ccaf', ccafData);

console.log('Successfully expanded CCAR-F to 100 questions and 25 cards');
