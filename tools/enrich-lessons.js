const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function enrichFile(certId, enrichments) {
  const filePath = path.join(dataDir, `${certId}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.lessons) return;

  data.lessons.forEach(lesson => {
    const match = enrichments[lesson.id];
    if (match) {
      if (match.widget && !lesson.b.includes(`data-widget='${match.widget}'`)) {
        lesson.b += `<div class='widget-box' data-widget='${match.widget}'></div>`;
      }
      if (match.examTip && !lesson.b.includes('🎯 Exam Tip')) {
        lesson.b += `<div class='exambox'><div class='lbl'>🎯 Exam Tip — ${match.examTipTitle}</div><p>${match.examTip}</p></div>`;
      }
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Enriched ${certId}.json`);
}

// Map lesson IDs to interactive widgets and high-yield exam tips
const enrichments = {
  // CCAO-F
  'ccaol-prompting': {
    widget: 'xml-prompt',
    examTipTitle: 'Role vs Capability',
    examTip: 'Role prompting (e.g. <i>"You are a senior auditor..."</i>) frames tone, register, and domain perspective. It does <b>not</b> unlock hidden capabilities or guarantee factuality. Use constraints and examples to shape capability.'
  },
  'ccaol-output-evaluation': {
    examTipTitle: 'Hallucination & Verification',
    examTip: 'Polished fluency carries zero information about factual accuracy. Always verify dates, citations, and numbers against the source. Disclaimers do not make unverified facts safe to send.'
  },
  'ccaol-model-selection': {
    widget: 'token-cost',
    examTipTitle: 'Selection & Escalation Rules',
    examTip: 'Escalate to a higher-capability model tier based on <b>observed reasoning failures</b> on your specific task class — never because a prompt is long or a senior stakeholder asked.'
  },
  'ccaol-governance-risk': {
    examTipTitle: 'Data Classification & Accountability',
    examTip: 'Policy and data classification checks come <b>before</b> prompt design or cost comparisons. Accountability for generated output always sits with the human who reviewed and published it.'
  },

  // CCDV-F
  'ccdvl-api-mechanics': {
    widget: 'stop-reason',
    examTipTitle: 'Required Fields & stop_reason Branching',
    examTip: '<code>model</code>, <code>max_tokens</code>, and <code>messages</code> are required on every request. Sampling parameters like <code>temperature</code> are rejected on current models. Always branch on <code>stop_reason</code> before consuming content!'
  },
  'ccdvl-tool-use-structured-output': {
    examTipTitle: 'Structured Output & Tool Loops',
    examTip: 'Use <code>output_config.format</code> for schema-guaranteed JSON output, and <code>strict: true</code> for tool arguments. Do <b>not</b> use assistant-turn prefilling ( seeting <code>{</code> ), which errors on current models.'
  },
  'ccdvl-model-selection-cost': {
    widget: 'token-cost',
    examTipTitle: 'Prompt Caching & Batches API Stack',
    examTip: 'Prompt caching requires stable prefixes (system prompt, tool schemas, docs). Variable content early in the request breaks the cache for everything after it. Use Batches API for 50% discount on non-urgent async work.'
  },
  'ccdvl-prompt-context-engineering': {
    widget: 'xml-prompt',
    examTipTitle: 'Context Ordering',
    examTip: 'Structure long input prompts with documents first and instructions last (e.g. <code>&lt;document&gt;...&lt;/document&gt; &lt;instructions&gt;...&lt;/instructions&gt;</code>) to anchor attention on what to do with what was just read.'
  },
  'ccdvl-security': {
    examTipTitle: 'Prompt Injection Defense',
    examTip: 'Instructions come from your application and user. Web pages, emails, tool results, and retrieved docs are <b>data</b>. Protect against indirect prompt injection architecturally with least-privilege tools and confirmation gates.'
  },

  // CCAR-F
  'ccafl-agentic-architecture-orchestration': {
    examTipTitle: 'Workflow vs Agent Loop Selection',
    examTip: 'Predictable multi-step tasks belong in fixed, deterministic workflows. Use autonomous agent loops only when the execution path genuinely cannot be known in advance.'
  },
  'ccafl-prompt-engineering-structured-output': {
    widget: 'xml-prompt',
    examTipTitle: 'Few-Shot Example Anchor',
    examTip: 'Providing 1-3 worked examples (few-shot prompting) is the single most effective way to pin down complex output structure across diverse edge cases.'
  },
  'ccafl-context-management-reliability': {
    widget: 'token-cost',
    examTipTitle: 'Proactive Compaction',
    examTip: 'Compact conversation history <b>proactively</b> at a token threshold (e.g. 80% of window) to leave headroom for the compaction call. Waiting for a context overflow failure leaves no room.'
  },

  // CCAR-P
  'ccapl-multi-agent-systems-at-scale': {
    examTipTitle: 'Subagent Isolation & Token Overhead',
    examTip: 'Subagent architectures provide context isolation and parallel execution, not extra intelligence. Subagents increase total token consumption — scope subagent responsibilities narrowly.'
  },
  'ccapl-reliability-error-recovery': {
    widget: 'stop-reason',
    examTipTitle: 'Circuit Breakers & Exponential Backoff',
    examTip: 'HTTP 429 rate limit responses require exponential backoff with jitter. Circuit breakers stop cascading failures when downstream tool dependencies fail.'
  },
  'ccapl-cost-latency-model-strategy': {
    widget: 'token-cost',
    examTipTitle: 'Cost Optimization Stack',
    examTip: 'Stack all three levers for maximum savings: right-sized models per pipeline step + prompt caching on stable system prefixes + Batches API for async workloads.'
  }
};

Object.keys(enrichments).forEach(certId => {
  const prefix = certId.split('l-')[0]; // e.g. ccao, ccdv
  enrichFile(prefix, enrichments);
});
