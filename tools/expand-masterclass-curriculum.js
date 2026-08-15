const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

function injectCurriculum(certId, upgrades) {
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
  console.log(`Injected masterclass curriculum into ${certId}.json`);
}

// SVG Diagrams
const svgVisionToken = `
<div class='diagram-box'>
<svg viewBox='0 0 620 160' xmlns='http://www.w3.org/2000/svg'>
  <rect x='20' y='20' width='160' height='120' rx='10' fill='#fff' stroke='#5b7fa6' stroke-width='2'/>
  <text x='100' y='45' text-anchor='middle' font-size='11' font-weight='700' fill='#5b7fa6'>Input Image / Page</text>
  <text x='100' y='75' text-anchor='middle' font-size='10' fill='#2b2620'>Width × Height</text>
  <text x='100' y='95' text-anchor='middle' font-size='9' fill='#8a8073'>Max scale: 1568px</text>

  <line x1='180' y1='80' x2='225' y2='80' stroke='#8a8073' stroke-width='2' marker-end='url(#svgarrv1)'/>

  <rect x='225' y='20' width='200' height='120' rx='10' fill='#e8b448'/>
  <text x='325' y='45' text-anchor='middle' font-size='11' font-weight='700' fill='#fff'>Tokenization Formula</text>
  <text x='325' y='75' text-anchor='middle' font-size='12' font-weight='700' fill='#fff'>Tokens = (W × H) / 750</text>
  <text x='325' y='100' text-anchor='middle' font-size='9.5' fill='#fff'>e.g. 1024×768 ≈ 1,048 tokens</text>

  <line x1='425' y1='80' x2='470' y2='80' stroke='#8a8073' stroke-width='2' marker-end='url(#svgarrv1)'/>

  <rect x='470' y='20' width='130' height='120' rx='10' fill='#fff' stroke='#5a9e6f' stroke-width='2'/>
  <text x='535' y='45' text-anchor='middle' font-size='11' font-weight='700' fill='#5a9e6f'>Model Context</text>
  <text x='535' y='75' text-anchor='middle' font-size='9.5' fill='#2b2620'>Vision patch</text>
  <text x='535' y='92' text-anchor='middle' font-size='9.5' fill='#2b2620'>embeddings</text>
  <defs><marker id='svgarrv1' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'><path d='M0,0 L6,3 L0,6 Z' fill='#8a8073'/></marker></defs>
</svg>
<div class='diagram-cap'>Vision Token Math: Every image or PDF page is billed by pixel area divided by 750 tokens.</div>
</div>`;

const svgThinkingTrace = `
<div class='diagram-box'>
<svg viewBox='0 0 620 150' xmlns='http://www.w3.org/2000/svg'>
  <rect x='20' y='20' width='260' height='110' rx='10' fill='#fff' stroke='#8a6fae' stroke-width='2'/>
  <text x='150' y='42' text-anchor='middle' font-size='11' font-weight='700' fill='#8a6fae'>1. Thinking Block (Hidden Reasoning)</text>
  <text x='34' y='65' font-size='9.5' fill='#2b2620'>• Internal step-by-step reasoning</text>
  <text x='34' y='82' font-size='9.5' fill='#2b2620'>• Budgeted by budget_tokens</text>
  <text x='34' y='99' font-size='9.5' fill='#8a8073'>• Carries signature token for security</text>

  <line x1='280' y1='75' x2='330' y2='75' stroke='#8a8073' stroke-width='2' marker-end='url(#svgarrth1)'/>

  <rect x='330' y='20' width='270' height='110' rx='10' fill='#fff' stroke='#5a9e6f' stroke-width='2'/>
  <text x='465' y='42' text-anchor='middle' font-size='11' font-weight='700' fill='#5a9e6f'>2. Text Content Block (Final Output)</text>
  <text x='344' y='65' font-size='9.5' fill='#2b2620'>• Clean final answer delivered to user</text>
  <text x='344' y='82' font-size='9.5' fill='#2b2620'>• Constrained by (max_tokens - budget)</text>
  <text x='344' y='99' font-size='9.5' fill='#8a8073'>• Safe to display in client UI</text>
  <defs><marker id='svgarrth1' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'><path d='M0,0 L6,3 L0,6 Z' fill='#8a8073'/></marker></defs>
</svg>
<div class='diagram-cap'>Extended Thinking Architecture: Internal thinking block is generated first, followed by the user-facing text block.</div>
</div>`;

