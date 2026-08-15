const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function loadCert(id) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
}

function saveCert(id, data) {
  fs.writeFileSync(path.join(dataDir, `${id}.json`), JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${id}.json: ${data.lessons.length} lessons`);
}

// -------------------------------------------------------------
// 1. CCAO-F: 4 Deep-Dive Masterclasses (Lessons 8, 9, 10, 11)
// -------------------------------------------------------------
const ccaoMasterclasses = [
  {
    id: "ccaol-8",
    h: "Masterclass: Advanced Prompt Architecture & XML Structuring",
    b: `<p>In production enterprise deployments, prompt engineering is not casual copywriting — it is <b>software interface specification</b>. Claude models are explicitly trained with reinforcement learning to recognize XML tags as structural delimiters that separate instructions, data payloads, and scratchpad memory.</p>

<div class='callout'>
<div class='lbl'>XML Tag Hierarchy Architecture</div>
<p>Structure your production prompts using semantic XML wrappers:</p>
<ul>
  <li><code>&lt;system&gt;</code> / <code>&lt;role&gt;</code>: Establish operational domain, persona, and output constraints.</li>
  <li><code>&lt;context&gt;</code> / <code>&lt;documents&gt;</code>: Isolate external knowledge, reference PDFs, or user profile records.</li>
  <li><code>&lt;instructions&gt;</code>: Define the explicit algorithmic steps Claude must execute.</li>
  <li><code>&lt;examples&gt;</code>: Provide 2-3 canonical few-shot pairs demonstrating input-to-output mappings for edge cases.</li>
  <li><code>&lt;scratchpad&gt;</code> / <code>&lt;thinking&gt;</code>: Instruct the model to plan step-by-step before producing final output.</li>
</ul>
</div>

<h4>Positive Framing vs Negative Constraints</h4>
<p>One of the most frequent failure modes on the Associate exam is relying on negative constraints (e.g. <i>"Do not mention competitors"</i> or <i>"Don't write more than 3 sentences"</i>). Autoregressive language models predict the next token based on preceding tokens; repeating forbidden words primes the model toward those exact concepts.</p>

<div class='warn'>
<div class='lbl'>Exam Rule: Transform Negative Constraints to Positive Boundaries</div>
<ul>
  <li>❌ <b>Weak Negative:</b> "Do not use technical jargon or complicated words."</li>
  <li>✅ <b>Strong Positive:</b> "Explain this concept using everyday analogies suitable for an 8th-grade student."</li>
  <li>❌ <b>Weak Negative:</b> "Don't mention pricing unless the user explicitly asks."</li>
  <li>✅ <b>Strong Positive:</b> "Focus exclusively on product features and capabilities. If pricing is requested, provide the link to our public pricing page."</li>
  <li>❌ <b>Weak Negative:</b> "Do not write in passive voice."</li>
  <li>✅ <b>Strong Positive:</b> "Write every sentence in active voice where the subject performs the action directly."</li>
</ul>
</div>

<h4>Few-Shot Scaffolding for Format Determinism</h4>
<p>While natural language instructions describe intent, providing concrete input-to-output few-shot exemplars inside <code>&lt;examples&gt;</code> blocks anchors token generation. When dealing with complex tabular output, nested JSON schemas, or strict regulatory citations, few-shot examples reduce formatting syntax errors by over 90% compared to zero-shot adjective descriptions.</p>

<div class='exbox'>
<div class='lbl'>Production XML Prompt Template</div>
<pre>&lt;instructions&gt;
You are a senior analyst. Extract the 3 primary architectural risks from &lt;document&gt;.
Output your findings inside &lt;findings&gt; tags using the exact schema shown in &lt;examples&gt;.
&lt;/instructions&gt;

&lt;examples&gt;
&lt;example&gt;
&lt;input&gt;Legacy system has no automated backups.&lt;/input&gt;
&lt;output&gt;&lt;risk severity="CRITICAL" category="RESILIENCE"&gt;No automated backup pipeline.&lt;/risk&gt;&lt;/output&gt;
&lt;/example&gt;
&lt;/examples&gt;

&lt;document&gt;
[User text provided here]
&lt;/document&gt;</pre>
</div>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=T9aRN5JkmL8' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>AI Prompt Engineering: A Deep Dive (Anthropic)</span><span class='vdesc'>Anthropic's prompt engineering leads explain XML delimitation and few-shot formatting techniques.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>XML tags provide deterministic boundary isolation, preventing input injection and instruction confusion.</li>
  <li>Always frame prompt constraints positively with explicit replacement behaviors.</li>
  <li>Few-shot examples in <code>&lt;examples&gt;</code> blocks have higher leverage on format consistency than adjective-heavy prompt descriptions.</li>
  <li>Place dynamic user data inside explicit container tags so the model never confuses user content with developer instructions.</li>
</ul>
</div>`
  },
  {
    id: "ccaol-9",
    h: "Masterclass: Production Model Economics, Caching & Batches API",
    b: `<p>Selecting the right Claude model is a multidimensional optimization problem balancing <b>intelligence, latency, throughput, and cost</b>. Modern architectures achieve 80%+ cost reductions by pairing model tiering with Anthropic's cost-saving infrastructure features: <b>Prompt Caching</b> and the <b>Batches API</b>.</p>

<h4>Model Tier Economics Matrix</h4>
<table style='width:100%; border-collapse:collapse; margin:12px 0;'>
  <thead>
    <tr style='border-bottom:2px solid var(--border); text-align:left;'>
      <th style='padding:6px;'>Model Tier</th>
      <th style='padding:6px;'>Base Input / Output</th>
      <th style='padding:6px;'>Cached Read (85% off)</th>
      <th style='padding:6px;'>Batch Price (50% off)</th>
      <th style='padding:6px;'>Target Use Cases</th>
    </tr>
  </thead>
  <tbody>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:6px;'><b>Claude 3.5 Haiku</b></td>
      <td style='padding:6px;'>$0.80 / $4.00</td>
      <td style='padding:6px;'>$0.08 / MTok</td>
      <td style='padding:6px;'>$0.40 / $2.00</td>
      <td style='padding:6px;'>High-throughput routing, intent classification, entity extraction</td>
    </tr>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:6px;'><b>Claude 3.5 Sonnet</b></td>
      <td style='padding:6px;'>$3.00 / $15.00</td>
      <td style='padding:6px;'>$0.30 / MTok</td>
      <td style='padding:6px;'>$1.50 / $7.50</td>
      <td style='padding:6px;'>Coding, tool use, multimodal vision, complex workflow synthesis</td>
    </tr>
    <tr>
      <td style='padding:6px;'><b>Claude 3.5 Opus</b></td>
      <td style='padding:6px;'>$15.00 / $75.00</td>
      <td style='padding:6px;'>$1.50 / MTok</td>
      <td style='padding:6px;'>$7.50 / $37.50</td>
      <td style='padding:6px;'>Deep multi-step reasoning, nuanced research, philosophical audit</td>
    </tr>
  </tbody>
</table>

<h4>Understanding Prompt Caching Mechanics</h4>
<p>Prompt Caching allows static prompt prefixes (minimum 1,024 tokens on Sonnet/Opus, 2,048 tokens on Haiku) to be cached in memory for 5 minutes. Every subsequent request hitting the cache receives an <b>85% discount</b> on input tokens and experiences dramatic reductions in Time-to-First-Token (TTFT). Whenever a cache hit occurs, the 5-minute TTL window is refreshed automatically.</p>

<div class='exambox'>
<div class='lbl'>When to Use the Batches API</div>
<p>The Message Batches API enables asynchronous processing of up to 10,000 requests or 32MB of data per batch. Anthropic guarantees completion within 24 hours (usually within 1-2 hours) at a flat <b>50% discount</b> across all models. Use Batches for nightly document indexing, synthetic dataset generation, and batch log audits.</p>
</div>

<h4>Cost Optimization Decision Framework</h4>
<p>When reviewing enterprise bills, apply this 3-step right-sizing audit:</p>
<ol>
  <li><b>Step 1:</b> Are you using Sonnet for simple text classification or routing? Downgrade those isolated micro-tasks to Haiku to save 73% immediately.</li>
  <li><b>Step 2:</b> Are your conversations multi-turn or sharing a static 2,000+ token document? Add a prompt cache breakpoint at the document boundary to get 85% discount on subsequent turns.</li>
  <li><b>Step 3:</b> Are any workloads non-interactive with delivery windows &gt; 1 hour? Offload them to the Batches API for a flat 50% discount.</li>
</ol>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=EstrsAlmxd4' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Haiku vs Sonnet vs Opus: Model Economics Guide</span><span class='vdesc'>Practical cost modeling and benchmark comparison for Anthropic models.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Default to Claude 3.5 Haiku for classification and routing; escalate to Sonnet only when code, tools, or deep reasoning are required.</li>
  <li>Prompt Caching reduces input costs by 85% on multi-turn conversations and long static system prompts.</li>
  <li>The Batches API provides a flat 50% discount on both input and output tokens for asynchronous workloads completed within 24 hours.</li>
  <li>Prompt Caching refreshes its 5-minute TTL on every cache read hit.</li>
</ul>
</div>`
  },
  {
    id: "ccaol-10",
    h: "Masterclass: Enterprise Evaluation Benchmarking & LLM-as-a-Judge",
    b: `<p>A common mistake in enterprise AI initiatives is relying on informal manual testing ("vibe checks") before launching to production. Production readiness requires <b>systematic, quantitative evaluation</b> against a curated Golden Dataset with automated LLM-as-a-Judge pipelines.</p>

<div class='callout'>
<div class='lbl'>The Golden Dataset Blueprint</div>
<p>A production eval benchmark must contain:</p>
<ul>
  <li><b>500+ Representative Cases:</b> Sourced from real customer inquiries, edge cases, and historical support tickets.</li>
  <li><b>Adversarial Traps:</b> 20-30% of prompts must test guardrails (e.g. out-of-scope requests, prompt injections, ambiguous queries).</li>
  <li><b>Ground-Truth Annotations:</b> Clinically or legally validated target outputs reviewed by domain experts.</li>
</ul>
</div>

<h4>Pairwise Grading vs Likert Scales</h4>
<p>When using an LLM (such as Claude 3.5 Sonnet) to evaluate model outputs, single-score Likert scales (e.g. <i>"Rate this answer from 1 to 5"</i>) suffer from severe calibration drift and score compression. <b>Pairwise Evaluation</b> (comparing Model A vs Model B side-by-side with position swapping) yields significantly higher inter-rater agreement (Cohen's Kappa &gt; 0.85).</p>

<p>In a pairwise grading setup, the LLM judge is presented with the original user prompt, the ground-truth reference material, and two candidate responses: Candidate A and Candidate B. The judge is instructed to reason through specific evaluation criteria (factual correctness, completeness, conciseness, tone alignment) within a scratchpad before declaring a winner or tie.</p>

<div class='warn'>
<div class='lbl'>Exam Trap: Position Bias in LLM Judges</div>
<p>LLM judges exhibit a slight preference for whichever candidate is presented first in the prompt. To eliminate position bias, always run two passes: Pass 1 evaluates (Candidate A, Candidate B); Pass 2 swaps positions to (Candidate B, Candidate A). Only award a win if the outcome is consistent across both runs.</p>
</div>

<h4>Measuring Inter-Rater Reliability (Cohen's Kappa)</h4>
<p>Before relying on an automated LLM judge pipeline, benchmark its decisions against a test set of 100 human-graded examples. Calculate Cohen's Kappa score ($\kappa$):</p>
<ul>
  <li>$\kappa &lt; 0.40$: Poor agreement; prompt rubric is too ambiguous.</li>
  <li>$\kappa = 0.60 - 0.75$: Moderate agreement; acceptable for staging regression gates.</li>
  <li>$\kappa &gt; 0.80$: Strong agreement; suitable for automated production CI/CD gating.</li>
</ul>

<h4>Continuous CI/CD Eval Automation</h4>
<p>Integrate evaluation directly into automated test suites. Whenever a developer modifies a system prompt, introduces new few-shot examples, or alters tool schemas, run the automated evaluation suite. Enforce strict pull request blocking if the pass rate drops or if safety refusal accuracy falls below 99.5%.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=005JLRt3gXI' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Automated AI Evaluation & LLM-as-a-Judge</span><span class='vdesc'>How to build reliable evaluation pipelines and eliminate judge bias.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Never deploy model or prompt changes without testing against a version-controlled Golden Evaluation Dataset.</li>
  <li>Pairwise comparison with position debiasing produces superior evaluation reliability compared to absolute 1-10 scales.</li>
  <li>Measure both functional accuracy (True Positive Rate) and guardrail refusal accuracy (False Positive Rate).</li>
  <li>Benchmark automated LLM judges against human domain expert consensus using Cohen's Kappa.</li>
  <li>Enforce automated evaluation gates in continuous integration pipelines before deploying prompt changes.</li>
</ul>
</div>`
  },
  {
    id: "ccaol-11",
    h: "Masterclass: AI Governance, Risk & Policy Compliance",
    b: `<p>Enterprise consultants and delivery leads must navigate corporate governance, regulatory compliance (HIPAA, GDPR, SOC 2), and AI safety frameworks. Anthropic's safety philosophy is operationalized through its <b>Responsible Scaling Policy (RSP)</b> and <b>Zero Data Retention (ZDR)</b> enterprise commitments.</p>

<div class='callout'>
<div class='lbl'>Anthropic Responsible Scaling Policy (RSP) Safety Tiers</div>
<ul>
  <li><b>ASL-1 (AI Safety Level 1):</b> Standard models that pose no biological, chemical, or cyber proliferation risk (comparable to basic search engines).</li>
  <li><b>ASL-2:</b> Current frontier models (Claude 3.5). Models show early reasoning capabilities but lack autonomous cyberwarfare or CBRN synthesis abilities. Requires standard red-teaming and abuse filtering.</li>
  <li><b>ASL-3:</b> Models capable of providing actionable instructions for biological weapon creation or autonomous cyberattack execution. Requires air-gapped compute, strict physical access security, and multi-party cryptographic authorization.</li>
  <li><b>ASL-4:</b> High-risk autonomous proliferation risks requiring nation-state level containment standards.</li>
</ul>
</div>

<h4>Enterprise Privacy & Zero Data Retention (ZDR)</h4>
<p>When customers interact with Claude through the official Commercial API, Anthropic provides contractual <b>Zero Data Retention</b> agreements: customer prompt inputs and generated completions are never retained on persistent disk after processing, and are <b>never used to train future Anthropic models</b>.</p>

<p>This strict boundary protects corporate intellectual property, proprietary source code, and confidential customer records from data leakage. Unlike consumer chat interfaces that may use conversations for reinforcement learning, commercial API endpoints provide complete legal data isolation.</p>

<div class='warn'>
<div class='lbl'>Exam Gotcha: Disclaimers vs Architectural Guardrails</div>
<p>Adding a disclaimer like <i>"AI may make mistakes"</i> does not absolve an organization of regulatory liability in healthcare, financial lending, or legal advisory services. Compliance requires <b>deterministic architectural guardrails</b>: human-in-the-loop confirmation gates, output schema validation, and retrieval grounding.</p>
</div>

<h4>Managing Regulated PII and PHI</h4>
<p>When deploying AI applications in healthcare (HIPAA) or financial services (GLBA, PCI-DSS):</p>
<ul>
  <li>Execute a formal Business Associate Agreement (BAA) with Anthropic or your cloud provider (AWS Bedrock / GCP Vertex AI).</li>
  <li>Implement client-side PII scrubbing (e.g. Microsoft Presidio) to mask social security numbers and patient names before sending payloads.</li>
  <li>Enforce least-privilege role-based access control (RBAC) on all downstream knowledge stores and vector databases.</li>
  <li>Maintain comprehensive audit logs tracking who queried the model, when, and which data records were accessed.</li>
</ul>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=LPZh9BOjkQs' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Anthropic Constitutional AI & Safety Framework</span><span class='vdesc'>Anthropic's approach to alignment, constitutional AI, and enterprise safety.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Anthropic Commercial API data is never used for model training under Zero Data Retention terms.</li>
  <li>ASL-3 containment triggers when models demonstrate dangerous autonomous cyberwarfare or CBRN capabilities.</li>
  <li>Regulatory compliance in high-stakes domains requires architectural verification gates, not passive user disclaimers.</li>
  <li>Always mask PII on the client side and establish formal enterprise BAAs for HIPAA/GDPR workloads.</li>
  <li>Log all user queries and system actions to maintain compliance with SOC 2 and ISO 27001 audit standards.</li>
</ul>
</div>`
  }
];

// -------------------------------------------------------------
// 2. CCDV-F: 4 Deep-Dive Masterclasses (Lessons 8, 9, 10, 11)
// -------------------------------------------------------------
const ccdvMasterclasses = [
  {
    id: "ccdvl-8",
    h: "Masterclass: Model Context Protocol (MCP) Server Architecture",
    b: `<p>The <b>Model Context Protocol (MCP)</b> is an open, standardized protocol created by Anthropic that standardizes how AI applications connect to external tools, databases, and local filesystems. Instead of writing custom brittle API bridges for every tool, MCP standardizes communication over <b>JSON-RPC 2.0</b>.</p>

<div class='callout'>
<div class='lbl'>The 4 Core MCP Primitives</div>
<ul>
  <li><b>Tools (<code>tools/list</code>, <code>tools/call</code>):</b> Executable functions that Claude can invoke to perform actions (e.g. run SQL query, fetch weather, write file).</li>
  <li><b>Resources (<code>resources/list</code>, <code>resources/read</code>):</b> Structured, read-only data endpoints identified by URIs (e.g. <code>postgres://schema/users</code>).</li>
  <li><b>Prompts (<code>prompts/list</code>, <code>prompts/get</code>):</b> Parameterized prompt templates managed by the server.</li>
  <li><b>Roots (<code>roots/list</code>):</b> Workspace directory boundaries that inform the server which filesystem paths it is permitted to access.</li>
</ul>
</div>

<h4>JSON-RPC 2.0 Wire Protocol & Error Handling</h4>
<p>When an MCP tool encounters an error during execution (such as a database query timeout or missing record), the server must return <code>isError: true</code> inside the tool result block rather than crashing the JSON-RPC transport connection.</p>

<pre><code class='language-json'>{
  "jsonrpc": "2.0",
  "id": 42,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Database error: Table 'customers_2026' does not exist."
      }
    ],
    "isError": true
  }
}</code></pre>

<div class='warn'>
<div class='lbl'>Exam Rule: Transport Layers</div>
<p>MCP supports two standard transports: <b>stdio</b> (standard input/output for local processes, IDE plugins, and CLI tools) and <b>Server-Sent Events (SSE) over HTTP</b> (for remote microservices and cloud deployments).</p>
</div>

<h4>Client Sampling (sampling/createMessage)</h4>
<p>MCP servers can request the host client application (e.g. Claude Desktop or an enterprise agent) to generate a completion via the <code>sampling/createMessage</code> method. This allows an MCP server to delegate sub-reasoning tasks back to Claude while keeping the client application in control of model parameters, token spend, and user confirmation permissions.</p>

<h4>Security Boundaries & Roots Discovery</h4>
<p>MCP servers must respect filesystem boundaries advertised by the client via <code>roots/list</code>. A secure server validates that all requested file read/write paths fall strictly within the allowlisted workspace root directories, rejecting directory traversal attempts (e.g. <code>../../etc/passwd</code>) with a structured error payload.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=kQmXZJp_6io' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Model Context Protocol (MCP) Deep Dive</span><span class='vdesc'>Anthropic engineers demonstrate building MCP servers in TypeScript and Python.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>MCP standardizes tool, resource, and prompt integrations using JSON-RPC 2.0 primitives.</li>
  <li>Tool execution errors must be communicated via <code>isError: true</code> in the tool result so Claude can handle the failure gracefully.</li>
  <li>Local tools communicate over stdio; remote services communicate over HTTP with Server-Sent Events (SSE).</li>
  <li>Sampling allows servers to request LLM generations through the client with user-controlled permissions.</li>
  <li>Always validate file path boundaries against client-provided workspace roots.</li>
</ul>
</div>`
  },
  {
    id: "ccdvl-9",
    h: "Masterclass: Claude Code CLI & Headless CI/CD Automation",
    b: `<p><b>Claude Code</b> is Anthropic's agentic command-line interface tool designed for deep codebase navigation, editing, refactoring, and test automation. Unlike simple chat assistants, Claude Code operates autonomously inside developer terminal environments.</p>

<div class='callout'>
<div class='lbl'>The CLAUDE.md Specification</div>
<p>Claude Code looks for a <code>CLAUDE.md</code> file in the repository root to guide its behavior. A production-ready <code>CLAUDE.md</code> must specify:</p>
<ul>
  <li><b>Build & Test Commands:</b> Exact package manager commands (e.g. <code>pnpm test:unit</code>, <code>npm run lint</code>).</li>
  <li><b>Architecture Boundaries:</b> Folder structures, module hierarchies, and layer restrictions.</li>
  <li><b>Code Style Rules:</b> Naming conventions, error handling paradigms, and forbidden libraries.</li>
  <li><b>Deployment Instructions:</b> Safe branch workflows and pre-commit verification hooks.</li>
</ul>
</div>

<h4>Headless Execution in CI/CD Pipelines</h4>
<p>To run Claude Code headlessly in automated GitHub Actions, GitLab CI, or Jenkins pipelines without interactive TTY terminal prompts, invoke non-interactive print mode using <code>claude -p 'prompt'</code>:</p>

<pre><code class='language-bash'># Example: Automated PR Review in GitHub Actions
claude -p "Review the diff in origin/main...HEAD against our security standards in CLAUDE.md. Output findings in Markdown format." > pr_review.md</code></pre>

<div class='warn'>
<div class='lbl'>Exam Rule: Ripgrep & Symbol Search</div>
<p>Claude Code does not blindly ingest entire 100,000-file codebases into prompt context. It uses <b>ripgrep</b>, glob filters, and AST symbol parsers to dynamically search and read only relevant files on demand.</p>
</div>

<h4>Automated Test-Driven Refactoring Loops</h4>
<p>When instructed to fix a bug or refactor code, Claude Code executes an agentic loop:</p>
<ol>
  <li>Search codebase using ripgrep and AST symbol lookups to locate relevant files and function definitions.</li>
  <li>Run reproduction unit tests in the shell to confirm the failure state and capture the exact stack trace.</li>
  <li>Apply surgical file edits using unified diff patches while preserving existing comments.</li>
  <li>Re-run the test suite to verify the fix passes 100% cleanly before presenting the completed change to the developer.</li>
</ol>

<h4>Managing Large Codebases & Context Budgets</h4>
<p>In massive monorepos, reading whole directories is a frequent developer mistake. Claude Code relies on sub-file slices (reading specific line ranges, e.g. lines 120-180 of a file) rather than dumping 5,000-line modules into context, ensuring maximum token efficiency and rapid iteration speed.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=GJ5jTgcbRHA' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Claude Code Command Line Tool Tour</span><span class='vdesc'>Terminal workflows, ripgrep navigation, and headless CI/CD integration with Claude Code.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li><code>CLAUDE.md</code> provides repository build commands, testing instructions, and architecture conventions.</li>
  <li>Run Claude Code in headless CI/CD automation using <code>claude -p 'prompt'</code> (print mode).</li>
  <li>Dynamic search with ripgrep protects context window budgets across massive enterprise codebases.</li>
  <li>Claude Code autonomously runs unit tests to verify its own code changes before completing tasks.</li>
  <li>Always slice specific line ranges when inspecting large files to conserve context tokens.</li>
</ul>
</div>`
  },
  {
    id: "ccdvl-10",
    h: "Masterclass: Advanced Tool Design, Structured Output & Idempotency",
    b: `<p>Tool use (function calling) is how Claude acts upon the outside world. Designing robust tool schemas requires strict JSON Schema definitions, typed parameter validation, and <b>idempotent execution design</b>.</p>

<div class='callout'>
<div class='lbl'>Handling the stop_reason: "tool_use" Control Loop</div>
<p>When Claude decides to call a tool, it halts generation and emits <code>stop_reason: "tool_use"</code>. The client application must:</p>
<ol>
  <li>Extract the <code>tool_use</code> content block containing <code>id</code>, <code>name</code>, and <code>input</code> parameters.</li>
  <li>Execute the local function corresponding to <code>name</code> with the validated <code>input</code> arguments.</li>
  <li>Append a <code>user</code> turn containing a <code>tool_result</code> block with the matching <code>tool_use_id</code>.</li>
  <li>Call the API again to allow Claude to synthesize the final answer.</li>
</ol>
</div>

<h4>Designing Idempotent Mutation Tools</h4>
<p>Network interruptions and API timeouts occur in production. If an agent calls <code>charge_credit_card</code> and the network connection drops before receiving the response, the agent will retry the call. Without <b>idempotency keys</b>, the customer will be charged twice.</p>

<pre><code class='language-typescript'>interface ChargeCreditCardInput {
  customerId: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string; // Unique UUID generated per logical transaction
}</code></pre>

<div class='warn'>
<div class='lbl'>Exam Trap: Schema Ambiguity</div>
<p>Always specify exact units and format restrictions in JSON schema property descriptions (e.g. <i>"timestamp in ISO-8601 UTC format"</i>, <i>"temperature in degrees Celsius"</i>). Ambiguous schemas cause argument hallucinations.</p>
</div>

<h4>Parallel Tool Execution Optimization</h4>
<p>Claude 3.5 Sonnet supports parallel tool calling: emitting multiple independent <code>tool_use</code> blocks within a single response (e.g. fetching weather for Tokyo, London, and New York simultaneously). Clients should execute these parallel tool calls concurrently using <code>Promise.all()</code>, then append all corresponding <code>tool_result</code> blocks in a single return turn.</p>

<h4>Handling Structured Schema Validation Failures</h4>
<p>When using tools to produce structured JSON outputs, use a validator like Zod (TypeScript) or Pydantic (Python). If validation fails due to a missing property or wrong data type, format the error into a structured <code>tool_result</code> with <code>is_error: true</code> and feed it back to Claude. The model will inspect the schema error and self-correct on the very next turn.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=0k_3uM5jUqM' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Tool Use & Structured Outputs in Anthropic API</span><span class='vdesc'>End-to-end coding tutorial on JSON schema tool definitions and parallel dispatch.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Always match <code>tool_result.tool_use_id</code> to the exact <code>id</code> emitted in Claude's <code>tool_use</code> block.</li>
  <li>Mutation tools must accept idempotency keys to ensure retry safety during network timeouts.</li>
  <li>Explicit parameter descriptions and enum constraints prevent tool argument hallucination.</li>
  <li>Execute parallel tool calls concurrently with <code>Promise.all()</code> to minimize round-trip latency.</li>
  <li>Catch validation errors and return them via <code>is_error: true</code> to enable automated self-correction.</li>
</ul>
</div>`
  },
  {
    id: "ccdvl-11",
    h: "Masterclass: High-Performance Streaming & Extended Thinking",
    b: `<p>For low-latency user interfaces and complex multi-step reasoning, developers use <b>Server-Sent Events (SSE) streaming</b> and Claude 3.5's <b>Extended Thinking</b> mode.</p>

<div class='callout'>
<div class='lbl'>Server-Sent Events (SSE) Streaming Lifecycle</div>
<p>When <code>stream: true</code> is passed in the Messages API, Anthropic streams real-time JSON event packets:</p>
<ul>
  <li><code>message_start</code>: Carries message ID, model name, and initial usage.</li>
  <li><code>content_block_start</code>: Emits the start of a <code>text</code>, <code>thinking</code>, or <code>tool_use</code> block.</li>
  <li><code>content_block_delta</code>: Emits incremental text chunks (<code>text_delta</code>) or thinking tokens (<code>thinking_delta</code>).</li>
  <li><code>content_block_stop</code>: Signals completion of the active content block.</li>
  <li><code>message_delta</code>: Emits final <code>stop_reason</code> (e.g. <code>end_turn</code>, <code>tool_use</code>, <code>max_tokens</code>).</li>
  <li><code>message_stop</code>: Closes the SSE stream connection.</li>
</ul>
</div>

<h4>Extended Thinking Mode (thinking: { type: "enabled", budget_tokens: N })</h4>
<p>Extended Thinking gives Claude a dedicated internal reasoning scratchpad before emitting visible output. This drastically improves mathematical proofs, deep algorithm synthesis, and multi-file refactoring.</p>

<div class='warn'>
<div class='lbl'>Exam Rule: Thinking Token Budgeting</div>
<p>Thinking tokens are billed as standard output tokens. Setting <code>budget_tokens: 4096</code> reserves up to 4,096 tokens for internal thought. <code>max_tokens</code> must always be set strictly <b>greater than</b> <code>budget_tokens</code> to leave room for the final response.</p>
</div>

<h4>Handling Network Stream Reconnections</h4>
<p>When streaming long responses over mobile or flaky network connections, connection drops can truncate the response. Production clients track received token offsets and implement reconnection handlers that resume generation seamlessly without re-running the entire prompt from scratch.</p>

<h4>Streaming Tool Invocations</h4>
<p>When Claude decides to invoke a tool during a streaming session, the tool input JSON is streamed incrementally across multiple <code>input_json_delta</code> chunks. The client must accumulate these string fragments until <code>content_block_stop</code> is received, and only then parse the complete JSON string into an object for execution.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=Z3mN7U3O4fE' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Streaming API & Extended Thinking Architecture</span><span class='vdesc'>How to handle SSE streaming events and configure thinking token budgets in production.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Handle SSE streaming events incrementally to achieve sub-second perceived Time-to-First-Token (TTFT).</li>
  <li>Extended Thinking allows Claude to reason through complex logic before generating final output.</li>
  <li><code>max_tokens</code> must always exceed <code>thinking.budget_tokens</code> to allow space for visible completion tokens.</li>
  <li>Accumulate streaming content blocks in memory while updating the user interface in real time.</li>
  <li>Buffer streaming <code>input_json_delta</code> fragments until <code>content_block_stop</code> before attempting to parse JSON tool arguments.</li>
</ul>
</div>`
  }
];

// -------------------------------------------------------------
// 3. CCAR-F: 4 Deep-Dive Masterclasses (Lessons 6, 7, 8, 9)
// -------------------------------------------------------------
const ccafMasterclasses = [
  {
    id: "ccafl-6",
    h: "Masterclass: Enterprise Production Hybrid RAG Architecture",
    b: `<p>Retrieval-Augmented Generation (RAG) in enterprise production requires far more than basic vector cosine similarity. Production architectures implement a <b>Three-Tier Hybrid RAG Pipeline</b> combining dense vector search, sparse keyword search, and cross-encoder re-ranking.</p>

<div class='callout'>
<div class='lbl'>The 3-Tier Hybrid RAG Pipeline</div>
<ol>
  <li><b>Dense Vector Search (Semantic):</b> Maps natural language queries to conceptual embedding clusters. Excellent for conceptual questions (e.g. <i>"How do we handle customer returns?"</i>).</li>
  <li><b>Sparse BM25 Search (Exact Lexical):</b> Indexes exact keywords, alphanumeric SKUs, error codes, and statutory statute numbers (e.g. <i>"Error 0x80040154"</i> or <i>"Section 404(b)"</i>).</li>
  <li><b>Cross-Encoder Re-Ranking (Precision):</b> Jointly scores query-document pairs to eliminate false positives and order top-K candidate passages for Claude's prompt context.</li>
</ol>
</div>

<h4>Contextual Chunk Headers & Semantic Boundaries</h4>
<p>When text is sliced into chunks, isolated paragraphs lose their parent document context. Production RAG prepends structural metadata headers to every chunk before embedding:</p>

<pre><code class='language-markdown'>[Document: Enterprise Security Policy > Chapter 4: Data Classification > Section 2: Encryption at Rest]
All production databases storing customer PII must enforce AES-256 encryption with automated KMS key rotation.</code></pre>

<div class='warn'>
<div class='lbl'>Exam Rule: Table Preservation</div>
<p>Never slice midway through Markdown or HTML tables. Slicing rows across chunk splits destroys column headers and leads to catastrophic data hallucination.</p>
</div>

<h4>Reciprocal Rank Fusion (RRF)</h4>
<p>When merging candidate lists from Dense Vector and Sparse BM25 search engines, standard score normalization fails because embedding cosine similarities and BM25 scores have different distributions. Use <b>Reciprocal Rank Fusion (RRF)</b> to blend ranks deterministically:</p>
<p style='font-family:monospace; font-size:12.5px;'>RRF_Score(d) = Σ [ 1 / (60 + Rank_Dense(d)) + 1 / (60 + Rank_BM25(d)) ]</p>

<h4>Semantic Chunking vs Fixed Window Splitting</h4>
<p>Fixed character slicing (e.g. every 500 characters) frequently bisects sentences and disrupts logical thoughts. Advanced production pipelines employ <b>Semantic Chunking</b>, splitting on paragraph breaks, Markdown headings, or embedding distance spikes between adjacent sentences. This ensures that every chunk represents a coherent, self-contained concept.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=0k_3uM5jUqM' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Advanced Enterprise RAG Architecture</span><span class='vdesc'>How to build hybrid RAG pipelines with BM25, embeddings, and Cohere/BGE re-rankers.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Combine Dense Vector search with Sparse BM25 to capture both conceptual semantics and exact alphanumeric keywords.</li>
  <li>Cross-encoder re-rankers filter out retrieval noise before context reaches Claude's prompt window.</li>
  <li>Prepend document title and section hierarchy metadata to every chunk to anchor embedding representations.</li>
  <li>Use Reciprocal Rank Fusion (RRF) to merge disparate ranking scores from vector and keyword search.</li>
  <li>Implement semantic chunking to avoid splitting coherent sentences across arbitrary character boundaries.</li>
</ul>
</div>`
  },
  {
    id: "ccafl-7",
    h: "Masterclass: Workflow Topologies & Agent Orchestration",
    b: `<p>The first fundamental principle of AI system architecture is: <b>Never use an autonomous agent loop where a deterministic workflow or single prompt pipeline is sufficient</b>. Unnecessary autonomy introduces latency, nondeterminism, and high token costs.</p>

<h4>The 5 Core Workflow Topologies</h4>
<ul>
  <li><b>1. Prompt Chaining (Sequential Pipeline):</b> Fixed linear series of steps where step N passes validated structured output to step N+1. Best for regulated multi-stage document processing.</li>
  <li><b>2. Routing (Classifier + Specialists):</b> A lightweight classifier (Claude 3.5 Haiku) categorizes user intent and dispatches to a targeted specialist prompt with dedicated toolsets.</li>
  <li><b>3. Orchestrator-Workers (Parallel Fan-Out):</b> A central orchestrator breaks a complex goal into independent subtasks, executes worker models in parallel, and synthesizes results.</li>
  <li><b>4. Evaluator-Optimizer Loop:</b> One model generates a candidate solution, and a separate evaluator grades it against a strict rubric, iterating until a quality threshold is reached.</li>
  <li><b>5. Autonomous Agent:</b> Model operates in an open-ended loop, selecting tools and inspecting results until it determines the task is complete.</li>
</ul>

<div class='warn'>
<div class='lbl'>Exam Trap: Over-Engineering Autonomy</div>
<p>On the Architect exams, questions describing fixed business logic (e.g. loan approval, KYC, invoice parsing) will frequently present an autonomous swarm as a distractor option. The correct answer is always the <b>simplest sufficient deterministic pattern</b>.</p>
</div>

<h4>Latency Reduction via Parallel Orchestration</h4>
<p>When processing multi-section reports, sequentially querying an LLM 5 times results in total clock latency equal to $\sum_{i=1}^5 t_i$ (e.g. $5 \times 4\text{s} = 20\text{s}$). By orchestrating subtasks in parallel with an Orchestrator-Worker pattern, clock latency drops to $\max(t_i) + t_{\text{synth}} \approx 6\text{s}$, achieving a 70% latency reduction.</p>

<h4>Routing Patterns for Cost & Speed Optimization</h4>
<p>In high-volume customer support systems, over 60% of inquiries are simple FAQ queries that do not require tool use or expensive frontier reasoning. By placing a fast Claude 3.5 Haiku router at the entry point, simple inquiries are resolved immediately for under $0.001, reserving complex agent workflows exclusively for nuanced edge cases.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=kQmXZJp_6io' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Anthropic Building Effective Agents Guide</span><span class='vdesc'>Anthropic's architectural guide to workflows vs autonomous agents.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Always select the simplest sufficient architectural pattern for the task.</li>
  <li>Parallelize independent subtasks with Orchestrator-Workers to reduce clock latency from sum(t) to max(t).</li>
  <li>Evaluator-Optimizer loops must enforce hard iteration caps (max 3-5 passes) to prevent runaway execution.</li>
  <li>Use Routers to direct requests to targeted specialist prompts with minimal tool overhead.</li>
  <li>Filter high-volume simple inquiries with fast Haiku classifiers before routing to heavier agent tiers.</li>
</ul>
</div>`
  },
  {
    id: "ccafl-8",
    h: "Masterclass: Proactive Context Management & 80% Compaction",
    b: `<p>In enterprise applications, context window capacity is a <b>finite shared budget</b>. System prompts, tool definitions, retrieved RAG context, and accumulating conversation history all compete for the same 200,000-token window.</p>

<div class='callout'>
<div class='lbl'>The 80% Utilization Compaction Rule</div>
<p>Context compaction must be triggered <b>proactively at 80% utilization (160,000 tokens)</b>. If you wait until 100% capacity is reached, the context window is completely saturated, leaving zero token headroom to execute the summarization prompt itself.</p>
</div>

<h4>Compaction vs Truncation</h4>
<ul>
  <li><b>Blind FIFO Truncation:</b> Deletes the oldest 50% of messages. This causes severe context amnesia, discarding initial user requirements, authentication tokens, and early constraints.</li>
  <li><b>Structured Semantic Compaction:</b> Claude summarizes prior conversation history into a structured <code>&lt;key_facts&gt;</code> state block, preserving critical decisions while discarding conversational filler.</li>
</ul>

<div class='warn'>
<div class='lbl'>Exam Gotcha: Lost in the Middle Attention Curve</div>
<p>Large language models attend most strongly to the <b>beginning</b> (system prompt) and <b>very end</b> (latest user prompt) of long context windows. Critical operational instructions should always be placed at the very end of the prompt context.</p>
</div>

<h4>State Snapshotting & Blackboard Retention</h4>
<p>Rather than re-summarizing conversational prose repeatedly, enterprise agents maintain a centralized JSON state snapshot (Blackboard). At each turn, only state mutations and active subtask parameters are appended to prompt context, keeping total context usage sub-linear even in 100-turn workflows.</p>

<h4>Context Token Budget Allocation</h4>
<p>Architects must budget context allocations deliberately:</p>
<ul>
  <li><b>System Prompt & Tools:</b> 10% (up to 20,000 tokens) — Cached prefix.</li>
  <li><b>Retrieved RAG Context:</b> 40% (up to 80,000 tokens) — Dynamic top-K passages.</li>
  <li><b>Active Working History:</b> 30% (up to 60,000 tokens) — Recent turns and tool results.</li>
  <li><b>Safety Buffer & Generation Space:</b> 20% (40,000 tokens) — Compaction trigger margin and max output tokens.</li>
</ul>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=005JLRt3gXI' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Long Context Window Management & Optimization</span><span class='vdesc'>Techniques for managing multi-turn state and avoiding context window overflow.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Trigger context compaction proactively at 80% capacity to ensure sufficient headroom for the compaction call.</li>
  <li>Use semantic structured compaction to preserve key decisions rather than blind FIFO message truncation.</li>
  <li>Place critical instructions at the end of prompt contexts to exploit the LLM attention curve.</li>
  <li>Maintain structured JSON blackboard state to avoid accumulating conversational transcript bloat.</li>
  <li>Establish formal token budget allocations across system, RAG, history, and generation headroom.</li>
</ul>
</div>`
  },
  {
    id: "ccafl-9",
    h: "Masterclass: Resilience, Rate Limiting & Graceful Degradation",
    b: `<p>Production architectures must be designed for failure. Upstream network drops, HTTP 429 rate limits, and third-party API outages must be handled with <b>token bucket rate limiting, jittered backoff, and tiered degradation cascades</b>.</p>

<div class='callout'>
<div class='lbl'>Exponential Backoff with Full Jitter</div>
<p>When receiving HTTP 429 (Rate Limit) or HTTP 529 (Overloaded), clients must retry using exponential backoff with full jitter to prevent thundering herd server saturation:</p>
<p style='font-family:monospace; font-size:13px;'>t_sleep = random_uniform(0, min(max_backoff, base_backoff × 2^attempt))</p>
</div>

<h4>The Enterprise Graceful Degradation Cascade</h4>
<ol>
  <li><b>Primary Tier:</b> Claude 3.5 Sonnet handles the request.</li>
  <li><b>Transient Retry Tier:</b> Up to 2 retries with exponential backoff and full jitter.</li>
  <li><b>Fast Fallback Tier:</b> Claude 3.5 Haiku handles essential classification or extraction.</li>
  <li><b>Cached Static Tier:</b> Serve pre-computed FAQ response or cached data.</li>
  <li><b>Human Escalation:</b> Create an urgent ticket for human specialist review.</li>
</ol>

<div class='warn'>
<div class='lbl'>Exam Rule: Circuit Breakers</div>
<p>Downstream tools must be protected by Circuit Breakers. If a tool fails 5 consecutive times, trip the circuit to OPEN to fail fast immediately without exhausting server thread pools.</p>
</div>

<h4>Token Bucket Gateway Throttling</h4>
<p>To ensure fair multi-tenant utilization and prevent sudden spikes from exhausting Anthropic API rate limits (TPM / RPM), deploy an API gateway (e.g. Kong, Envoy, or Redis Token Bucket) that meters incoming requests at the enterprise boundary before forwarding to Anthropic.</p>

<h4>Designing Dead Letter Queues (DLQ) for Failed Agent Tasks</h4>
<p>When an asynchronous worker task exhausts all retries without success, never drop the task silently. Route the failed execution context, error stack trace, and input payload to an encrypted Dead Letter Queue (DLQ). Automated alerts notify engineers, and a secondary triage agent analyzes the root cause failure pattern.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=LPZh9BOjkQs' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Building Fault-Tolerant Enterprise AI Architectures</span><span class='vdesc'>Resilience engineering, rate limit handling, and fallback cascade design.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Always apply full jitter to exponential retry backoff to prevent synchronized retry storms.</li>
  <li>Design multi-tier fallback cascades: Sonnet → Haiku → Cached Response → Human Escalation.</li>
  <li>Circuit breakers isolate failing downstream dependencies and prevent cascading outages.</li>
  <li>Deploy token bucket rate limiters at your API gateway to meter requests within upstream TPM caps.</li>
  <li>Route permanently failed background tasks to a Dead Letter Queue (DLQ) for inspection.</li>
</ul>
</div>`
  }
];

// -------------------------------------------------------------
// 4. CCAR-P: 4 Deep-Dive Masterclasses (Lessons 6, 7, 8, 9)
// -------------------------------------------------------------
const ccapMasterclasses = [
  {
    id: "ccapl-6",
    h: "Masterclass: Production Multi-Agent Systems & Blackboard Architecture",
    b: `<p>At enterprise scale, multi-agent architectures provide <b>context isolation and specialization</b>, not extra magical intelligence. Poorly designed multi-agent systems suffer from exponential token spend and communication deadlocks.</p>

<div class='callout'>
<div class='lbl'>The Blackboard Architecture Pattern</div>
<p>In peer-to-peer agent architectures, passing full chat transcripts between 8 agents causes context windows to explode. Under the <b>Blackboard Pattern</b>:</p>
<ul>
  <li>A centralized, structured state store (backed by Redis, PostgreSQL, or in-memory JSON) acts as the single source of truth.</li>
  <li>Specialist subagents (researcher, coder, tester, auditor) read only their required state slices and write back typed structured findings.</li>
  <li>Subagent context windows remain compact, focused, and free of conversational clutter.</li>
</ul>
</div>

<h4>DAG Execution & Deadlock Prevention</h4>
<p>To prevent circular dependency deadlocks between autonomous agents, structure task workflows as a <b>Directed Acyclic Graph (DAG)</b>. Enforce hard wall-clock iteration timeouts and token spend ceilings on every subagent.</p>

<div class='warn'>
<div class='lbl'>Exam Gotcha: Swarm Anti-Pattern</div>
<p>Unconstrained agent swarms negotiating without centralized state or DAG constraints are an enterprise anti-pattern. They introduce high latency, runaway token bills, and untraceable error states.</p>
</div>

<h4>Subagent Context Isolation & Clean Room Design</h4>
<p>When spawning a subagent (such as an SQL query generator), pass only the exact schema and target question. Never pass the entire 50-turn parent conversation transcript. Context isolation prevents prompt drift and eliminates distracting irrelevant tokens.</p>

<h4>State Machine Orchestration vs Open-Ended Loops</h4>
<p>Production multi-agent systems use explicit finite state machines (e.g. AWS Step Functions, Temporal, or LangGraph) to drive transitions between agent stages. This ensures that every state transition is logged, deterministic, and replayable, while allowing individual subagents to operate with bounded autonomy within their designated state.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=kQmXZJp_6io' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Multi-Agent System Design & Orchestration</span><span class='vdesc'>Anthropic architectural patterns for reliable multi-agent coordination.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Use the Blackboard Pattern to decouple agent communication and prevent transcript context pollution.</li>
  <li>Structure inter-agent task dependencies as Directed Acyclic Graphs (DAGs) to prevent deadlocks.</li>
  <li>Enforce hard iteration caps, wall-clock timeouts, and token spend ceilings on every subagent.</li>
  <li>Spawn subagents in isolated clean-room contexts with only the minimal required prompt data.</li>
  <li>Use deterministic state machines to control transitions between multi-agent execution phases.</li>
</ul>
</div>`
  },
  {
    id: "ccapl-7",
    h: "Masterclass: Zero-Trust Security & MicroVM Container Sandboxing",
    b: `<p>Autonomous agents that generate and execute code present critical security risks. Enterprise security requires a <b>Zero-Trust Security Architecture</b> with microVM virtualization and strict egress filtering.</p>

<div class='callout'>
<div class='lbl'>Kernel-Level Isolation: gVisor & Firecracker</div>
<p>Standard Docker containers share the host Linux kernel, exposing infrastructure to container breakout vulnerabilities. Untrusted agent code execution must use:</p>
<ul>
  <li><b>gVisor:</b> A user-space kernel that intercepts and virtualizes Linux system calls, blocking direct host kernel access.</li>
  <li><b>Firecracker:</b> Lightweight KVM-based microVMs that launch in milliseconds with dedicated guest kernels and isolated memory.</li>
</ul>
</div>

<h4>Defending Against Indirect Prompt Injection</h4>
<p>Indirect prompt injection occurs when malicious instructions are embedded inside external data (web pages, customer emails, support tickets) to hijack agent tool execution.</p>

<div class='warn'>
<div class='lbl'>Zero-Trust Boundaries & Confirmation Gates</div>
<ul>
  <li><b>Trust Boundary:</b> Developer system prompts are TRUSTED. All external inputs, RAG passages, and tool return values are UNTRUSTED DATA.</li>
  <li><b>Least-Privilege Egress:</b> Restrict network traffic strictly to allowlisted API domains.</li>
  <li><b>Human Confirmation Gates:</b> Destructive mutations (database DROP, fund transfers over $1,000, account deletions) require out-of-band human multi-factor approval.</li>
</ul>
</div>

<h4>Cryptographic Audit Trails</h4>
<p>Every tool invocation executed by an autonomous agent must be signed and recorded in an immutable, append-only cryptographic audit log (e.g. AWS CloudTrail or QLDB) capturing input arguments, timestamp, caller identity, and tool output.</p>

<h4>Ephemeral Sandbox Lifecycle Management</h4>
<p>Agent sandbox environments must be strictly ephemeral. Provision a fresh, isolated microVM instance per execution session with read-only root filesystems and a capped memory/CPU budget. Immediately destroy and wipe the microVM upon task completion to eliminate persistent malware residency risks.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=005JLRt3gXI' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Zero-Trust Security & AI Agent Sandboxing</span><span class='vdesc'>MicroVM isolation, indirect injection defenses, and egress security controls.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Isolate untrusted agent code execution inside gVisor or Firecracker microVMs.</li>
  <li>Treat all external retrieved content as untrusted data to defend against indirect prompt injections.</li>
  <li>Enforce least-privilege egress filtering and require human confirmation for destructive operations.</li>
  <li>Record all agent tool actions in immutable, append-only audit logs for security compliance.</li>
  <li>Destroy and recreate ephemeral microVM sandboxes after every single execution session.</li>
</ul>
</div>`
  },
  {
    id: "ccapl-8",
    h: "Masterclass: OpenTelemetry Observability & Multi-Tenant Cost Attribution",
    b: `<p>Enterprise AI deployments require comprehensive observability across latency, token consumption, error rates, and financial chargebacks. Production architectures standardize telemetry using <b>OpenTelemetry GenAI Semantic Conventions</b>.</p>

<div class='callout'>
<div class='lbl'>Standard OpenTelemetry GenAI Span Attributes</div>
<ul>
  <li><code>gen_ai.system</code>: <code>"anthropic"</code></li>
  <li><code>gen_ai.request.model</code>: <code>"claude-3-5-sonnet-20241022"</code></li>
  <li><code>gen_ai.usage.prompt_tokens</code>: Integer count of input tokens</li>
  <li><code>gen_ai.usage.completion_tokens</code>: Integer count of generated output tokens</li>
  <li><code>gen_ai.client.operation</code>: <code>"messages.create"</code></li>
</ul>
</div>

<h4>Multi-Tenant Billing Attribution via Request Metadata</h4>
<p>To accurately bill enterprise departments or SaaS tenants for API usage, attach metadata tags on every API call:</p>

<pre><code class='language-typescript'>const response = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  metadata: {
    tenant_id: "org_enterprise_9421",
    user_id: "usr_lead_architect_08",
    cost_center: "engineering_ai_ops"
  },
  messages: [{ role: "user", content: "..." }]
});</code></pre>

