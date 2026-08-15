const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function injectHighYield(certId, upgrades) {
  const filePath = path.join(dataDir, `${certId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.lessons) return;

  data.lessons.forEach(lesson => {
    const upgrade = upgrades[lesson.id];
    if (upgrade) {
      if (upgrade.html && !lesson.b.includes(upgrade.marker)) {
        lesson.b += upgrade.html;
      }
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Injected ultra-high-yield topics into ${certId}.json`);
}

// CCAO-F High Yield Additions
const ccaoUpgrades = {
  'ccaol-prompting': {
    marker: 'LOST_IN_THE_MIDDLE_HY',
    html: `
<h4>Context Attention: The "Lost in the Middle" Effect</h4>
<p>Transformer-based LLMs exhibit an attention curve where tokens at the very <b>beginning</b> (system prompt, initial context) and <b>end</b> (final user query) of the prompt receive the highest attention weights. Tokens placed in the middle of a massive context window can suffer from reduced retrieval accuracy unless explicitly anchored.</p>
<div class='exambox'>
<div class='lbl'>🎯 Exam Tip — Context Ordering Rule</div>
<p>Place reference documents, background manuals, and RAG search results <b>first</b> in the prompt, and place your specific task instructions and queries <b>last</b>. Use XML tags (e.g. <code>&lt;document&gt;</code>) to bound the middle content.</p>
</div>`
  },
  'ccaol-model-selection': {
    marker: 'SAMPLING_PARAMS_TABLE_HY',
    html: `
<h4>Sampling Parameters Quick Reference</h4>
<table style='width:100%; font-size:12.5px; border-collapse:collapse; margin:12px 0;'>
  <thead>
    <tr style='background:var(--card); border-bottom:2px solid var(--border);'>
      <th style='padding:8px; text-align:left;'>Parameter</th>
      <th style='padding:8px; text-align:left;'>Range & Default</th>
      <th style='padding:8px; text-align:left;'>When to Adjust</th>
    </tr>
  </thead>
  <tbody>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>Temperature</b></td>
      <td style='padding:8px;'>0.0 to 1.0 (default 1.0)</td>
      <td style='padding:8px;'>Use <b>0.0</b> for code, math, and JSON extraction (deterministic); use <b>0.7 - 1.0</b> for creative writing.</td>
    </tr>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>Top-P (Nucleus)</b></td>
      <td style='padding:8px;'>0.0 to 1.0</td>
      <td style='padding:8px;'>Cuts off candidate token tail based on cumulative probability mass. (Recommend adjusting Temperature OR Top-P, not both).</td>
    </tr>
    <tr>
      <td style='padding:8px;'><b>Top-K</b></td>
      <td style='padding:8px;'>Integer (e.g. 50)</td>
      <td style='padding:8px;'>Limits choices to the K highest probability tokens. Useful for preventing rare out-of-context words.</td>
    </tr>
  </tbody>
</table>`
  }
};

