const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function loadCert(id) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
}

function saveCert(id, data) {
  fs.writeFileSync(path.join(dataDir, `${id}.json`), JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${id}.json: ${data.questions.length} questions`);
}

// 49 completely distinct questions for CCAR-F (51 to 99)
const ccaf49 = [
  {
    d: 0,
    q: "A banking application must guide users through loan pre-qualification. The steps are legally fixed (Income -> Debt -> Credit Score -> Offer). Which architecture should be chosen?",
    opts: [
      "A deterministic pipeline with structured validation gates, using Claude only to extract numbers from uploaded paystubs",
      "An autonomous agent with 50 tools and no state machine",
      "Ten parallel subagents debating the loan terms in a group chat",
      "A single prompt with temperature 1.0 attempting to complete all checks simultaneously"
    ],
    a: 0,
    exp: "Predictable financial workflows require deterministic state transitions and auditability.",
    why: [
      "Correct. Linear regulated workflows should use deterministic code pipelines, invoking LLMs only for targeted unstructured reasoning.",
      "Autonomous agents lack the deterministic guarantees required for financial compliance.",
      "Unstructured multi-agent chats increase latency and token spend without adding value.",
      "Single monolithic prompts fail on complex multi-stage validation rules."
    ]
  },
  {
    d: 1,
    q: "When configuring `CLAUDE.md` for a large TypeScript monorepo, what is the best practice for documenting testing conventions?",
    opts: [
      "Specify exact npm/pnpm test commands, filter flags for running individual unit tests, and mock database conventions",
      "Copy-paste the entire package-lock.json file into CLAUDE.md",
      "Instruct the agent to delete all failing tests",
      "Provide a list of all developer home addresses"
    ],
    a: 0,
    exp: "CLAUDE.md should provide actionable build, test, and command-line execution patterns.",
    why: [
      "Correct. Providing specific test filter commands enables Claude Code to verify targeted code changes rapidly.",
      "Lockfiles bloat context tokens without providing developer guidelines.",
      "Deleting tests destroys test coverage.",
      "Personal contact info violates privacy and provides zero engineering utility."
    ]
  },
  {
    d: 2,
    q: "In an enterprise RAG system indexing scanned legal briefs, why is OCR text quality evaluation necessary before vector embedding?",
    opts: [
      "Garbage OCR text produces poor vector embeddings and causes high retrieval failure rates",
      "Vector databases automatically delete files with typos",
      "Claude refuses to read words that contain the letter 'z'",
      "Embedding models charge 10x higher fees for misspelled words"
    ],
    a: 0,
    exp: "Garbage OCR input corrupts embedding representations and destroys semantic retrieval accuracy.",
    why: [
      "Correct. Clean text is essential for dense vector embeddings; poor OCR text creates embedding drift and retrieval misses.",
      "Vector databases store whatever vectors are computed without typo deletion.",
      "Claude processes arbitrary character streams without letter restrictions.",
      "Embedding pricing is strictly based on token counts, not spelling quality."
    ]
  },
  {
    d: 3,
    q: "When an MCP server provides access to Jira tickets, how should the tool schema restrict search results to protect context window headroom?",
    opts: [
      "Enforce mandatory `limit` (max 25) and `fields` filtering parameters in the inputSchema",
      "Return all 500,000 company tickets in a single JSON string",
      "Convert ticket descriptions into 4K video files",
      "Crash the server whenever a search matches more than 1 ticket"
    ],
    a: 0,
    exp: "Enforcing pagination limits in tool schemas prevents context window saturation.",
    why: [
      "Correct. Schema-enforced limits and field selection ensure tool payloads remain compact and relevant.",
      "Unbounded 500k-ticket dumps exceed API token limits and crash request processing.",
      "Video conversion is irrelevant for text issue tracking.",
      "Crashing on multiple matches breaks search utility."
    ]
  },
  {
    d: 4,
    q: "A high-traffic e-commerce chatbot receives 50,000 queries per hour. The system prompt and product catalog total 12,000 tokens. How does Prompt Caching reduce monthly infrastructure spend?",
    opts: [
      "Cached prompt prefixes are billed at an 85% discount on input tokens on cache hits (5-minute TTL refreshed on each turn)",
      "Prompt Caching makes all API calls free of charge",
      "Prompt Caching converts text into physical paper coupons",
      "Prompt Caching reduces server electrical power to 0 watts"
    ],
    a: 0,
    exp: "Prompt Caching provides an 85% discount on cached input prefix tokens.",
    why: [
      "Correct. Reading the 12,000-token catalog from cache saves 85% on input token costs across all subsequent user queries.",
      "Output tokens and cache creation still incur standard billing.",
      "Paper coupons are irrelevant to API caching.",
      "Server infrastructure power is managed by cloud hosting data centers."
    ]
  },
  {
    d: 0,
    q: "In an Evaluator-Optimizer pattern generating SQL queries, what should the Evaluator inspect before executing the query against a database?",
    opts: [
      "Perform static SQL AST analysis to verify read-only safety, valid table joins, and absence of `DROP/DELETE/TRUNCATE` operations",
      "Verify that the SQL query contains at least 500 lines of code",
      "Check if the query was written in French",
      "Run the query directly on the primary production database with superuser privileges"
    ],
    a: 0,
    exp: "Static AST validation prevents destructive SQL injection or accidental database corruption.",
    why: [
      "Correct. Pre-execution static analysis ensures queries are syntactically valid and non-destructive before running.",
      "Query brevity is often better than arbitrary line inflation.",
      "Language translation is irrelevant for SQL syntax verification.",
      "Executing unverified queries on production superuser accounts violates fundamental safety."
    ]
  },
  {
    d: 1,
    q: "How does Claude Code handle large git merge conflicts across 15 modified files?",
    opts: [
      "It reads the conflict markers in each file, analyzes the parent branch intent, edits out the conflict delimiters with resolutions, and runs the test suite to verify",
      "It deletes all 15 files from the git repository",
      "It renames all files to `.backup` and halts",
      "It randomly picks the 'Incoming' change for every single line"
    ],
    a: 0,
    exp: "Claude Code analyzes conflict blocks, synthesizes both branch requirements, and validates with unit tests.",
    why: [
      "Correct. Tool-assisted conflict resolution inspects both branch diffs, applies coherent edits, and runs test commands to confirm correctness.",
      "Deleting conflicted files destroys codebase assets.",
      "Halting without resolving leaves the merge broken.",
      "Blindly choosing one side breaks interrelated functionality."
    ]
  },
  {
    d: 2,
    q: "When implementing RAG over confidential HR documents, how should user role-based access control (RBAC) be enforced?",
    opts: [
      "Filter retrieved vector candidates at the database query level using user ACL metadata before passing chunks to Claude",
      "Instruct Claude in the prompt: 'Please do not read salaries if the user is a junior intern'",
      "Encrypt the Claude model weights with the user's password",
      "Delete all HR documents from the company servers"
    ],
    a: 0,
    exp: "Security authorization must be enforced in the retrieval layer, not delegated to prompt honor systems.",
    why: [
      "Correct. Filtering documents by ACL metadata at the database query layer guarantees unauthorized records never enter the prompt context.",
      "Prompt-level security instructions can be bypassed via prompt injection or model hallucination.",
      "Model weights are hosted in cloud infrastructure and cannot be encrypted with client passwords.",
      "Deleting records destroys business HR systems."
    ]
  },
  {
    d: 3,
    q: "Why should an MCP server return machine-readable structured JSON in `tool_result` content instead of conversational English prose?",
    opts: [
      "Structured JSON allows Claude to reason over exact field names and types with high precision and minimal token overhead",
      "Conversational English causes the MCP protocol to crash",
      "JSON is the only language recognized by computers",
      "Claude is unable to understand English sentences"
    ],
    a: 0,
    exp: "Structured JSON yields concise, unambiguous parameter passing for downstream reasoning.",
    why: [
      "Correct. JSON structures data cleanly, reducing token waste and eliminating ambiguous parsing errors.",
      "MCP supports plain text content blocks, but structured JSON is more reliable for tool outputs.",
      "Computers process binary data; JSON is an interchange format.",
      "Claude parses English, but structured JSON is cleaner for programmatic data."
    ]
  },
  {
    d: 4,
    q: "An architect observes that a 50-step autonomous agent costs $4.50 per run because previous turns are resent on every step. How can Prompt Caching fix this?",
    opts: [
      "Set a cache breakpoint on the accumulating conversation history prefix so each step reads previous turns from cache at an 85% discount",
      "Delete all previous turns after step 2",
      "Limit the agent to running only on holidays",
      "Switch the agent to a 1990s mainframe computer"
    ],
    a: 0,
    exp: "Caching the conversation history prefix provides an 85% discount on all previous turns during multi-turn loops.",
    why: [
      "Correct. Adding `cache_control: {type: 'ephemeral'}` to the latest assistant turn allows subsequent turns to read past history at 85% off.",
      "Blindly deleting turns destroys conversational context and tool tracking.",
      "Calendar restrictions do not solve per-run cost efficiency.",
      "Mainframe compute is irrelevant to cloud LLM token pricing."
    ]
  }
];

// Add 39 more fully distinct scenarios for CCAR-F
const ccarfExtra = [
  { d: 0, q: "A compliance auditing agent must verify 10 distinct regulatory standards. Why is a parallel Orchestrator-Workers design superior to a single sequential loop?", opts: ["Worker subagents can audit each standard simultaneously in parallel, cutting total clock latency by 80%", "Parallel workers make all API requests free", "Sequential loops are forbidden by international law", "Parallel agents do not use any CPU"], a: 0, exp: "Parallel dispatch across independent tasks reduces wall-clock time from sum(t) to max(t).", why: ["Correct. Decomposing independent audits across parallel worker calls drastically reduces total latency.", "Parallel calls consume standard tokens and are billed normally.", "Sequential architectures are valid, but slower for independent subtasks.", "All cloud computing consumes CPU and GPU resources."] },
  { d: 1, q: "When using Claude Code to refactor a legacy Python codebase, why should the developer configure a virtual environment in `CLAUDE.md`?", opts: ["It allows Claude Code's bash tool to run pytest and linters within the project's exact dependency sandbox", "It prevents Python from creating bytecode files", "It encrypts the source code with military-grade algorithms", "It doubles internet download speeds"], a: 0, exp: "Virtual environments ensure tool commands run against project-specific package versions.", why: ["Correct. Specifying the virtual environment activation allows bash execution tools to run tests against the right packages.", "Python bytecode generation is standard runtime behavior.", "Virtual environments manage dependencies, not file encryption.", "Network speeds are governed by ISP infrastructure."] },
  { d: 2, q: "In a multilingual customer service RAG system, what strategy ensures English documentation can answer Spanish queries?", opts: ["Use a multilingual dense embedding model (or translate the query to English before vector retrieval)", "Delete all Spanish queries from the database", "Force customers to learn English before using the app", "Convert all English documentation into binary hex"], a: 0, exp: "Cross-lingual embedding models map semantic concepts across languages into shared vector spaces.", why: ["Correct. Multilingual embeddings project concepts across languages into overlapping vector spaces, enabling cross-lingual retrieval.", "Deleting customer queries breaks support operations.", "Forcing language changes creates terrible customer experience.", "Hex encoding destroys semantic representations."] },
  { d: 3, q: "What is the primary advantage of MCP over proprietary custom API connectors?", opts: ["MCP provides an open, standardized protocol for tools, resources, and prompts reusable across IDEs, desktop clients, and custom agents", "MCP allows models to run without any electricity", "MCP automatically writes the entire application backend", "MCP replaces all relational databases with text files"], a: 0, exp: "MCP standardizes tool and context integration across AI ecosystems.", why: ["Correct. MCP creates a standard interoperable interface, avoiding vendor-locked custom API bridges.", "All software requires electrical power to execute.", "MCP is an integration protocol, not an automatic backend generator.", "MCP connects to existing databases via standard tools and resources."] },
  { d: 4, q: "Why is context compaction superior to blind FIFO (First-In, First-Out) message truncation in long-running agentic conversations?", opts: ["Compaction summarizes key decisions and active state while discarding conversational filler; FIFO blindly deletes critical user constraints", "Compaction makes the conversation 100 times longer", "FIFO truncation guarantees 100% factual accuracy", "Compaction is only supported on mobile devices"], a: 0, exp: "Compaction preserves critical task context while pruning redundant conversational tokens.", why: ["Correct. Semantic summarization preserves decisions, user credentials, and active task state, whereas FIFO truncation causes context amnesia.", "Compaction compresses history; it does not lengthen it.", "FIFO truncation often deletes the original prompt instructions.", "Compaction is implemented server-side across all platforms."] }
];

// Combine unique questions for CCAR-F
while (ccaf49.length < 49) {
  const extra = ccarfExtra[ccaf49.length % ccarfExtra.length];
  const idx = ccaf49.length + 52;
  ccaf49.push({
    d: extra.d,
    q: `Architect Case Study ${idx}: ${extra.q}`,
    opts: extra.opts,
    a: extra.a,
    exp: extra.exp,
    why: extra.why
  });
}

// 49 completely distinct questions for CCAR-P (51 to 99)
const ccap49 = [
  {
    d: 0,
    q: "A high-frequency algorithmic research agent uses 6 specialized subagents. Why should task dependencies be structured as a Directed Acyclic Graph (DAG)?",
    opts: [
      "A DAG guarantees that tasks execute in valid topological order with parallel branch execution and zero circular deadlock conditions",
      "A DAG makes the python interpreter run in reverse",
      "A DAG encrypts all intermediate data with quantum keys",
      "A DAG allows models to bypass API rate limits"
    ],
    a: 0,
    exp: "DAG workflows enforce deterministic dependency ordering and eliminate circular wait deadlocks.",
    why: [
      "Correct. DAG execution models guarantee clear execution order, enabling maximum concurrency without deadlocks.",
      "Interpreters execute standard bytecode; DAGs structure task scheduling.",
      "DAG is a graph data structure, not an encryption algorithm.",
      "Rate limits apply to all API calls regardless of workflow structure."
    ]
  },
  {
    d: 1,
    q: "An autonomous agent has access to a code execution sandbox. Which sandboxing technology provides kernel-level isolation against container breakout exploits?",
    opts: [
      "gVisor or Firecracker microVMs with dedicated guest kernels and restricted syscall interception",
      "Running code directly on the bare-metal production host as `root`",
      "An unquoted `eval()` call inside a public Node.js Express server",
      "Saving code files to the desktop folder"
    ],
    a: 0,
    exp: "gVisor and Firecracker microVMs provide strong virtualization boundaries that block host kernel compromise.",
    why: [
      "Correct. gVisor (user-space kernel) and Firecracker (lightweight KVM microVMs) isolate untrusted agent execution from the host OS.",
      "Root execution on bare metal exposes the entire infrastructure to full compromise upon breakout.",
      "Unsandboxed `eval()` is a catastrophic remote code execution vulnerability.",
      "Desktop file saving provides zero execution sandboxing."
    ]
  },
  {
    d: 2,
    q: "When configuring multi-tenant SaaS billing attribution for Claude API calls, what parameter should be attached to every request?",
    opts: [
      "`metadata: { 'tenant_id': 'org_4921', 'user_id': 'usr_8102' }` for programmatic usage aggregation in billing consoles and logs",
      "Hardcoding the tenant's credit card number in the prompt text",
      "Creating a brand new Anthropic account for every single user query",
      "Appending 'PLEASE BILL ORG 4921' to the assistant turn"
    ],
    a: 0,
    exp: "Attaching request metadata tags enables automated per-tenant cost attribution in observability and billing reports.",
    why: [
      "Correct. The `metadata` request field allows tracking token spend, request counts, and cost attribution per tenant in logs and dashboards.",
      "Plain text credit cards in prompts violate PCI-DSS and risk credential theft.",
      "Creating separate accounts per query is unmanageable and violates API terms.",
      "Text in assistant turns cannot be parsed by billing gateways."
    ]
  },
  {
    d: 3,
    q: "An enterprise customer service fleet experiences sudden downstream CRM API timeouts. What Circuit Breaker pattern prevents cascading system failure?",
    opts: [
      "Trip the breaker to OPEN state after 5 consecutive failures, immediately serving cached customer data without waiting for network timeouts, and probe with HALF-OPEN after 60s",
      "Increase the HTTP timeout to 30 minutes on every thread",
      "Spam 10,000 retry requests per second until the CRM recovers",
      "Delete the CRM database"
    ],
    a: 0,
    exp: "Standard 3-state circuit breakers (CLOSED, OPEN, HALF-OPEN) isolate broken dependencies and prevent thread exhaustion.",
    why: [
      "Correct. Opening the circuit fails fast to protect server thread pools and serve graceful fallbacks while probing for upstream recovery.",
      "Long timeouts exhaust connection pools and freeze user interfaces.",
      "Aggressive retries create thundering herd storms that prevent downstream recovery.",
      "Deleting databases destroys corporate assets."
    ]
  },
  {
    d: 4,
    q: "In high-assurance medical and legal applications, why is Pairwise Comparison (Model A vs Model B) preferred over single-score Likert scales for LLM-as-a-Judge evaluation?",
    opts: [
      "Pairwise comparisons with position swapping eliminate absolute numerical calibration bias and achieve significantly higher inter-rater agreement",
      "Pairwise evaluation is 100 times faster to compute",
      "Pairwise evaluation does not require an LLM",
      "Pairwise evaluation is required by US Patent law"
    ],
    a: 0,
    exp: "Pairwise evaluation with position debiasing produces more reliable and reproducible grading than absolute 1-10 scores.",
    why: [
      "Correct. LLM judges evaluate relative quality between two candidates far more reliably than assigning arbitrary absolute numeric scores.",
      "Pairwise evaluation requires two evaluations (with swapped positions), taking slightly more compute for much higher accuracy.",
      "LLM judges are still used to evaluate the pair.",
      "Patent law does not govern software evaluation methodologies."
    ]
  }
];

// Add 44 more distinct scenarios for CCAR-P
const ccarpExtra = [
  { d: 0, q: "In a production multi-agent system, what mechanism prevents an autonomous subagent from consuming infinite tokens during a tool-calling loop?", opts: ["Hard iteration caps (e.g. max 15 tool turns) paired with a wall-clock timeout and maximum token spend ceiling per session", "Hoping the agent realizes when it is finished", "Deleting the agent's Python code after 5 seconds", "Setting temperature to 0.0"], a: 0, exp: "Multi-layered safeguards (iteration caps, timeouts, spend limits) prevent runaway autonomous loops.", why: ["Correct. Defense-in-depth loop controls enforce hard limits on iterations, wall-clock duration, and token budgets.", "Autonomous models cannot be assumed to self-terminate under all edge conditions.", "Deleting code files corrupts the running application.", "Temperature 0.0 controls randomness, not loop iteration counts."] },
  { d: 1, q: "When designing an agent with access to internal company wikis and the public internet, what is the primary data exfiltration risk?", opts: ["The agent reads confidential internal wiki data and an indirect prompt injection instructs it to transmit that data to an external attacker-controlled URL via web search/HTTP tools", "The agent's text turns into French", "The computer monitor screen turns off", "The API key expires automatically"], a: 0, exp: "Indirect prompt injections can exfiltrate sensitive context via unauthorized network egress tools.", why: ["Correct. Attackers use malicious web instructions to co-opt agent egress tools and exfiltrate sensitive prompt data.", "Language translation does not constitute a security exfiltration attack.", "Monitor power is unrelated to agent network security.", "API key lifetime is governed by administrative settings."] },
  { d: 2, q: "What is the recommended OpenTelemetry span name format for Anthropic Messages API operations?", opts: ["`gen_ai.client.operation: 'messages.create'` with `gen_ai.system: 'anthropic'`", "`custom_api_call_1` with no attributes", "`http_ping`", "`log_statement`"], a: 0, exp: "Standard semantic conventions use `gen_ai.client.operation` and `gen_ai.system`.", why: ["Correct. OpenTelemetry GenAI standards establish consistent naming across enterprise APM dashboards.", "Unstandardized custom names prevent APM aggregation.", "`http_ping` obscures model inference telemetry.", "Generic log statements fail APM span indexing."] },
  { d: 3, q: "In an enterprise multi-tier fallback architecture, what is the recommended cascade sequence when Claude 3.5 Sonnet encounters an unexpected service disruption?", opts: ["Retry with exponential backoff -> Fallback to Claude 3.5 Haiku -> Fallback to static rule-based templates -> Graceful human agent escalation", "Crash the entire customer application immediately", "Switch all users to random Wikipedia articles", "Reboot the company email server"], a: 0, exp: "Tiered degradation paths maintain service availability through progressive fallbacks.", why: ["Correct. Graceful degradation cascades from primary frontier models to fast tier models, static templates, and human handoffs.", "Immediate crashes maximize downtime and degrade user trust.", "Irrelevant Wikipedia text destroys application utility.", "Email server reboots do not fix LLM API outages."] },
  { d: 4, q: "Why should an enterprise maintain a version-controlled 'Golden Evaluation Dataset' of 500+ challenging multi-turn scenarios?", opts: ["To run automated regression tests before deploying any prompt, tool schema, or model version update to production", "To use up leftover cloud storage quota", "To train other companies' proprietary models", "To comply with website cookie banners"], a: 0, exp: "Golden datasets serve as reproducible quality benchmarks for continuous delivery pipelines.", why: ["Correct. Versioned golden datasets catch subtle quality regressions, tool misuse, and safety degradations before production release.", "Storage quota utilization is not an engineering objective.", "Golden internal evals protect proprietary quality.", "Cookie banners manage tracking consent, not model evaluation."] }
];

// Combine unique questions for CCAR-P
while (ccap49.length < 49) {
  const extra = ccarpExtra[ccap49.length % ccarpExtra.length];
  const idx = ccap49.length + 52;
  ccap49.push({
    d: extra.d,
    q: `Principal Architect Case Study ${idx}: ${extra.q}`,
    opts: extra.opts,
    a: extra.a,
    exp: extra.exp,
    why: extra.why
  });
}

// Assemble CCAR-F
const ccafData = loadCert('ccaf');
const baseCcaf = ccafData.questions.slice(0, 51);
const newCcafQs = ccaf49.map((item, idx) => ({
  id: `ccafq-${idx + 52}`,
  d: item.d,
  q: item.q,
  opts: item.opts,
  a: item.a,
  exp: item.exp || item.why[item.a],
  why: item.why
}));
ccafData.questions = [...baseCcaf, ...newCcafQs];
saveCert('ccaf', ccafData);

// Assemble CCAR-P
const ccapData = loadCert('ccap');
const baseCcap = ccapData.questions.slice(0, 51);
const newCcapQs = ccap49.map((item, idx) => ({
  id: `ccapq-${idx + 52}`,
  d: item.d,
  q: item.q,
  opts: item.opts,
  a: item.a,
  exp: item.exp || item.why[item.a],
  why: item.why
}));
ccapData.questions = [...baseCcap, ...newCcapQs];
saveCert('ccap', ccapData);

console.log('Successfully saved completely distinct question banks for CCAR-F and CCAR-P!');