<div class='warn'>
<div class='lbl'>Critical APM Metrics to Monitor</div>
<ul>
  <li><b>Time-to-First-Token (TTFT):</b> Measures initial latency and prompt caching efficiency.</li>
  <li><b>P99 Latency:</b> Identifies runaway tool loops and deep thinking saturation.</li>
  <li><b>Token Spend Anomaly Alerts:</b> Triggers alerts if a single tenant exceeds 200% of baseline spend.</li>
</ul>
</div>

<h4>Distributed Tracing Across Multi-Step Agent Graphs</h4>
<p>Pass W3C trace context headers (<code>traceparent</code>) across all subagents, tool executions, and LLM calls. This links the entire agent reasoning chain into a unified distributed trace in Datadog, Honeycomb, or Jaeger.</p>

<h4>Automated Cost Anomaly Detection & Throttling</h4>
<p>Deploy real-time stream processors (e.g. Apache Flink or Kafka Streams) reading OpenTelemetry telemetry spans to aggregate per-tenant token consumption in 1-minute windows. If an unconstrained agent loop triggers a runaway surge exceeding budget ceilings, automatically throttle the tenant API key and notify on-call engineering.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=Z3mN7U3O4fE' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>OpenTelemetry & Production LLM Observability</span><span class='vdesc'>How to trace agent workflows and implement multi-tenant cost chargebacks.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Instrument all LLM invocations with standard OpenTelemetry GenAI span attributes.</li>
  <li>Attach <code>metadata: { tenant_id, user_id }</code> on every API request for automated cost attribution.</li>
  <li>Monitor TTFT, P99 latency, and token consumption distributions to detect anomalies.</li>
  <li>Propagate W3C trace context across all subagent calls to visualize end-to-end execution graphs.</li>
  <li>Implement real-time spend anomaly detection to throttle runaway agent loops automatically.</li>