// CCAO-F
const ccaoMasterclass = {
  'ccaol-knowledge-management': {
    marker: 'VISION_AND_PROJECTS_MC',
    html: `
<h4>Vision, Chart Analysis & Multi-Modal Processing</h4>
<p>Claude processes images and PDF documents directly. When analyzing complex charts, infographics, or scans:</p>
${svgVisionToken}
<ul>
  <li><b>Image Token Calculation:</b> Token count equals <code>(Width × Height) / 750</code>. An image of 1024×768 pixels costs approximately 1,048 tokens.</li>
  <li><b>Resolution Limits:</b> Images with dimensions exceeding 1568px are automatically scaled down while preserving aspect ratio.</li>
  <li><b>Visual Prompting Best Practice:</b> Ask Claude to transcribe key numbers and data points from the image into a table <i>before</i> asking for analysis. This forces visual attention on exact figures.</li>
</ul>
<div class='scenario-box'>
<div class='lbl'>Real-World Case Study — Financial Chart Extraction</div>
<p><b>Task:</b> Extracting quarterly revenue bars from a scanned earnings presentation.</p>
<p><b>Prompt Pattern:</b> <i>"&lt;instructions&gt;First, extract the numerical value and label for every bar in the Q3 chart into a markdown table. Second, compute the quarter-over-quarter percentage growth.&lt;/instructions&gt;"</i></p>
</div>`
  },
  'ccaol-governance-risk': {
    marker: 'ENTERPRISE_GOVERNANCE_MC',
    html: `
<h4>Anthropic Responsible Scaling Policy (RSP) & Safety Levels</h4>
<p>Anthropic structures model risk mitigation through <b>AI Safety Levels (ASL)</b>:</p>
<table style='width:100%; font-size:12.5px; border-collapse:collapse; margin:12px 0;'>
  <thead>
    <tr style='background:var(--card); border-bottom:2px solid var(--border);'>
      <th style='padding:8px; text-align:left;'>Safety Level</th>
      <th style='padding:8px; text-align:left;'>Definition</th>
      <th style='padding:8px; text-align:left;'>Enterprise Significance</th>
    </tr>
  </thead>
  <tbody>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>ASL-1</b></td>
      <td style='padding:8px;'>Baseline LLMs without catastrophic misuse risks.</td>
      <td style='padding:8px;'>Standard consumer & enterprise applications.</td>
    </tr>
    <tr style='border-bottom:1px solid var(--border);'>
      <td style='padding:8px;'><b>ASL-2</b></td>
      <td style='padding:8px;'>Models showing early CBRN / cyber capabilities. Requires automated safety classifiers.</td>
      <td style='padding:8px;'>Current generation frontier models (Claude 3 / 3.5 / 3.7).</td>
    </tr>
    <tr>
      <td style='padding:8px;'><b>ASL-3 & ASL-4</b></td>
      <td style='padding:8px;'>Autonomous replication or extreme weaponization risks. Requires hardware air-gapping and multi-party sign-offs.</td>
      <td style='padding:8px;'>Future frontier safety thresholds.</td>
    </tr>
  </tbody>
</table>`
  }
};

