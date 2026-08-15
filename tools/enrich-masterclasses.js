const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const prose = b => b.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Load each cert, enrich any masterclass lessons that are under 450 words
const certs = ['ccao', 'ccdv', 'ccaf', 'ccap'];

const enrichments = {
  "ccdvl-10": `<h4>Type-Safe Schema Definitions with Zod and Pydantic</h4>
<p>Modern TypeScript and Python backends avoid writing raw JSON schema dictionaries by hand. Instead, developers define strict schema types using Zod or Pydantic, which automatically generate compliant JSON schemas. These libraries provide runtime type validation, custom coercion filters, and detailed descriptive error messages that can be fed directly back to Claude when argument mismatches occur.</p>
<p>Always configure strict schema validation on your API endpoints. If an argument fails type checks or violates regex format constraints, return an actionable, structured error payload so the model can correct its inputs autonomously without human intervention.</p>`,

  "ccdvl-11": `<h4>Managing Token Streaming in High-Concurrency Environments</h4>
<p>In high-concurrency enterprise applications serving thousands of simultaneous users, managing open SSE connections requires robust server architecture. Use connection pooling, asynchronous worker queues, and backpressure mechanisms to prevent slow clients from consuming excessive server resources. In addition, always instrument streaming event loops with timeout monitors to terminate orphaned connections if a client disconnects prematurely.</p>
<p>When implementing user interfaces with real-time token streaming, throttle DOM updates using <code>requestAnimationFrame</code> or 50ms micro-batches. Directly updating the DOM on every single token delta can cause UI lag and browser thread starvation on low-power mobile devices.</p>`,

  "ccafl-6": `<h4>Query Expansion & HyDE (Hypothetical Document Embeddings)</h4>
<p>When user search queries are short, ambiguous, or phrased as questions (e.g. <i>"Why did my deployment fail yesterday?"</i>), vector similarity against raw documentation chunks yields poor recall because documentation is written declaratively rather than interrogatively. Production architectures solve this using <b>Hypothetical Document Embeddings (HyDE)</b>: Claude 3.5 Haiku first generates a hypothetical answer passage, and the embedding of that hypothetical answer is used to retrieve actual source documents.</p>
<p>Additionally, multi-query expansion generates 3-5 paraphrased variations of the user prompt in parallel, searching vector and BM25 indices across all permutations to ensure comprehensive recall across disparate technical vocabularies.</p>`,

  "ccafl-7": `<h4>State Management & Workflow Resumption</h4>
<p>Long-running enterprise workflows (such as legal contract review or multi-stage code migration) can take minutes or hours to complete. Production workflow architectures must persist intermediate state after every execution step into a distributed database (such as PostgreSQL or DynamoDB). If a worker node crashes or an API call experiences a transient failure, the workflow can resume immediately from the latest checkpoint without re-running completed steps.</p>
<p>Always design workflow steps to be idempotent and deterministic. Tag each execution stage with a unique run ID to enable full auditability and step-level replay during debugging sessions.</p>`,

  "ccafl-8": `<h4>Hierarchical Memory Stores & Vector Scratchpads</h4>
<p>For autonomous agents executing extended multi-day or multi-session workflows, accumulating context inside the active prompt window is unsustainable. Enterprise architectures implement <b>Hierarchical Memory Systems</b>:</p>
<ul>
  <li><b>Working Memory (Short-Term):</b> The active 200,000-token prompt context containing immediate system instructions and the current subtask.</li>
  <li><b>Episodic Memory (Medium-Term):</b> Structured JSON summaries of past sessions indexed in a fast key-value store like Redis.</li>
  <li><b>Semantic Memory (Long-Term):</b> Deep knowledge bases and historical transcripts stored in a vector database for targeted on-demand RAG retrieval.</li>
</ul>`,

  "ccafl-9": `<h4>Health Checks, Canary Deployments & Traffic Shifting</h4>
<p>When deploying new model versions, updated prompt templates, or modified tool definitions, never perform an immediate 100% cutover. Implement <b>Canary Deployments</b>: route 5% of production traffic to the new prompt/model configuration while monitoring error rates, TTFT, and user feedback signals in real time.</p>
<p>If the canary deployment experiences anomalous latency spikes or elevated refusal rates, automated circuit breakers immediately rollback traffic to the previous stable baseline within seconds, preventing widespread service disruption.</p>`,

  "ccapl-6": `<h4>Agent Communication Protocols & Type Contracts</h4>
<p>In large-scale multi-agent deployments, subagents must never exchange unstructured natural language prose. Unstructured inter-agent chatter leads to semantic ambiguity, hallucinated parameters, and runaway context window bloat. Instead, enforce strict JSON-RPC or Protocol Buffer schemas for all inter-agent messages.</p>
<p>Every subagent message must contain a validated schema version, correlation ID, parent task trace ID, and typed payload. If a subagent receives a malformed message, it rejects the payload with an explicit error code, allowing the orchestrator to re-route or retry the operation deterministically.</p>`,

  "ccapl-7": `<h4>Network Segmentation & Non-Exfiltration Guardrails</h4>
<p>To eliminate data exfiltration risks from compromised tools or malicious prompt injections, isolate agent execution environments within private VPC subnets with zero direct internet access. All outbound network connections must pass through a strict forward proxy that enforces domain allowlists, TLS inspection, and payload data loss prevention (DLP) filtering.</p>
<p>Any attempt by an agent or script to establish unauthorized outbound connections (e.g. DNS tunneling, reverse shells, or HTTP POST requests to unknown IP addresses) immediately terminates the container process and alerts the enterprise security operations center (SOC).</p>`,

  "ccapl-8": `<h4>Cost Attribution Tagging & FinOps Governance</h4>
<p>Managing multi-million dollar enterprise AI budgets requires automated FinOps governance. By standardizing request metadata attributes across all client SDKs, finance teams can generate automated daily cost reports broken down by business unit, product feature, developer team, and geographic region.</p>
<p>Configure automated hard budget caps: if a specific department or non-production testing environment reaches 90% of its monthly token allocation, send automated alerts; if it exceeds 100%, automatically throttle non-critical background jobs until budget extensions are approved.</p>
<p>Additionally, monitor token efficiency ratios over time (tokens consumed per successful task completion). A sudden degradation in efficiency signals prompt drift, broken tool schemas, or infinite retry loops that require immediate engineering intervention.</p>`,

  "ccapl-9": `<h4>Automated Fuzzing & Adversarial Robustness Testing</h4>
<p>Continuous security verification requires automated adversarial fuzzing pipelines. Deploy automated red-teaming agents that continuously bombard staging endpoints with thousands of mutated prompt injections, base64-encoded jailbreaks, multi-lingual bypass attempts, and Unicode homoglyph attacks.</p>
<p>Track your system's adversarial defense metrics over time. If a new prompt iteration weakens guardrail robustness against known attack vectors, automatically block deployment in CI/CD and notify security engineering.</p>`
};

for (const c of certs) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${c}.json`), 'utf8'));
  let modified = false;

  data.lessons.forEach(l => {
    if (enrichments[l.id]) {
      // Inject enrichment before takeaways/kbox
      const kboxPos = l.b.indexOf("<div class='kbox'>");
      if (kboxPos >= 0) {
        l.b = l.b.slice(0, kboxPos) + enrichments[l.id] + "\n\n" + l.b.slice(kboxPos);
        modified = true;
      }
    }
  });

  if (modified) {
    fs.writeFileSync(path.join(dataDir, `${c}.json`), JSON.stringify(data, null, 2), 'utf8');
    console.log(`Enriched masterclass lessons in ${c}.json`);
  }
}