</ul>
</div>`
  },
  {
    id: "ccapl-9",
    h: "Masterclass: High Availability, Circuit Breakers & Scaled Red-Teaming",
    b: `<p>Principal architects must design systems that maintain 99.99% availability under severe upstream degradation, adversarial attacks, and scale shifts. This is achieved through <b>Circuit Breakers</b>, <b>Automated Red-Teaming</b>, and <b>Continuous Golden Regression Gates</b>.</p>

<div class='callout'>
<div class='lbl'>The 3-State Circuit Breaker Pattern</div>
<ul>
  <li><b>CLOSED (Normal Operation):</b> All tool and model requests pass through. Failures are counted within a sliding time window.</li>
  <li><b>OPEN (Failing Fast):</b> When failure threshold (e.g. 5 consecutive timeouts) is reached, the breaker trips to OPEN. All requests fail fast immediately, serving cached fallback responses without waiting for network timeouts.</li>
  <li><b>HALF-OPEN (Probing Recovery):</b> After a cool-off period (e.g. 60 seconds), a small percentage of canary requests are allowed through to probe upstream health. If successful, reset to CLOSED; if failing, return to OPEN.</li>
</ul>
</div>

<h4>Automated Synthetic Red-Teaming</h4>
<p>Manual penetration testing cannot keep pace with continuous prompt and model updates. Production pipelines use specialized adversary models to generate thousands of synthetic jailbreak permutations, prompt injection probes, and boundary stress tests.</p>