// CCDV-F
const ccdvMasterclass = {
  'ccdvl-api-mechanics': {
    marker: 'EXTENDED_THINKING_MC',
    html: `
<h4>Extended Thinking / Adaptive Reasoning Mode</h4>
<p>Current Claude models support <b>Extended Thinking</b>, allowing the model to perform deep internal step-by-step reasoning before generating a response:</p>
${svgThinkingTrace}
<pre>response = client.messages.create(
    model="claude-3-7-sonnet-20250219",
    max_tokens=8192,
    thinking={
        "type": "enabled",
        "budget_tokens": 2048  # Minimum 1024 tokens
    },
    messages=[{"role": "user", "content": "Prove that the square root of 2 is irrational."}]
)</pre>
<div class='widget-box' data-widget='thinking-simulator'></div>
<div class='exambox'>
<div class='lbl'>🎯 Exam Tip — Extended Thinking Rules</div>
<ol>
  <li><code>max_tokens</code> must be <b>strictly greater</b> than <code>budget_tokens</code> (the difference is the token budget available for the final response).</li>
  <li>Thinking blocks contain an encrypted signature token from Anthropic. In multi-turn conversations, you <b>must pass the thinking block back unaltered</b> in assistant message turns.</li>
</ol>
</div>`
  },
  'ccdvl-agents-sdk': {
    marker: 'COMPUTER_USE_MC',
    html: `
<h4>Computer Use & Anthropic Tool Betas</h4>
<p>Anthropic models can directly interact with desktop environments via Computer Use tools:</p>
<ul>
  <li><code>computer_20241022</code> — Takes screenshots and performs mouse/keyboard actions (click, type, mouse_move).</li>
  <li><code>bash_20241022</code> — Executes shell commands within a sandboxed Linux environment.</li>
  <li><code>text_editor_20241022</code> — Opens, edits (str_replace), and inspects local files.</li>
</ul>
<div class='widget-box' data-widget='computer-use'></div>
<div class='exambox'>
<div class='lbl'>🎯 Exam Tip — Computer Use Resolution Scaling</div>
<p>To optimize latency and token cost, screenshots sent to <code>computer_20241022</code> should be scaled to standard aspect ratios (e.g. <b>1024×768 XGA</b> or <b>1280×800 WXGA</b>), rather than raw 4K resolutions!</p>
</div>`
  },
  'ccdvl-mcp': {
    marker: 'MCP_INSPECTOR_MC',
    html: `
<h4>Complete MCP JSON-RPC 2.0 Protocol Breakdown</h4>
<p>MCP communication runs over standard JSON-RPC 2.0 over <b>stdio</b> (standard input/output for local processes) or <b>SSE</b> (Server-Sent Events over HTTP for remote servers):</p>
<div class='widget-box' data-widget='mcp-inspector'></div>`
  }
};

// CCAR-F
const ccafMasterclass = {
  'ccafl-system-design-architecture': {
    marker: 'CLAUDE_CODE_MC',
    html: `
<h4>Claude Code Architecture & Repository Workflows</h4>
<p>Claude Code is an agentic coding tool built on the Agent SDK. It leverages several key architectural conventions:</p>
<ul>
  <li><b><code>CLAUDE.md</code> Guide:</b> A standardized repository instruction file placed in project root containing build commands, lint rules, testing guidelines, and architectural patterns.</li>
  <li><b>Multi-Tier Repository Indexing:</b> Combines local file globbing, ripgrep regex searching, and symbol graph extraction to inspect large codebases without loading all files into context.</li>
  <li><b>Non-Interactive CI/CD Mode:</b> <code>claude -p "prompt"</code> allows headless execution in GitHub Actions / GitLab CI for automated PR reviews, migration scripts, and test generation.</li>
</ul>`
  }
};

// CCAR-P
const ccapMasterclass = {
  'ccapl-security-governance-production': {
    marker: 'MULTI_TENANT_GOV_MC',
    html: `
<h4>Multi-Tenant Billing Attribution & Tenant Isolation</h4>
<p>In enterprise multi-tenant systems, prevent cross-tenant noisy neighbor problems and track department costs using request metadata:</p>
<pre>response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    metadata={
        "user_id": "usr_839210",
        "tenant_id": "dept_marketing_q3"  # Tracked in Anthropic Console billing reports
    },
    messages=messages
)</pre>
<div class='exambox'>
<div class='lbl'>🎯 Exam Tip — Zero-Trust Sandboxing</div>
<p>When running agentic code execution in production, always execute untrusted code in hardened, ephemeral sandboxes (e.g. <b>gVisor or Firecracker microVMs</b>) with strict network egress controls rather than bare host processes.</p>
</div>`
  }
};

injectCurriculum('ccao', ccaoMasterclass);
injectCurriculum('ccdv', ccdvMasterclass);
injectCurriculum('ccaf', ccafMasterclass);
injectCurriculum('ccap', ccapMasterclass);