// CCDV-F High Yield Additions
const ccdvUpgrades = {
  'ccdvl-api-mechanics': {
    marker: 'RATELIMIT_HEADERS_HY',
    html: `
<h4>Reading Rate Limit Response Headers</h4>
<p>Anthropic API HTTP responses return standard headers to monitor your quota in real-time:</p>
<ul>
  <li><code>anthropic-ratelimit-requests-limit</code> — Max requests permitted per minute (RPM).</li>
  <li><code>anthropic-ratelimit-requests-remaining</code> — Requests remaining in current window.</li>
  <li><code>anthropic-ratelimit-requests-reset</code> — ISO 8601 timestamp when RPM resets.</li>
  <li><code>anthropic-ratelimit-tokens-limit</code> — Max tokens permitted per minute (TPM).</li>
  <li><code>anthropic-ratelimit-tokens-remaining</code> — Tokens remaining in current window.</li>
  <li><code>anthropic-ratelimit-tokens-reset</code> — ISO 8601 timestamp when TPM resets.</li>
</ul>
<div class='exbox'>
<div class='lbl'>🎯 Exam Tip — Exact Backoff Duration</div>
<p>Instead of guessing sleep time on an HTTP 429, parse <code>anthropic-ratelimit-tokens-reset</code> to compute the exact sleep duration needed until the quota bucket replenishes!</p>
</div>`
  },
  'ccdvl-tool-use-structured-output': {
    marker: 'TOOL_CHOICE_MODES_HY',
    html: `
<h4>The <code>tool_choice</code> Parameter Modes</h4>
<p>Control model tool invocation behavior using <code>tool_choice</code>:</p>
<table style='width:100%; font-size:12.5px; border-collapse:collapse; margin:12px 0;'>
  <thead>
    <tr style='background:var(--card); border-bottom:2px solid var(--border);'>
      <th style='padding:8px; text-align:left;'>Mode</th>
      <th style='padding:8px; text-align:left;'>JSON Syntax</th>
      <th style='padding:8px; text-align:left;'>Model Behavior</th>
    </tr>
  </thead>
  <tbody>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>Auto (Default)</b></td>
      <td style='padding:8px;'><code>{"type": "auto"}</code></td>
      <td style='padding:8px;'>Model decides whether to call a tool or reply with plain text.</td>
    </tr>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>Any (Mandatory Tool)</b></td>
      <td style='padding:8px;'><code>{"type": "any"}</code></td>
      <td style='padding:8px;'>Model <b>must</b> call at least one of the provided tools.</td>
    </tr>
    <tr>
      <td style='padding:8px;'><b>Tool (Specific Tool)</b></td>
      <td style='padding:8px;'><code>{"type": "tool", "name": "db_lookup"}</code></td>
      <td style='padding:8px;'>Model <b>must</b> call the specific named tool (useful for forcing structured JSON extraction).</td>
    </tr>
  </tbody>
</table>`
  },
  'ccdvl-model-selection-cost': {
    marker: 'PROMPT_CACHE_EXACT_MINS_HY',
    html: `
<h4>Prompt Caching Minimum Block Sizes & Batches API Spec</h4>
<table style='width:100%; font-size:12.5px; border-collapse:collapse; margin:12px 0;'>
  <thead>
    <tr style='background:var(--card); border-bottom:2px solid var(--border);'>
      <th style='padding:8px; text-align:left;'>Model Family</th>
      <th style='padding:8px; text-align:left;'>Min Cache Block Size</th>
      <th style='padding:8px; text-align:left;'>Cache TTL</th>
    </tr>
  </thead>
  <tbody>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>Claude 3.5 Sonnet / Opus</b></td>
      <td style='padding:8px;'><b>1,024 tokens</b></td>
      <td style='padding:8px;'>5 minutes (refreshed on hit)</td>
    </tr>
    <tr>
      <td style='padding:8px;'><b>Claude 3.5 Haiku</b></td>
      <td style='padding:8px;'><b>2,048 tokens</b></td>
      <td style='padding:8px;'>5 minutes (refreshed on hit)</td>
    </tr>
  </tbody>
</table>
<div class='exbox'>
<div class='lbl'>🎯 Exam Tip — Batches API Limits</div>
<p>The Batches API (<code>POST /v1/messages/batches</code>) supports up to <b>10,000 requests</b> per batch file with a 24-hour SLA at a <b>50% discount</b> on all input and output tokens!</p>
</div>`
  }
};

// CCAR-F High Yield Additions
const ccafUpgrades = {
  'ccafl-context-management-reliability': {
    marker: 'HYBRID_RAG_SEARCH_HY',
    html: `
<h4>RAG Architecture: Hybrid Search & Reranking</h4>
<p>Vector search (dense embeddings) alone struggles with exact entity matches like serial numbers, product SKUs, or error codes. Production RAG pipelines use <b>Hybrid Search</b>:</p>
<ol>
  <li><b>Dense Retrieval:</b> Vector similarity search (e.g. cosine distance) for conceptual semantics.</li>
  <li><b>Sparse Retrieval:</b> BM25 / TF-IDF keyword search for exact term matches.</li>
  <li><b>Reciprocal Rank Fusion (RRF) & Cross-Encoder Reranking:</b> Re-ranks top results from both methods before injecting the top-k chunks into Claude's prompt context.</li>
</ol>`
  }
};

// CCAR-P High Yield Additions
const ccapUpgrades = {
  'ccapl-eval-observability': {
    marker: 'OPENTELEMETRY_GENAI_HY',
    html: `
<h4>OpenTelemetry GenAI Semantic Conventions</h4>
<p>Production LLM observability relies on standard OpenTelemetry trace spans. Attribute conventions to log on model invocation spans:</p>
<ul>
  <li><code>gen_ai.system</code> = <code>"anthropic"</code></li>
  <li><code>gen_ai.request.model</code> = <code>"claude-3-5-sonnet-20241022"</code></li>
  <li><code>gen_ai.usage.prompt_tokens</code> = input token count</li>
  <li><code>gen_ai.usage.completion_tokens</code> = output token count</li>
  <li><code>gen_ai.response.finish_reasons</code> = <code>["end_turn"]</code></li>
</ul>`
  }
};

injectHighYield('ccao', ccaoUpgrades);
injectHighYield('ccdv', ccdvUpgrades);
injectHighYield('ccaf', ccafUpgrades);
injectHighYield('ccap', ccapUpgrades);