<div class='warn'>
<div class='lbl'>Exam Rule: Golden Regression Evaluation Gates</div>
<p>Never deploy a prompt update or new tool schema without running the full 500+ Golden Dataset regression suite in CI/CD. Automated position-swapped pairwise grading ensures zero regression in accuracy or safety guardrails.</p>
</div>

<h4>Active-Active Multi-Region Disaster Recovery</h4>
<p>For mission-critical applications, configure active-active failover across cloud providers (e.g. Anthropic direct API, AWS Bedrock, and GCP Vertex AI). Route traffic using weighted DNS health checks with automated failover in under 5 seconds.</p>

<h4>Chaos Engineering for AI Agent Workflows</h4>
<p>Conduct scheduled chaos engineering drills (e.g. simulating 50% tool API packet loss, injecting unexpected JSON-RPC tool schemas, and dropping upstream database connections) to verify that circuit breakers trip cleanly and degradation cascades activate without crashing user-facing services.</p>

<div class='vbox'>
<div class='lbl'>📺 Watch</div>
<a href='https://www.youtube.com/watch?v=LPZh9BOjkQs' target='_blank'><span class='vicon'>▶</span><span><span class='vtitle'>Enterprise AI Disaster Recovery & Circuit Breakers</span><span class='vdesc'>High availability patterns and active-active multi-region failover for LLM architectures.</span></span></a>
</div>

<div class='kbox'>
<div class='lbl'>Key takeaways</div>
<ul>
  <li>Implement 3-state Circuit Breakers on all downstream tools to prevent cascading failures.</li>
  <li>Use automated synthetic red-teaming to continuously probe security and injection defenses.</li>
  <li>Enforce Golden Dataset regression gates in CI/CD before any production deployment.</li>
  <li>Architect active-active failover across Anthropic direct API, AWS Bedrock, and GCP Vertex AI.</li>
  <li>Conduct chaos engineering drills to test fallback cascades and circuit breaker trip logic under simulated failure.</li>
</ul>
</div>`
  }
];

// Append masterclasses to each certification
const ccaoData = loadCert('ccao');
ccaoData.lessons = [...ccaoData.lessons.slice(0, 8), ...ccaoMasterclasses];
saveCert('ccao', ccaoData);

const ccdvData = loadCert('ccdv');
ccdvData.lessons = [...ccdvData.lessons.slice(0, 8), ...ccdvMasterclasses];
saveCert('ccdv', ccdvData);

const ccafData = loadCert('ccaf');
ccafData.lessons = [...ccafData.lessons.slice(0, 6), ...ccafMasterclasses];
saveCert('ccaf', ccafData);

const ccapData = loadCert('ccap');
ccapData.lessons = [...ccapData.lessons.slice(0, 6), ...ccapMasterclasses];
saveCert('ccap', ccapData);

console.log('Successfully written complete, high-depth Masterclasses across all 4 certs!');
