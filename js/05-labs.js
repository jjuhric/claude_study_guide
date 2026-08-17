/* 05-labs.js
   Simulators, studios, workbenches
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= PROMPT CACHING SIMULATOR ================= */
function renderPromptCachingSimulator(container){
  container.innerHTML = `
    <h5>⚡ Interactive Prompt Caching & TTL Economics Simulator</h5>
    <p style="font-size:12px; color:var(--muted); margin-bottom:10px;">Simulate cache breakpoints, 5-minute TTL decay, and exact dollar savings across Claude models:</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
      <div>
        <label><b>Model Tier:</b></label>
        <select id="wCacheModel" onchange="calcCacheSim()" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:12.5px;">
          <option value="sonnet" selected>Claude Sonnet 5 ($3.00 base / $0.30 cached)</option>
          <option value="haiku">Claude Haiku 4.5 ($0.80 base / $0.08 cached)</option>
          <option value="opus">Claude Opus 5 ($15.00 base / $1.50 cached)</option>
        </select>
      </div>
      <div>
        <label><b>Static Prefix Size:</b> <span id="wCachePrefixVal">2,500 tokens</span></label>
        <input type="range" id="wCachePrefix" min="500" max="10000" step="500" value="2500" oninput="calcCacheSim()">
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
      <div>
        <label><b>Multi-Turn Requests / 5-min Window:</b> <span id="wCacheReqVal">10 requests</span></label>
        <input type="range" id="wCacheReq" min="1" max="50" step="1" value="10" oninput="calcCacheSim()">
      </div>
      <div>
        <label><b>Dynamic Turn Tokens:</b> <span id="wCacheDynVal">300 tokens</span></label>
        <input type="range" id="wCacheDyn" min="100" max="2000" step="100" value="300" oninput="calcCacheSim()">
      </div>
    </div>
    <div id="wCacheResult" style="font-size:13px; line-height:1.5;"></div>
  `;
  calcCacheSim();
}

function calcCacheSim(){
  const model = document.getElementById("wCacheModel")?.value || "sonnet";
  const prefix = parseInt(document.getElementById("wCachePrefix")?.value || 2500, 10);
  const reqs = parseInt(document.getElementById("wCacheReq")?.value || 10, 10);
  const dyn = parseInt(document.getElementById("wCacheDyn")?.value || 300, 10);
  
  const prefEl = document.getElementById("wCachePrefixVal");
  const reqEl = document.getElementById("wCacheReqVal");
  const dynEl = document.getElementById("wCacheDynVal");
  if (prefEl) prefEl.textContent = prefix.toLocaleString() + " tokens";
  if (reqEl) reqEl.textContent = reqs + " requests";
  if (dynEl) dynEl.textContent = dyn.toLocaleString() + " tokens";
  
  const minTokens = (model === "haiku") ? 2048 : 1024;
  const isCacheable = prefix >= minTokens;
  
  const baseRate = (model === "haiku") ? 0.80 : (model === "sonnet") ? 3.00 : 15.00;
  const writeRate = baseRate * 1.25;
  const readRate = baseRate * 0.15; // 85% discount
  
  // Cost WITHOUT caching
  const rawTotalTokens = reqs * (prefix + dyn);
  const rawCost = (rawTotalTokens / 1000000) * baseRate;
  
  // Cost WITH caching
  let cachedCost = 0;
  if (isCacheable) {
    const writeCost = (prefix / 1000000) * writeRate;
    const readCost = ((reqs - 1) * prefix / 1000000) * readRate;
    const dynCost = (reqs * dyn / 1000000) * baseRate;
    cachedCost = writeCost + readCost + dynCost;
  } else {
    cachedCost = rawCost;
  }
  
  const savingsPct = rawCost > 0 ? Math.round(((rawCost - cachedCost) / rawCost) * 100) : 0;
  const savedDollars = (rawCost - cachedCost).toFixed(4);
  
  const res = document.getElementById("wCacheResult");
  if (!res) return;
  
  if (!isCacheable) {
    res.innerHTML = `
      <div style="background:rgba(217,119,87,0.12); border:1px solid var(--coral); border-radius:8px; padding:12px;">
        <b style="color:var(--coral);">⚠️ Cache Miss: Below Minimum Token Threshold</b><br>
        <span style="font-size:12px; color:var(--ink);">
          Prefix is ${prefix.toLocaleString()} tokens, but <b>${model.toUpperCase()}</b> requires at least <b>${minTokens.toLocaleString()} tokens</b> to activate prompt caching. Increase prefix size to enable 85% savings.
        </span>
      </div>
    `;
  } else {
    res.innerHTML = `
      <div style="background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:13px; font-weight:700; color:var(--green);">⚡ Prompt Caching Active (${savingsPct}% Cost Reduction)</span>
          <span style="font-size:11px; color:var(--muted);">5-min TTL Refreshes on Hit</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px; margin-bottom:8px;">
          <div style="border:1px solid var(--border); border-radius:6px; padding:8px; background:var(--card);">
            <div style="color:var(--muted); font-size:11px;">Without Caching:</div>
            <div style="font-size:16px; font-weight:800; color:var(--coral);">${rawCost.toFixed(4)}</div>
          </div>
          <div style="border:1px solid var(--border); border-radius:6px; padding:8px; background:var(--card);">
            <div style="color:var(--muted); font-size:11px;">With Prompt Caching:</div>
            <div style="font-size:16px; font-weight:800; color:var(--green);">${cachedCost.toFixed(4)} <span style="font-size:11px;">(Save ${savedDollars})</span></div>
          </div>
        </div>
        <div style="font-size:11.5px; color:var(--muted); line-height:1.4;">
          💡 <b>Exam Fact:</b> Cache writes cost 1.25x base on first turn, but subsequent turns save 85% ($0.15x base). Every cache read automatically refreshes the 5-minute TTL window.
        </div>
      </div>
    `;
  }
}

/* ================= MULTI-AGENT DAG SIMULATOR ================= */
function renderMultiAgentDagSimulator(container){
  container.innerHTML = `
    <h5>👑 Interactive Multi-Agent DAG & Blackboard Orchestrator</h5>
    <p style="font-size:12px; color:var(--muted); margin-bottom:10px;">Step through an enterprise DAG execution cycle with centralized JSON Blackboard state sync:</p>
    <div style="display:flex; gap:6px; margin-bottom:10px;">
      <button class="btn sm" onclick="stepDagSim()">▶️ Step Next Agent</button>
      <button class="btn ghost sm" onclick="resetDagSim()">↺ Reset Workflow</button>
    </div>
    <div id="wDagVisual" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:10px;"></div>
    <div style="font-size:12px; font-weight:700; margin-bottom:4px;">Centralized Typed Blackboard State (Redis / JSON):</div>
    <pre id="wDagBlackboard" style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px; font-size:11.5px; font-family:'SF Mono',Consolas,monospace; max-height:140px; overflow-y:auto;"></pre>
  `;
  resetDagSim();
}

let dagStep = 0;
const dagAgents = [
  { name: "1. Orchestrator", role: "Goal Decomposition", status: "WAITING" },
  { name: "2. Research Worker", role: "Parallel RAG Fetch", status: "WAITING" },
  { name: "3. Synthesis Worker", role: "Code Generation", status: "WAITING" },
  { name: "4. Compliance Auditor", role: "Zero-Trust Review", status: "WAITING" }
];

function resetDagSim(){
  dagStep = 0;
  dagAgents.forEach(a => a.status = "WAITING");
  renderDagUi({
    workflow_id: "wf_94821",
    status: "INITIALIZING",
    task: "Generate HIPAA-compliant Patient API Endpoint",
    state: {}
  });
}

function stepDagSim(){
  dagStep++;
  let state = {};
  if (dagStep === 1) {
    dagAgents[0].status = "RUNNING";
    state = { plan: ["Fetch EHR Schema", "Generate Fastify Route", "Audit PII Scrubbing"] };
  } else if (dagStep === 2) {
    dagAgents[0].status = "DONE";
    dagAgents[1].status = "RUNNING";
    state = { plan: ["Fetch EHR Schema", "Generate Fastify Route", "Audit PII Scrubbing"], rbac_rules: ["Role: DOCTOR", "Encrypted: AES-256"] };
  } else if (dagStep === 3) {
    dagAgents[1].status = "DONE";
    dagAgents[2].status = "RUNNING";
    state = { rbac_rules: ["Role: DOCTOR"], code_artifact: "export const patientRoute = ..." };
  } else if (dagStep === 4) {
    dagAgents[2].status = "DONE";
    dagAgents[3].status = "RUNNING";
    state = { code_artifact: "export const patientRoute = ...", audit_result: "PASSED: Zero PII Leakage" };
  } else {
    dagAgents[3].status = "DONE";
    state = { status: "COMPLETED", duration_ms: 1840, token_spend_dollars: 0.042 };
  }
  renderDagUi({
    workflow_id: "wf_94821",
    step: dagStep,
    agents_active: dagAgents.filter(a => a.status === "RUNNING").map(a => a.name),
    blackboard: state
  });
}

function renderDagUi(bbData){
  const vis = document.getElementById("wDagVisual");
  const bb = document.getElementById("wDagBlackboard");
  if (vis) {
    vis.innerHTML = dagAgents.map(a => `
      <div style="border:2px solid ${a.status === 'RUNNING' ? 'var(--blue)' : a.status === 'DONE' ? 'var(--green)' : 'var(--border)'}; background:var(--bg); border-radius:8px; padding:8px; text-align:center;">
        <div style="font-size:11.5px; font-weight:700;">${a.name}</div>
        <div style="font-size:10px; color:var(--muted); margin:2px 0 4px;">${a.role}</div>
        <span style="font-size:9.5px; font-weight:800; padding:2px 4px; border-radius:4px; color:#fff; background:${a.status === 'RUNNING' ? 'var(--blue)' : a.status === 'DONE' ? 'var(--green)' : 'var(--muted)'};">${a.status}</span>
      </div>
    `).join('');
  }
  if (bb) {
    bb.textContent = JSON.stringify(bbData, null, 2);
  }
}

/* ================= 1. ARCHITECT WAR ROOM (ENTERPRISE SCENARIOS) ================= */
const WAR_ROOM_SCENARIOS = [
  {
    id: "sc_health",
    name: "🏥 Healthcare Patient Triage & Diagnostics Agent",
    prompt: "A hospital network needs an AI assistant to triage incoming emergency symptoms, cross-reference medical EHR history, and draft clinician notes for 80,000 queries/day. Strict HIPAA compliance and sub-second triage routing required.",
    constraints: { max_budget_monthly: 2000, max_latency_ms: 1200, compliance: "HIPAA / ZDR" },
    options: {
      model: [
        { id: "haiku_router", label: "Haiku Router + Specialist Sonnet", cost: 420, lat: 680, comp: 95, correct: true, note: "Optimal architecture: Fast Haiku classifier dispatches simple cases; Sonnet handles clinical synthesis." },
        { id: "opus_direct", label: "Opus Direct for All Inquiries", cost: 6200, lat: 3800, comp: 80, correct: false, note: "Severe budget overrun ($6,200/mo > $2,000 cap) and high latency." },
        { id: "sonnet_raw", label: "Sonnet Direct for Everything", cost: 2100, lat: 1400, comp: 90, correct: false, note: "Slightly over budget without router filtering simple questions." }
      ],
      context: [
        { id: "hybrid_rag_cache", label: "Prompt Caching on Medical Guidelines + Hybrid RAG for EHR", cost: -150, lat: -200, comp: 98, correct: true, note: "85% savings on static hospital guidelines with precise BM25 lookup for ICD-10 error codes." },
        { id: "dump_full_ehr", label: "Dump Entire 50-Page Patient History into Prompt Context", cost: 900, lat: 1200, comp: 60, correct: false, note: "Wastes context window and risks context amnesia." }
      ],
      security: [
        { id: "gvisor_zdr", label: "gVisor MicroVM + Client-side PII Masking + Commercial API ZDR", comp: 100, correct: true, note: "Zero Data Retention terms guaranteed with kernel-level microVM isolation." },
        { id: "consumer_chat", label: "Consumer API Webhook with Disclaimer", comp: 15, correct: false, note: "Catastrophic HIPAA breach: Consumer endpoints are not covered by Enterprise BAAs." }
      ],
      resilience: [
        { id: "breaker_jitter", label: "Circuit Breaker on EHR Database + Jittered Exponential Backoff", comp: 95, correct: true, note: "Prevents thundering herd retries and isolates hospital database outages." },
        { id: "infinite_retry", label: "Tight While-Loop Retry on 500 Errors", comp: 30, correct: false, note: "Anti-pattern: Crashes thread pool during hospital database maintenance." }
      ]
    }
  },
  {
    id: "sc_fintech",
    name: "💳 Real-Time Payment Fraud Interceptor",
    prompt: "An international fintech handles 500 transactions/sec. The agent must inspect transaction metadata, detect velocity anomalies, and authorize or freeze credit card holds under 300ms SLA.",
    constraints: { max_budget_monthly: 1500, max_latency_ms: 350, compliance: "PCI-DSS / Idempotency" },
    options: {
      model: [
        { id: "haiku_stream", label: "Claude Haiku 4.5 Streaming", cost: 380, lat: 180, comp: 98, correct: true, note: "Haiku delivers sub-200ms latency necessary for payment gateway SLAs." },
        { id: "sonnet_sync", label: "Claude Sonnet 5 Synchronous", cost: 1800, lat: 850, comp: 90, correct: false, note: "Violates 350ms payment gateway timeout." }
      ],
      context: [
        { id: "redis_blackboard", label: "Redis State Snapshot with Typed Velocity Features", cost: 50, lat: 20, comp: 95, correct: true, note: "Sub-millisecond state access without parsing conversational history." },
        { id: "chat_history", label: "Pass Last 20 Transactions as Markdown Chat Transcript", cost: 400, lat: 250, comp: 50, correct: false, note: "High latency and parsing ambiguity." }
      ],
      security: [
        { id: "idempotent_gate", label: "Idempotency UUIDs on Mutation Tools + Human Review for >$5,000", comp: 100, correct: true, note: "Prevents double-charging on network dropouts." },
        { id: "auto_charge", label: "Direct Autonomous Refund Execution without Idempotency Keys", comp: 40, correct: false, note: "Risk of duplicate charges during network timeouts." }
      ],
      resilience: [
        { id: "graceful_fallback", label: "Haiku -> Rule-Based Fallback Engine if LLM times out", comp: 100, correct: true, note: "Ensures 100% payment uptime with graceful degradation." },
        { id: "fail_closed_hang", label: "Hold Customer Transaction Indefinitely on Timeout", comp: 20, correct: false, note: "Terrible customer experience; breaches card network SLA." }
      ]
    }
  }
];

let warRoomState = { scenarioIdx: 0, picks: { model: null, context: null, security: null, resilience: null } };

function warRoomView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  const sc = WAR_ROOM_SCENARIOS[warRoomState.scenarioIdx];
  const picks = warRoomState.picks;
  
  const hasAllPicks = picks.model !== null && picks.context !== null && picks.security !== null && picks.resilience !== null;
  
  const mOpt = picks.model !== null ? sc.options.model[picks.model] : null;
  const cOpt = picks.context !== null ? sc.options.context[picks.context] : null;
  const sOpt = picks.security !== null ? sc.options.security[picks.security] : null;
  const rOpt = picks.resilience !== null ? sc.options.resilience[picks.resilience] : null;
  
  const totalCost = (mOpt ? mOpt.cost : 0) + (cOpt ? (cOpt.cost || 0) : 0);
  const totalLat = (mOpt ? mOpt.lat : 0) + (cOpt ? (cOpt.lat || 0) : 0);
  const compScore = hasAllPicks ? Math.round((mOpt.comp + cOpt.comp + sOpt.comp + rOpt.comp) / 4) : 0;
  const isBudgetOk = totalCost <= sc.constraints.max_budget_monthly;
  const isLatOk = totalLat <= sc.constraints.max_latency_ms;
  const allCorrect = hasAllPicks && mOpt.correct && cOpt.correct && sOpt.correct && rOpt.correct;
  
  function renderGroup(key, title, icon){
    let items = '';
    sc.options[key].forEach((opt, idx) => {
      const isSel = picks[key] === idx;
      items += '<div class="tree-opt' + (isSel ? ' active' : '') + '" style="margin:0; text-align:left;" onclick="setWarRoomPick(\''+key+'\','+idx+')">'
        + '<b>' + opt.label + '</b>'
        + (isSel ? '<div style="font-size:11.5px; color:var(--ink); margin-top:4px; font-weight:normal;">' + opt.note + '</div>' : '')
        + '</div>';
    });
    return '<div style="margin-bottom:14px;">'
      + '<label style="font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:6px; margin-bottom:6px;">' + icon + ' ' + title + '</label>'
      + '<div style="display:flex; flex-direction:column; gap:6px;">' + items + '</div></div>';
  }

  let h = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Enterprise Challenge</span><h2 style="font-size:20px; margin-top:4px;">🏛️ Architect War Room</h2></div>'
    + '<select onchange="setWarRoomScenario(this.value)" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;">'
    + WAR_ROOM_SCENARIOS.map((s, idx) => '<option value="'+idx+'"'+(idx===warRoomState.scenarioIdx?' selected':'')+'>'+s.name+'</option>').join('')
    + '</select>'
    + '</div>'
    + '<p style="font-size:13px; line-height:1.5; margin:10px 0 16px; color:var(--muted); background:var(--bg); padding:10px 12px; border-radius:8px; border:1px solid var(--border);">'
    + '<b>Target Mission:</b> ' + sc.prompt
    + '<br><span style="font-size:11.5px; color:var(--coral-dark);">🎯 Constraints: Max Budget: $' + sc.constraints.max_budget_monthly + '/mo · Max Latency: ' + sc.constraints.max_latency_ms + 'ms · Compliance: ' + sc.constraints.compliance + '</span>'
    + '</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">'
    + '<div>'
    + renderGroup('model', '1. Model Selection & Routing Tier', '🧠')
    + renderGroup('context', '2. Context & Retrieval Engineering', '📚')
    + renderGroup('security', '3. Zero-Trust Sandboxing & Privacy', '🔒')
    + renderGroup('resilience', '4. Resilience & Fallback Cascades', '⚡')
    + '</div>'
    + '<div>'
    + '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); position:sticky; top:16px;">'
    + '<h4 style="font-size:14px; margin-bottom:12px; color:var(--coral-dark);">📊 Live Architecture Scorecard</h4>'
    + (!hasAllPicks
        ? '<div style="padding:18px 12px; text-align:center; background:var(--bg); border:1px dashed var(--border); border-radius:8px; font-size:12.5px; color:var(--muted); line-height:1.5;">'
          + '👈 <b>Awaiting Selections:</b> Choose your architectural choices in all 4 categories to simulate latency, monthly budget, and compliance scores.'
          + '</div>'
        : ('<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">'
          + '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; text-align:center;">'
          + '<div style="font-size:18px; font-weight:800; color:'+(isBudgetOk?'var(--green)':'var(--coral)')+';">$'+totalCost+'/mo</div>'
          + '<div style="font-size:11px; color:var(--muted);">Estimated Token Spend</div>'
          + '</div>'
          + '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; text-align:center;">'
          + '<div style="font-size:18px; font-weight:800; color:'+(isLatOk?'var(--green)':'var(--coral)')+';">'+totalLat+' ms</div>'
          + '<div style="font-size:11px; color:var(--muted);">P99 Clock Latency</div>'
          + '</div>'
          + '</div>'
          + '<div style="margin-bottom:10px;">'
          + '<div style="display:flex; justify-content:space-between; font-size:12px; font-weight:700; margin-bottom:4px;"><span>Security & Compliance Score:</span><span>'+compScore+'%</span></div>'
          + '<div class="pbar" style="height:8px;"><div style="width:'+compScore+'%; background:'+(compScore>=90?'var(--green)':compScore>=70?'var(--blue)':'var(--coral)')+';"></div></div>'
          + '</div>'
          + '<div style="margin-top:14px; padding:12px; border-radius:8px; background:'+(allCorrect?'rgba(90,158,111,0.12)':'rgba(217,119,87,0.12)')+'; border:1px solid '+(allCorrect?'var(--green)':'var(--coral)')+';">'
          + '<div style="font-size:13px; font-weight:800; color:'+(allCorrect?'var(--green)':'var(--coral)')+'; margin-bottom:4px;">'
          + (allCorrect ? '🎉 Production-Ready Architecture Approved!' : '⚠️ Architectural Flaws Detected')
          + '</div>'
          + '<div style="font-size:12px; line-height:1.4; color:var(--ink);">'
          + (allCorrect
              ? 'Your system satisfies all SLAs, operates under budget, and enforces zero-trust safety guardrails.'
              : 'Refine your component selections to satisfy budget ceilings, latency bounds, and compliance standards.')
          + '</div>'
          + '</div>'
          + (allCorrect ? '<div style="margin-top:12px; text-align:center;"><button class="btn sm" onclick="award(\'war_room\'); addXP(30,\'War Room cleared\'); toast(\'🏅 War Room Master badge earned!\');">Claim Architect XP (+30 XP) 🏆</button></div>' : '')))
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
  $("app").innerHTML = h;
}

function setWarRoomScenario(idx){
  warRoomState.scenarioIdx = parseInt(idx, 10);
  warRoomState.picks = { model: null, context: null, security: null, resilience: null };
  warRoomView();
}
function setWarRoomPick(key, val){
  warRoomState.picks[key] = val;
  warRoomView();
}

/* ================= 2. STUDY PLAN GENERATOR & COUNTDOWN ================= */
function studyPlanView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  const plan = S.studyPlan;
  
  let content = '';
  if (!plan || !Array.isArray(plan.schedule)) {
    content = '<div class="panel center">'
      + '<div style="font-size:38px;">⏱️</div>'
      + '<h2 style="font-size:20px; margin-top:8px;">Generate Your Personalized Study Roadmap</h2>'
      + '<p class="subtext" style="margin-top:6px;">Select your target certification and timeline to create an adaptive daily curriculum.</p>'
      + '<div style="max-width:380px; margin:20px auto; text-align:left;">'
      + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Target Certification:</label>'
      + '<select id="spCert" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:14px;">'
      + CERTS.map(c => '<option value="'+c.id+'">'+c.code+' — '+c.name+'</option>').join('')
      + '</select>'
      + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Target Exam Timeline:</label>'
      + '<select id="spDays" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:18px;">'
      + '<option value="7">⚡ 7-Day Sprint (Intensive · 60m/day)</option>'
      + '<option value="14" selected>🎯 14-Day Balanced Track (Recommended · 30m/day)</option>'
      + '<option value="30">📅 30-Day Mastery Track (Thorough · 15m/day)</option>'
      + '</select>'
      + '<button class="btn" style="width:100%;" onclick="createStudyPlan()">Generate My Custom Plan 🚀</button>'
      + '</div>'
      + '</div>';
  } else {
    const c = CERTS.find(x => x.id === plan.certId) || CERTS[0];
    const target = new Date(plan.targetDate);
    const now = new Date();
    const diffDays = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
    
    let daysHtml = '';
    plan.schedule.forEach((day, idx) => {
      const isDone = plan.completedDays && plan.completedDays.includes(idx);
      daysHtml += '<div style="border:1px solid '+(isDone?'var(--green)':'var(--border)')+'; background:var(--card); border-radius:10px; padding:12px; margin-bottom:10px;">'
        + '<div style="display:flex; justify-content:space-between; align-items:center;">'
        + '<b>Day ' + (idx + 1) + ': ' + day.title + '</b>'
        + '<button class="btn sm '+(isDone?'ghost':'')+'" onclick="togglePlanDay('+idx+')">' + (isDone ? '✓ Completed' : 'Mark Done') + '</button>'
        + '</div>'
        + '<ul style="margin:8px 0 0; padding-left:18px; font-size:12.5px; color:var(--muted); line-height:1.5;">'
        + day.tasks.map(t => '<li>' + t + '</li>').join('')
        + '</ul>'
        + '</div>';
    });

    content = '<div class="panel">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">'
      + '<div><span class="ltag" style="background:'+c.color+'; color:#fff;">Target: '+c.code+'</span><h2 style="font-size:20px; margin-top:4px;">⏱️ Your '+plan.totalDays+'-Day Study Roadmap</h2></div>'
      + '<div style="text-align:right;"><span style="font-size:24px; font-weight:800; color:var(--coral);">' + diffDays + ' Days Left</span><br><button class="btn ghost sm" onclick="resetStudyPlan()">↺ Change Target Date</button></div>'
      + '</div>'
      + daysHtml
      + '</div>';
  }

  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>' + content;
}

function createStudyPlan(){
  const certId = document.getElementById("spCert") ? document.getElementById("spCert").value : "ccao";
  const days = parseInt(document.getElementById("spDays") ? document.getElementById("spDays").value : "14", 10);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  const schedule = [];
  for (let i = 0; i < days; i++) {
    if (i === 0) schedule.push({ title: "Foundations & Orientation", tasks: ["Read Lesson 0 (Foundations)", "Review 15 Spaced Repetition Flashcards", "Take initial Quiz Battle"] });
    else if (i === days - 1) schedule.push({ title: "Final Readiness & Mock Simulation", tasks: ["Read Cram Sheet (All 8 Modules)", "Sit Full Timed Mock Exam (Target >= 720)", "Review any remaining misses"] });
    else if (i === Math.floor(days / 2)) schedule.push({ title: "Mid-Point Diagnostic", tasks: ["Take 20-Question Mid-Point Mock Exam", "Drill weakest identified domain", "Review due flashcards"] });
    else schedule.push({ title: "Domain Deep Dive " + i, tasks: ["Read Domain Lesson " + ((i % 8) + 1), "Drill 10 domain questions", "Flip 15 flashcards in Leitner queue"] });
  }
  
  S.studyPlan = { certId, totalDays: days, created: new Date().toISOString(), targetDate: targetDate.toISOString(), schedule, completedDays: [] };
  save();
  toast("✨ Custom " + days + "-day roadmap generated!");
  studyPlanView();
}

function togglePlanDay(idx){
  if (!S.studyPlan) return;
  S.studyPlan.completedDays = S.studyPlan.completedDays || [];
  const at = S.studyPlan.completedDays.indexOf(idx);
  if (at >= 0) S.studyPlan.completedDays.splice(at, 1);
  else { S.studyPlan.completedDays.push(idx); addXP(15, "Daily study goal reached"); }
  save();
  studyPlanView();
}

function resetStudyPlan(){
  if (confirm("Reset current study plan?")) {
    S.studyPlan = null;
    save();
    studyPlanView();
  }
}

/* ================= 3. GLOBAL QUESTION BANK EXPLORER ================= */
let explorerFilterCert = "all";
let explorerFilterStatus = "all";
let explorerQuery = "";

function questionExplorerView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  let allQs = [];
  CERTS.forEach(c => {
    if (c._loaded && c.questions) {
      c.questions.forEach((q, idx) => {
        allQs.push({ q, certId: c.id, certCode: c.code, certColor: c.color, domainName: c.domains[q.d] || "Domain", idx });
      });
    }
  });

  if (!allQs.length) {
    loadCert(CERTS[0]).then(() => questionExplorerView());
    return;
  }

  const qStr = (explorerQuery || '').toLowerCase().trim();
  const filtered = allQs.filter(item => {
    if (explorerFilterCert !== "all" && item.certId !== explorerFilterCert) return false;
    const ans = (S.answered[item.certId] || {})[qKey(CERTS.find(x => x.id === item.certId), item.idx)];
    if (explorerFilterStatus === "unseen" && ans !== undefined) return false;
    if (explorerFilterStatus === "correct" && ans !== true) return false;
    if (explorerFilterStatus === "missed" && ans !== false) return false;
    if (qStr) {
      const matchQ = (item.q.q || '').toLowerCase().includes(qStr);
      const matchExp = (item.q.exp || '').toLowerCase().includes(qStr);
      const matchOpts = (item.q.opts || []).some(o => o.toLowerCase().includes(qStr));
      if (!matchQ && !matchExp && !matchOpts) return false;
    }
    return true;
  });

  let cardsHtml = '';
  filtered.slice(0, 30).forEach((item) => {
    const q = item.q;
    const ans = (S.answered[item.certId] || {})[qKey(CERTS.find(x => x.id === item.certId), item.idx)];
    const statusPill = ans === true ? '<span style="color:var(--green); font-weight:700;">✓ Mastered</span>' : ans === false ? '<span style="color:var(--coral); font-weight:700;">✗ Missed</span>' : '<span style="color:var(--muted);">Unseen</span>';
    
    cardsHtml += '<div style="border:1px solid var(--border); background:var(--card); border-radius:10px; padding:14px; margin-bottom:10px;">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:11.5px;">'
      + '<span><b style="color:'+item.certColor+';">'+item.certCode+'</b> · '+item.domainName+'</span>'
      + '<span>' + statusPill + '</span>'
      + '</div>'
      + '<div style="font-size:13.5px; font-weight:700; margin-bottom:8px;">' + esc(q.q) + '</div>'
      + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px; margin-bottom:8px;">'
      + q.opts.map((o, optIdx) => '<div style="padding:6px 8px; border-radius:6px; background:'+(optIdx===q.a?'rgba(90,158,111,0.15); font-weight:700; border:1px solid var(--green)':'var(--bg)')+';">' + (optIdx+1) + '. ' + esc(o) + (optIdx===q.a?' ✓':'') + '</div>').join('')
      + '</div>'
      + '<div style="font-size:11.5px; color:var(--muted); background:var(--bg); padding:6px 8px; border-radius:6px;">💡 <b>Explanation:</b> ' + esc(q.exp) + '</div>'
      + '</div>';
  });

  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><h2 style="font-size:20px;">🔍 Global Question Bank Explorer</h2><p style="font-size:12.5px; color:var(--muted);">Search and review all 400 questions with complete per-option explanations.</p></div>'
    + '<div style="font-weight:700; font-size:13px; color:var(--coral);">' + filtered.length + ' matching questions</div>'
    + '</div>'
    + '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">'
    + '<input type="text" placeholder="🔍 Search keyword (e.g. isError, HyDE, gVisor, 429, TTL)..." value="'+esc(explorerQuery)+'" oninput="explorerQuery=this.value; questionExplorerView();" style="flex:1; min-width:240px; padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;" />'
    + '<select onchange="explorerFilterCert=this.value; questionExplorerView();" style="padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;">'
    + '<option value="all"'+(explorerFilterCert==='all'?' selected':'')+'>All Tracks</option>'
    + CERTS.map(c => '<option value="'+c.id+'"'+(explorerFilterCert===c.id?' selected':'')+'>'+c.code+'</option>').join('')
    + '</select>'
    + '<select onchange="explorerFilterStatus=this.value; questionExplorerView();" style="padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;">'
    + '<option value="all"'+(explorerFilterStatus==='all'?' selected':'')+'>All Statuses</option>'
    + '<option value="unseen"'+(explorerFilterStatus==='unseen'?' selected':'')+'>Unseen</option>'
    + '<option value="correct"'+(explorerFilterStatus==='correct'?' selected':'')+'>Mastered</option>'
    + '<option value="missed"'+(explorerFilterStatus==='missed'?' selected':'')+'>Missed</option>'
    + '</select>'
    + '</div>'
    + cardsHtml
    + (filtered.length > 30 ? '<div style="text-align:center; font-size:12px; color:var(--muted); margin:10px 0;">Showing first 30 of ' + filtered.length + ' questions. Narrow search above for more specific results.</div>' : '')
    + '</div>';
}

/* ================= 4. SUDDEN-DEATH EXAM SPEED RUN ================= */
let speedRunState = { cert: null, questions: [], idx: 0, streak: 0, timeLeft: 30, timer: null, score: 0 };

function speedRunSelect(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">⚡</div>'
    + '<h2 style="font-size:20px; margin-top:8px;">⚡ Sudden-Death Speed Run</h2>'
    + '<p class="subtext" style="margin-top:6px;">High-intensity rapid recall training. 30-second ticking timer per question. Correct answers add +5s bonus time. One miss ends the run!</p>'
    + '<div class="certs" style="margin-top:18px;">'
    + CERTS.map(c => {
        const hs = (S.speedRunScores || {})[c.id] || 0;
        return '<div class="cert" onclick="startSpeedRun(\''+c.id+'\')">'
          + '<div style="display:flex; justify-content:space-between;"><span class="code" style="color:'+c.color+';">'+c.code+'</span><span style="font-size:11.5px; font-weight:700; color:var(--gold);">🏆 Record: '+hs+' streak</span></div>'
          + '<h3 style="font-size:15px; margin:6px 0;">'+c.name+'</h3>'
          + '<div class="rowbtns" style="margin-top:10px;"><button class="btn sm">Start Speed Run ⚡</button></div>'
          + '</div>';
      }).join('')
    + '</div>'
    + '</div>';
}

function startSpeedRun(certId){
  const c = CERTS.find(x => x.id === certId);
  if (!c) return;
  if (!c._loaded) {
    loadCert(c).then(() => startSpeedRun(certId));
    return;
  }
  const pool = shuffleArr(c.questions.slice());
  speedRunState = { cert: c, questions: pool, idx: 0, streak: 0, timeLeft: 30, timer: null, score: 0 };
  clearInterval(speedRunState.timer);
  speedRunState.timer = setInterval(() => {
    speedRunState.timeLeft--;
    updateSpeedRunTimerUi();
    if (speedRunState.timeLeft <= 0) {
      endSpeedRun(false, "⏰ Time Expired!");
    }
  }, 1000);
  renderSpeedRunQuestion();
}

function updateSpeedRunTimerUi(){
  const tEl = document.getElementById("speedTimerText");
  const fill = document.getElementById("speedTimerFill");
  if (tEl) tEl.textContent = speedRunState.timeLeft + "s";
  if (fill) {
    const pct = Math.max(0, Math.min(100, (speedRunState.timeLeft / 30) * 100));
    fill.style.width = pct + "%";
    if (speedRunState.timeLeft <= 8) fill.classList.add("urgent");
    else fill.classList.remove("urgent");
  }
}

function renderSpeedRunQuestion(){
  renderHeader();
  const q = speedRunState.questions[speedRunState.idx];
  const c = speedRunState.cert;
  $("app").innerHTML = '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center;">'
    + '<span style="font-size:13px; font-weight:800; color:var(--coral);">⚡ Speed Run · '+c.code+'</span>'
    + '<span style="font-size:15px; font-weight:900; color:var(--gold);">🔥 Streak: ' + speedRunState.streak + '</span>'
    + '</div>'
    + '<div class="speed-timer-bar"><div id="speedTimerFill" class="speed-timer-fill" style="width:100%;"></div></div>'
    + '<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:10px;">'
    + '<span>Question ' + (speedRunState.idx + 1) + '</span>'
    + '<span id="speedTimerText" style="font-weight:800; color:var(--coral);">' + speedRunState.timeLeft + 's</span>'
    + '</div>'
    + '<div class="qtext" style="font-size:15px;">' + esc(q.q) + '</div>'
    + q.opts.map((o, j) => '<button class="opt" onclick="answerSpeedRun('+j+')"><b class="okey">'+(j+1)+'</b>' + esc(o) + '</button>').join('')
    + '</div>';
}

function answerSpeedRun(pickIdx){
  const q = speedRunState.questions[speedRunState.idx];
  const ok = (pickIdx === q.a);
  if (ok) {
    playSound('correct');
    speedRunState.streak++;
    speedRunState.timeLeft = Math.min(45, speedRunState.timeLeft + 5);
    speedRunState.score += (10 + speedRunState.streak * 2);
    addXP(8, "Speed Run answer");
    toast('⚡ +5s Bonus! Streak: ' + speedRunState.streak);
    speedRunState.idx = (speedRunState.idx + 1) % speedRunState.questions.length;
    renderSpeedRunQuestion();
  } else {
    playSound('wrong');
    endSpeedRun(false, "❌ Incorrect Answer");
  }
}

function endSpeedRun(timeout, reason){
  clearInterval(speedRunState.timer);
  const c = speedRunState.cert;
  S.speedRunScores = S.speedRunScores || {};
  const prevBest = S.speedRunScores[c.id] || 0;
  if (speedRunState.streak > prevBest) {
    S.speedRunScores[c.id] = speedRunState.streak;
    save();
    toast('🏆 New Speed Run High Score: ' + speedRunState.streak + ' streak!');
  }
  renderHeader();
  $("app").innerHTML = '<div class="panel center">'
    + '<div style="font-size:38px;">🏁</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Speed Run Ended</h2>'
    + '<div style="font-size:13px; color:var(--coral); font-weight:700; margin-top:4px;">' + reason + '</div>'
    + '<div class="bigscore" style="color:var(--gold); font-size:42px; margin:12px 0;">' + speedRunState.streak + '<span style="font-size:18px; color:var(--muted);"> streak</span></div>'
    + '<p class="subtext">Personal Best on '+c.code+': <b>' + (S.speedRunScores[c.id] || speedRunState.streak) + ' streak</b></p>'
    + '<div class="rowbtns" style="justify-content:center; margin-top:16px;">'
    + '<button class="btn" onclick="startSpeedRun(\''+c.id+'\')">⚡ Try Again</button>'
    + '<button class="btn ghost" onclick="speedRunSelect()">Speed Run Hub</button>'
    + '<button class="btn ghost" onclick="home()">Home</button>'
    + '</div>'
    + '</div>';
}

/* ================= 5. VERIFIED READINESS DIPLOMA / CERTIFICATE ================= */
function certificateSelect(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎓</div>'
    + '<h2 style="font-size:20px; margin-top:8px;">Verified Readiness Diplomas</h2>'
    + '<p class="subtext" style="margin-top:6px;">Official credentials generated once you clear mock exams and master the study guide.</p>'
    + '<div class="certs" style="margin-top:18px;">'
    + CERTS.map(c => {
        const rp = prepProgress(c);
        const mocks = S.mocks[c.id] || [];
        const bestMock = mocks.length ? Math.max(...mocks) : 0;
        const isReady = rp.score >= 70 || bestMock >= 720;
        return '<div class="cert" onclick="renderCertificate(\''+c.id+'\')">'
          + '<div style="display:flex; justify-content:space-between;"><span class="code" style="color:'+c.color+';">'+c.code+'</span><span style="font-size:11px; font-weight:800; color:'+(isReady?'var(--green)':'var(--muted)')+';">'+(isReady?'✓ UNLOCKED':'🔒 In Progress ('+rp.score+'%)')+'</span></div>'
          + '<h3 style="font-size:15px; margin:6px 0;">'+c.name+'</h3>'
          + '<div class="rowbtns" style="margin-top:10px;"><button class="btn sm '+(isReady?'':'ghost')+'">View Certificate 🎓</button></div>'
          + '</div>';
      }).join('')
    + '</div>'
    + '</div>';
}

function renderCertificate(certId){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  const c = CERTS.find(x => x.id === certId) || CERTS[0];
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const hash = "CQ-" + c.code.replace(/[^A-Z]/g, '') + "-" + Math.abs((S.xp * 7919) % 999999).toString(16).toUpperCase();
  
  $("app").innerHTML = '<button class="back" onclick="certificateSelect()">← Back to Certificates</button>'
    + '<div style="margin-bottom:16px; display:flex; justify-content:flex-end; gap:8px;">'
    + '<button class="btn sm" onclick="window.print()">🖨️ Print / Save PDF</button>'
    + '</div>'
    + '<div class="cert-frame" id="diplomaFrame">'
    + '<div class="cert-seal">✓</div>'
    + '<div style="font-size:11px; font-weight:800; letter-spacing:2px; color:var(--muted); text-transform:uppercase;">Certificate of Exam Readiness</div>'
    + '<h2>' + c.name + '</h2>'
    + '<div style="font-size:13px; color:var(--muted); margin-bottom:18px;">Official Prep Mastery Verification · Track ' + c.code + '</div>'
    + '<p style="font-size:14px; line-height:1.6; max-width:520px; margin:0 auto 18px;">This credential verifies that candidate has completed the comprehensive curriculum, demonstrated multi-domain accuracy, and successfully cleared the practice benchmark.</p>'
    + '<div style="display:flex; justify-content:space-around; align-items:center; border-top:1px solid #ddd; padding-top:16px; margin-top:18px; font-size:12px;">'
    + '<div><b>Date Issued:</b><br>' + dateStr + '</div>'
    + '<div><b>Credential ID:</b><br><code>' + hash + '</code></div>'
    + '<div><b>Candidate XP:</b><br>' + S.xp + ' Level ' + level() + '</div>'
    + '</div>'
    + '</div>';
}

/* ================= 6. COGNITIVE & ACCESSIBILITY MODES =================
   None of these faces are bundled: there is no @font-face anywhere and the
   offline build has no CDN to pull one from, so each mode only works if the
   user happens to have the font installed. On a stock Windows box that means
   OpenDyslexic lands on Comic Sans MS and JetBrains Mono lands on Consolas -
   both fine - but Lexend has no installed fallback, so picking it changed
   absolutely nothing and gave a toast claiming it had. The picker now says
   which ones this device can actually honour. */
const FONT_MODES = [
  { v: "default",  family: null,             alts: [],                          label: "System default" },
  { v: "lexend",   family: "Lexend",         alts: [],                          label: "Lexend (reading fluency)" },
  { v: "dyslexic", family: "OpenDyslexic",   alts: ["Comic Sans MS"],           label: "OpenDyslexic (wider letter &amp; word spacing)" },
  { v: "mono",     family: "JetBrains Mono", alts: ["SF Mono", "Consolas"],     label: "Monospace (technical reading)" },
];

/* What a mode will really render in, which is not always what it is called.
   `alts` mirrors the fallback chain in the stylesheet, so the answer stays
   honest without hard-coding an assumption about the user's OS. */
function fontModeSubstitute(m){
  if(!m || !m.family || fontAvailable(m.family)) return null;      // nothing to explain
  const alt = m.alts.find(fontAvailable);
  return alt || "";   // "" = nothing in the chain is installed either
}

/* True if the family actually resolves here. Measured against a family that
   cannot exist: identical widths mean the browser silently fell back. */
const fontProbeCache = {};
function fontAvailable(name){
  if(name in fontProbeCache) return fontProbeCache[name];
  const probe = document.createElement("span");
  // No layout in the headless test harness; assume present rather than lie.
  if(!probe.getBoundingClientRect) return (fontProbeCache[name] = true);
  const width = stack => {
    probe.textContent = "Handgloves mmmiiillWW 12345";
    probe.style.cssText = "position:absolute; visibility:hidden; white-space:nowrap; font-size:64px; font-family:" + stack;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  };
  return (fontProbeCache[name] = width('"' + name + '"') !== width('"__no_such_font__"'));
}

function accessibilityModal(){
  const modal = document.createElement("div");
  modal.id = "accessModal";
  modal.className = "modal-overlay";
  modal.innerHTML = '<div class="modal-content" style="max-width:440px; background:var(--card); border:2px solid var(--border); border-radius:14px; padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.35);">'
    + '<h3 style="font-size:17px; margin-bottom:6px;">🔠 Accessibility & Visual Comfort</h3>'
    + '<p style="font-size:12px; color:var(--muted); margin-bottom:14px;">Tailor typography and color contrast for late-night study sessions or cognitive reading preferences.</p>'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Typography Font Family:</label>'
    + '<select id="accFontSel" onchange="applyFontMode(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:14px;">'
    + FONT_MODES.map(m => {
        const sub = fontModeSubstitute(m);
        const note = sub === null ? ''
          : sub ? ' — not installed, uses ' + sub
                : ' — not installed, no change on this device';
        return '<option value="'+m.v+'" '+(S.fontMode===m.v?'selected':'')+'>'+m.label+note+'</option>';
      }).join('')
    + '</select>'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Display Contrast Mode:</label>'
    + '<select id="accContrastSel" onchange="applyContrastMode(this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:18px;">'
    + '<option value="default" '+(S.contrastMode==='default'?'selected':'')+'>Standard Contrast</option>'
    + '<option value="oled" '+(S.contrastMode==='oled'?'selected':'')+'>OLED True Black (Eye Comfort)</option>'
    + '<option value="sepia" '+(S.contrastMode==='sepia'?'selected':'')+'>Warm Sepia Paper (Night Reading)</option>'
    + '</select>'
    + '<div style="display:flex; justify-content:flex-end;">'
    + '<button class="btn sm" onclick="document.getElementById(\'accessModal\').remove()">Done</button>'
    + '</div>'
    + '</div>';
  document.body.appendChild(modal);
}

function applyFontMode(mode){
  S.fontMode = mode;
  save();
  document.body.classList.remove('font-lexend', 'font-dyslexic', 'font-mono');
  if (mode !== 'default') document.body.classList.add('font-' + mode);
  const m = FONT_MODES.find(f => f.v === mode);
  const plain = m ? m.label.replace(/&amp;/g, "&").replace(/\s*\(.*\)$/, "") : mode;
  // Don't claim a font was applied when the browser quietly substituted one.
  const sub = fontModeSubstitute(m);
  toast(sub === null ? 'Font: ' + plain
      : sub ? m.family + ' is not installed — using ' + sub
            : m.family + ' is not installed on this device');
}

function applyContrastMode(mode){
  S.contrastMode = mode;
  save();
  if (mode === 'default') document.documentElement.removeAttribute('data-contrast');
  else document.documentElement.setAttribute('data-contrast', mode);
  toast('Contrast mode: ' + mode);
}

if (typeof window !== 'undefined') {
  if (S.fontMode && S.fontMode !== 'default') document.body.classList.add('font-' + S.fontMode);
  if (S.contrastMode && S.contrastMode !== 'default') document.documentElement.setAttribute('data-contrast', S.contrastMode);
}

/* ================= NEXT-LEVEL UPGRADE SUITES ================= */

/* ================= 1. GOLDEN PROMPT STUDIO (LINTER & EVALUATOR) ================= */
const SAMPLE_PROMPTS = {
  custom: "",
  code_analysis: `<context>
You are an expert security engineer reviewing a Node.js microservice.
Repository Guidelines:
- Strict zero-trust input validation on all routes
- All SQL queries must use parameterized bindings
- Never store raw API keys in source control
</context>

<instructions>
1. Identify all potential OWASP Top 10 vulnerabilities in the provided snippet.
2. Provide a secure, refactored version of the code.
3. Include an architectural explanation for why the refactored code prevents exploit vectors.
</instructions>

<code_to_review>
const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";
db.execute(query);
</code_to_review>`,
  extraction: `<context>
Company Policy:
- Standard refund window is 30 days from delivery.
- Premium members receive 60-day refund window.
</context>

<instructions>
Extract the following fields from the customer email into JSON:
- customer_id (string)
- tier (STANDARD | PREMIUM)
- days_since_delivery (integer)
- refund_eligible (boolean)
</instructions>

<email>
Hi, my ID is CUST-8921. I bought this jacket 35 days ago. I have a Premium membership. Can I return it?
</email>`
};

function promptStudioView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--coral); color:#fff;">Golden Prompt Studio</span><h2 style="font-size:20px; margin-top:4px;">🧪 Prompt Engineering Linter & Evaluator</h2></div>'
    + '<select id="promptSampleSel" onchange="loadPromptSample(this.value)" style="padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;">'
    + '<option value="code_analysis">Template: Secure Code Review (XML & Context)</option>'
    + '<option value="extraction">Template: Structured JSON Extraction</option>'
    + '<option value="custom">Clear / Custom Prompt</option>'
    + '</select>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Draft or test prompts in real-time against Anthropic official Prompt Engineering Best Practices (XML delimiters, positive framing, caching prefixes, and thinking token budgets).</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:16px;">'
    + '<div>'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Prompt Input (Markdown & XML):</label>'
    + '<textarea id="promptDraftInput" oninput="lintPrompt()" style="width:100%; height:320px; padding:12px; border-radius:10px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:12.5px; font-family:\'SF Mono\',Consolas,monospace; line-height:1.5; resize:vertical;"></textarea>'
    + '<div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11.5px; color:var(--muted);">'
    + '<span id="promptCharCount">0 characters · 0 estimated tokens</span>'
    + '<button class="btn ghost sm" onclick="loadPromptSample(\'code_analysis\')">Reset to Golden Example</button>'
    + '</div>'
    + '</div>'
    + '<div>'
    + '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); position:sticky; top:16px;">'
    + '<h4 style="font-size:14px; margin-bottom:10px; color:var(--coral-dark);">📊 Real-Time Linter Scorecard</h4>'
    + '<div style="display:flex; align-items:baseline; gap:8px; margin-bottom:8px;">'
    + '<span id="promptScoreNum" style="font-size:36px; font-weight:900; color:var(--green);">100%</span>'
    + '<span id="promptScoreVerdict" style="font-size:12px; font-weight:700; color:var(--green);">Golden Standard Prompt</span>'
    + '</div>'
    + '<div class="pbar" style="height:8px; margin-bottom:14px;"><div id="promptScoreBar" style="width:100%; background:var(--green);"></div></div>'
    + '<div id="promptLintIssues" style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;"></div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';
  
  loadPromptSample("code_analysis");
}

function loadPromptSample(key){
  const input = document.getElementById("promptDraftInput");
  if (input) {
    input.value = SAMPLE_PROMPTS[key] || "";
    lintPrompt();
  }
}

function lintPrompt(){
  const text = (document.getElementById("promptDraftInput")?.value || "").trim();
  const charEl = document.getElementById("promptCharCount");
  const scoreNum = document.getElementById("promptScoreNum");
  const verdict = document.getElementById("promptScoreVerdict");
  const bar = document.getElementById("promptScoreBar");
  const issuesEl = document.getElementById("promptLintIssues");
  
  const estTokens = Math.round(text.length / 4);
  if (charEl) charEl.textContent = text.length + " characters · ~" + estTokens.toLocaleString() + " tokens";
  
  if (!text) {
    if (scoreNum) scoreNum.textContent = "0%";
    if (verdict) verdict.textContent = "Empty Prompt";
    if (bar) bar.style.width = "0%";
    if (issuesEl) issuesEl.innerHTML = '<span style="font-size:12px; color:var(--muted);">Enter a prompt to inspect static heuristics.</span>';
    return;
  }

  const issues = [];
  let score = 100;

  // 1. XML Tag Nesting Check
  const openTags = (text.match(/<([a-z_0-9]+)>/gi) || []).map(t => t.replace(/[<>]/g, '').toLowerCase());
  const closeTags = (text.match(/<\/([a-z_0-9]+)>/gi) || []).map(t => t.replace(/[<>/]/g, '').toLowerCase());
  const hasXml = openTags.length > 0;
  if (!hasXml) {
    score -= 20;
    issues.push({ type: "warn", icon: "🏷️", title: "Missing XML Structure", desc: "Anthropic models perform significantly better when context, instructions, and examples are demarcated using XML tags like &lt;context&gt; and &lt;instructions&gt;." });
  } else {
    const unclosed = openTags.filter(t => !closeTags.includes(t));
    if (unclosed.length > 0) {
      score -= 15;
      issues.push({ type: "err", icon: "⚠️", title: "Unclosed XML Tags: &lt;" + unclosed.join("&gt;, &lt;") + "&gt;", desc: "Ensure every opening XML tag has a matching closing tag to avoid semantic confusion." });
    }
  }

  // 2. Negative Framing Detector
  const negativeRegex = /\b(do not|don't|never|avoid|stop)\b/gi;
  const negMatches = text.match(negativeRegex);
  if (negMatches && negMatches.length >= 2) {
    score -= 10;
    issues.push({ type: "tip", icon: "💡", title: "High Negative Directive Density (" + negMatches.length + "x)", desc: "Negative constraints ('Do not do X') are less reliable than positive instructions ('Only include Y' or 'Format as Z')." });
  }

  // 3. Static Context / Caching Placement
  const contextIndex = text.toLowerCase().indexOf("<context>");
  const instrIndex = text.toLowerCase().indexOf("<instructions>");
  if (contextIndex > 0 && instrIndex > 0 && contextIndex > instrIndex) {
    score -= 15;
    issues.push({ type: "warn", icon: "⚡", title: "Sub-optimal Context Order for Caching", desc: "Static background context should be placed near the top before dynamic user instructions to maximize Prompt Caching hit rates." });
  }

  // 4. Extended Thinking Budget Recommendation
  const hasReasoningKeywords = /\b(analyze|evaluate|step-by-step|diagnose|prove|debug|architect)\b/i.test(text);
  if (hasReasoningKeywords && !text.includes("<thinking>")) {
    issues.push({ type: "info", icon: "🧠", title: "Recommended: adaptive thinking at high effort", desc: "This prompt requires deep multi-step deduction. Pair with <code>thinking:{type:'adaptive'}</code> and <code>output_config:{effort:'high'}</code>. Do not reach for <code>budget_tokens</code> — it returns a 400 on current models." });
  }

  const clamped = Math.max(10, Math.min(100, score));
  let badgeColor = "var(--green)";
  let vText = "Golden Standard Prompt ✨";
  if (clamped < 60) { badgeColor = "var(--coral)"; vText = "Needs Refactoring ⚠️"; }
  else if (clamped < 85) { badgeColor = "var(--gold)"; vText = "Good — Minor Improvements 📈"; }

  if (scoreNum) { scoreNum.textContent = clamped + "%"; scoreNum.style.color = badgeColor; }
  if (verdict) { verdict.textContent = vText; verdict.style.color = badgeColor; }
  if (bar) { bar.style.width = clamped + "%"; bar.style.background = badgeColor; }
  
  if (clamped >= 95) award("prompt_master");

  if (issuesEl) {
    issuesEl.innerHTML = issues.map(iss => '<div style="border-left:3px solid '+(iss.type==='err'?'var(--coral)':iss.type==='warn'?'var(--gold)':'var(--blue)')+'; background:var(--bg); padding:8px 10px; border-radius:0 6px 6px 0; font-size:12px;">'
      + '<b>' + iss.icon + ' ' + iss.title + '</b>'
      + '<div style="color:var(--muted); margin-top:2px; line-height:1.4;">' + iss.desc + '</div>'
      + '</div>').join('') || '<div style="font-size:12.5px; color:var(--green); font-weight:700;">✓ Perfect XML hygiene, positive task framing, and optimal context hierarchy!</div>';
  }
}

/* ================= 2. MCP & TOOL CALLING PROTOCOL WORKBENCH ================= */
let mcpWorkbenchStep = 0;

function mcpWorkbenchView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--blue); color:#fff;">Protocol Workbench</span><h2 style="font-size:20px; margin-top:4px;">🔌 MCP & Tool-Calling Protocol Inspector</h2></div>'
    + '<div style="display:flex; gap:6px;">'
    + '<button class="btn sm" onclick="stepMcpWorkbench()">▶️ Next Protocol Turn</button>'
    + '<button class="btn ghost sm" onclick="resetMcpWorkbench()">↺ Reset</button>'
    + '</div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Step through the Model Context Protocol (MCP) JSON-RPC 2.0 handshake, schema discovery, and multi-turn tool execution loop.</p>'
    + '<div id="mcpTimelineVisual" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px;"></div>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:14px;">'
    + '<div>'
    + '<div style="font-size:12px; font-weight:700; margin-bottom:4px;">Client -> Server JSON-RPC Message:</div>'
    + '<pre id="mcpClientMsg" style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px; font-size:11.5px; font-family:\'SF Mono\',Consolas,monospace; max-height:220px; overflow-y:auto;"></pre>'
    + '</div>'
    + '<div>'
    + '<div style="font-size:12px; font-weight:700; margin-bottom:4px;">Server / Claude Response Block:</div>'
    + '<pre id="mcpServerMsg" style="background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px; font-size:11.5px; font-family:\'SF Mono\',Consolas,monospace; max-height:220px; overflow-y:auto;"></pre>'
    + '</div>'
    + '</div>'
    + '<div id="mcpStepExplanation" style="margin-top:14px; padding:12px; border-radius:8px; background:var(--bg); border:1px solid var(--border); font-size:12.5px; line-height:1.5;"></div>'
    + '</div>';
  
  resetMcpWorkbench();
}

const MCP_STEPS = [
  {
    name: "1. Handshake",
    status: "Active",
    client: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: { tools: {}, resources: {}, roots: {} }, clientInfo: { name: "Claude Desktop", version: "1.0.0" } } },
    server: { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2024-11-05", capabilities: { tools: { listChanged: true } }, serverInfo: { name: "Postgres-MCP-Server", version: "2.1.0" } } },
    exp: "<b>Step 1: Protocol Handshake (initialize):</b> The client negotiates capabilities with the server. Note that version agreement ensures backwards compatibility across transport channels (stdio / SSE)."
  },
  {
    name: "2. Tool Discovery",
    status: "Active",
    client: { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    server: { jsonrpc: "2.0", id: 2, result: { tools: [{ name: "query_database", description: "Execute read-only SQL queries against Postgres", inputSchema: { type: "object", properties: { sql: { type: "string" } }, required: ["sql"] } }] } },
    exp: "<b>Step 2: Schema Discovery (tools/list):</b> The MCP server declares available tools as standard JSON Schema. Claude injects these schemas into the system block."
  },
  {
    name: "3. Tool Invocation",
    status: "Active",
    client: { role: "user", content: "What is the total revenue for Q3 2026?" },
    server: { role: "assistant", content: [{ type: "text", text: "Let me query the sales database." }, { type: "tool_use", id: "toolu_0192X", name: "query_database", input: { sql: "SELECT SUM(amount) FROM transactions WHERE quarter = 'Q3-2026';" } }], stop_reason: "tool_use" },
    exp: "<b>Step 3: Claude Emits tool_use:</b> When Claude determines a tool is needed, generation halts with <code>stop_reason: 'tool_use'</code>. The application executes the query locally."
  },
  {
    name: "4. Result Synthesis",
    status: "Active",
    client: { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_0192X", content: JSON.stringify({ revenue: 4280500 }), is_error: false }] },
    server: { role: "assistant", content: [{ type: "text", text: "The total revenue for Q3 2026 was $4,280,500." }], stop_reason: "end_turn" },
    exp: "<b>Step 4: Tool Result Return:</b> The application responds with <code>type: 'tool_result'</code> referencing <code>tool_use_id</code>. Claude synthesizes the final answer and completes with <code>stop_reason: 'end_turn'</code>."
  }
];

function resetMcpWorkbench(){
  mcpWorkbenchStep = 0;
  renderMcpStep();
}

function stepMcpWorkbench(){
  mcpWorkbenchStep = (mcpWorkbenchStep + 1) % MCP_STEPS.length;
  if (mcpWorkbenchStep === MCP_STEPS.length - 1) award("mcp_engineer");
  renderMcpStep();
}

function renderMcpStep(){
  const s = MCP_STEPS[mcpWorkbenchStep];
  const vis = document.getElementById("mcpTimelineVisual");
  const cEl = document.getElementById("mcpClientMsg");
  const sEl = document.getElementById("mcpServerMsg");
  const expEl = document.getElementById("mcpStepExplanation");
  
  if (vis) {
    vis.innerHTML = MCP_STEPS.map((st, idx) => '<div style="border:2px solid '+(idx===mcpWorkbenchStep?'var(--blue)':idx<mcpWorkbenchStep?'var(--green)':'var(--border)')+'; background:var(--card); border-radius:8px; padding:8px; text-align:center;">'
      + '<div style="font-size:11px; font-weight:700;">' + st.name + '</div>'
      + '<span style="font-size:9px; font-weight:800; padding:2px 4px; border-radius:4px; color:#fff; background:'+(idx===mcpWorkbenchStep?'var(--blue)':idx<mcpWorkbenchStep?'var(--green)':'var(--muted)')+';">' + (idx===mcpWorkbenchStep?'ACTIVE':idx<mcpWorkbenchStep?'DONE':'PENDING') + '</span>'
      + '</div>').join('');
  }
  if (cEl) cEl.textContent = JSON.stringify(s.client, null, 2);
  if (sEl) sEl.textContent = JSON.stringify(s.server, null, 2);
  if (expEl) expEl.innerHTML = s.exp;
}

/* ================= 3. PERSONALIZED EXAM PRESCRIPTION ================= */
function examPrescriptionView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  // Analyze all missed questions
  const missedByCert = {};
  let totalMissed = 0;
  
  CERTS.forEach(c => {
    const ans = S.answered[c.id] || {};
    const misses = [];
    if (c._loaded && c.questions) {
      c.questions.forEach((q, idx) => {
        if (ans[qKey(c, idx)] === false) misses.push({ q, idx, cert: c });
      });
    }
    missedByCert[c.id] = misses;
    totalMissed += misses.length;
  });

  let content = '';
  if (totalMissed === 0) {
    content = '<div class="panel center">'
      + '<div style="font-size:38px;">✨</div>'
      + '<h2 style="font-size:20px; margin-top:6px;">No Missed Questions Recorded</h2>'
      + '<p class="subtext" style="margin-top:8px;">Your Diagnostic Prescription is generated automatically as you take Quizzes and Mock Exams. Once you encounter difficult questions, your tailored remediation playlist will appear here.</p>'
      + '<div class="rowbtns" style="justify-content:center; margin-top:16px;">'
      + '<button class="btn" onclick="startQuiz(\'ccao\')">⚔️ Launch Quiz Battle</button>'
      + '<button class="btn ghost" onclick="home()">Back to Home</button>'
      + '</div>'
      + '</div>';
  } else {
    let prescCards = '';
    CERTS.forEach(c => {
      const misses = missedByCert[c.id] || [];
      if (!misses.length) return;
      
      prescCards += '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;">'
        + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
        + '<span class="code" style="color:'+c.color+'; font-weight:800; font-size:14px;">'+c.code+' · '+c.name+'</span>'
        + '<span style="font-size:12px; font-weight:700; color:var(--coral);">' + misses.length + ' weak spots identified</span>'
        + '</div>'
        + '<div style="margin-bottom:12px; font-size:12.5px; color:var(--muted);">'
        + '<b>Key Prescribed Takeaways:</b> Review the 4-way explanations for your missed questions below, then drill them directly.'
        + '</div>'
        + misses.slice(0, 4).map(m => '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px; font-size:12px;">'
            + '<div style="font-weight:700; color:var(--ink); margin-bottom:4px;">' + esc(m.q.q) + '</div>'
            + '<div style="color:var(--green); margin-bottom:2px;">✓ Correct: ' + esc(m.q.opts[m.q.a]) + '</div>'
            + '<div style="color:var(--muted); font-size:11.5px;">💡 ' + esc(m.q.exp) + '</div>'
            + '</div>').join('')
        + '<div class="rowbtns" style="margin-top:12px;">'
        + '<button class="btn sm" onclick="startReview(\''+c.id+'\')">🩹 Drill '+c.code+' Missed Questions ('+misses.length+')</button>'
        + '</div>'
        + '</div>';
    });

    content = '<div class="panel">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">'
      + '<div><span class="ltag" style="background:var(--green); color:#fff;">Smart Remediation</span><h2 style="font-size:20px; margin-top:4px;">🎯 Personalized Exam Prescription</h2></div>'
      + '<span style="font-size:13px; font-weight:700; color:var(--coral);">' + totalMissed + ' total focus areas across all tracks</span>'
      + '</div>'
      + prescCards
      + '</div>';
  }

  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>' + content;
}

/* ================= 4. SDK CODE PLAYGROUND ================= */
let sdkState = { lang: "python", model: "sonnet", caching: true, thinking: false, streaming: true, toolCall: false };

function sdkPlaygroundView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--gold); color:#1a1a1a;">Developer Workbench</span><h2 style="font-size:20px; margin-top:4px;">💻 SDK Code Generator (Python & TypeScript)</h2></div>'
    + '<div style="display:flex; gap:6px;">'
    + '<button class="btn sm '+(sdkState.lang==='python'?'':'ghost')+'" onclick="setSdkLang(\'python\')">Python (anthropic)</button>'
    + '<button class="btn sm '+(sdkState.lang==='ts'?'':'ghost')+'" onclick="setSdkLang(\'ts\')">TypeScript (@anthropic-ai/sdk)</button>'
    + '</div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Generate production-grade boilerplate for Claude Sonnet 5 & Haiku with Prompt Caching, Extended Thinking, and Streaming tool use.</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-bottom:14px;">'
    + '<div>'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Model Selection:</label>'
    + '<select id="sdkModelSel" onchange="setSdkOpt(\'model\', this.value)" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px;">'
    + '<option value="sonnet" '+(sdkState.model==='sonnet'?'selected':'')+'>Claude Sonnet 5 (claude-sonnet-5)</option>'
    + '<option value="haiku" '+(sdkState.model==='haiku'?'selected':'')+'>Claude Haiku 4.5 (claude-haiku-4-5)</option>'
    + '<option value="opus" '+(sdkState.model==='opus'?'selected':'')+'>Claude Opus 5 (claude-opus-5)</option>'
    + '</select>'
    + '</div>'
    + '<div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; padding-top:18px;">'
    + '<label style="font-size:12.5px; font-weight:700;"><input type="checkbox" '+(sdkState.caching?'checked':'')+' onchange="setSdkOpt(\'caching\', this.checked)"> Prompt Caching (85% off)</label>'
    + '<label style="font-size:12.5px; font-weight:700;"><input type="checkbox" '+(sdkState.thinking?'checked':'')+' onchange="setSdkOpt(\'thinking\', this.checked)"> Extended Thinking (2,048t)</label>'
    + '<label style="font-size:12.5px; font-weight:700;"><input type="checkbox" '+(sdkState.toolCall?'checked':'')+' onchange="setSdkOpt(\'toolCall\', this.checked)"> Tool Calling Schema</label>'
    + '</div>'
    + '</div>'
    + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">'
    + '<span style="font-size:12px; font-weight:700; color:var(--coral-dark);">Generated '+(sdkState.lang==='python'?'Python 3.10+':'TypeScript / Node.js')+' Code:</span>'
    + '<button class="btn ghost sm" onclick="copySdkCode()">📋 Copy Snippet</button>'
    + '</div>'
    + '<pre id="sdkCodeOutput" style="background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px; font-size:12px; font-family:\'SF Mono\',Consolas,monospace; line-height:1.5; overflow-x:auto; max-height:360px;"></pre>'
    + '</div>';
  
  renderSdkCode();
}

function setSdkLang(l){ sdkState.lang = l; sdkPlaygroundView(); }
function setSdkOpt(k, v){ sdkState[k] = v; renderSdkCode(); }

function renderSdkCode(){
  const out = document.getElementById("sdkCodeOutput");
  if (!out) return;
  const mStr = sdkState.model === "haiku" ? "claude-haiku-4-5" : sdkState.model === "opus" ? "claude-opus-5" : "claude-sonnet-5";
  
  let code = "";
  if (sdkState.lang === "python") {
    code = `import os
from anthropic import Anthropic

client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

response = client.messages.create(
    model="${mStr}",
    max_tokens=4096,`
    + (sdkState.thinking ? `\n    thinking={"type": "adaptive"},
    output_config={"effort": "high"},` : "")
    + `\n    system=[`
    + (sdkState.caching ? `\n        {"type": "text", "text": "You are an enterprise AI architect assistant.", "cache_control": {"type": "ephemeral"}}` : `\n        {"type": "text", "text": "You are an enterprise AI architect assistant."}`)
    + `\n    ],`
    + (sdkState.toolCall ? `\n    tools=[{
        "name": "lookup_patient_record",
        "description": "Fetch patient clinical history by ID",
        "input_schema": {
            "type": "object",
            "properties": {"patient_id": {"type": "string"}},
            "required": ["patient_id"]
        }
    }],` : "")
    + `\n    messages=[
        {"role": "user", "content": "Analyze the systemic implications of sub-second streaming."}
    ]
)

print(response.content[0].text)`;
  } else {
    code = `import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  const response = await anthropic.messages.create({
    model: '${mStr}',
    max_tokens: 4096,`
    + (sdkState.thinking ? `\n    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },` : "")
    + `\n    system: [`
    + (sdkState.caching ? `\n      { type: 'text', text: 'You are an enterprise AI architect assistant.', cache_control: { type: 'ephemeral' } }` : `\n      { type: 'text', text: 'You are an enterprise AI architect assistant.' }`)
    + `\n    ],`
    + (sdkState.toolCall ? `\n    tools: [{
      name: 'lookup_patient_record',
      description: 'Fetch patient clinical history by ID',
      input_schema: {
        type: 'object',
        properties: { patient_id: { type: 'string' } },
        required: ['patient_id'],
      },
    }],` : "")
    + `\n    messages: [
      { role: 'user', content: 'Analyze the systemic implications of sub-second streaming.' }
    ],
  });

  console.log(response.content[0].text);
}

run();`;
  }
  
  out.textContent = code;
}

function copySdkCode(){
  const text = document.getElementById("sdkCodeOutput")?.textContent || "";
  navigator.clipboard.writeText(text).then(() => toast("📋 Code copied to clipboard!"));
}

/* ================= 5. ADAPTIVE BOSS BATTLE SIMULATION ================= */
let bossState = { cert: null, questions: [], idx: 0, answers: [], startTime: 0, timer: null, elapsedSecs: 0 };

function bossBattleSelect(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">👑</div>'
    + '<h2 style="font-size:20px; margin-top:8px;">Adaptive Certification Boss Battle</h2>'
    + '<p class="subtext" style="margin-top:6px;">The ultimate test of exam readiness. 25 computer-adaptive scenario questions with real-time pacing telemetry and a post-battle debrief.</p>'
    + '<div class="certs" style="margin-top:18px;">'
    + CERTS.map(c => '<div class="cert" onclick="startBossBattle(\''+c.id+'\')">'
        + '<div style="display:flex; justify-content:space-between;"><span class="code" style="color:'+c.color+';">'+c.code+'</span><span style="font-size:11px; font-weight:800; color:var(--purple);">FINAL BOSS</span></div>'
        + '<h3 style="font-size:15px; margin:6px 0;">'+c.name+'</h3>'
        + '<div class="rowbtns" style="margin-top:10px;"><button class="btn sm" style="background:var(--purple);">Challenge Boss ⚔️</button></div>'
        + '</div>').join('')
    + '</div>'
    + '</div>';
}

function abandonBoss(){
  if (confirm("Abandon Boss Battle?")) {
    clearInterval(bossState.timer);
    home();
  }
}

function finishBossBattle(){
  clearInterval(bossState.timer);
  const c = bossState.cert;
  let correct = 0;
  bossState.questions.forEach((q, k) => {
    const isOk = bossState.answers[k] === q.a;
    if (isOk) correct++;
    recordAnswer(c, c.questions.indexOf(q), isOk);
  });
  
  const score = Math.round((correct / 25) * 1000);
  const pass = score >= 720;
  
  if (pass) {
    award("boss_slayer");
    addXP(100, "Boss Battle Victory");
    confetti();
  }
  
  renderHeader();
  $("app").innerHTML = '<div class="panel center">'
    + '<div style="font-size:42px;">' + (pass ? '🏆' : '⚔️') + '</div>'
    + '<h2 style="font-size:22px; margin-top:6px;">' + (pass ? 'Boss Battle Conquered!' : 'Boss Battle Incomplete') + '</h2>'
    + '<div class="bigscore" style="color:'+(pass?'var(--green)':'var(--coral)')+'; font-size:44px;">' + score + '<span style="font-size:18px; color:var(--muted);"> / 1000</span></div>'
    + '<div class="verdict '+(pass?'pass':'fail')+'">' + (pass ? 'Cleared practice benchmark! You are ready for the real exam.' : 'Below the 720 benchmark. Review weaknesses and retry.') + '</div>'
    + '<p class="subtext">Completed in ' + fmtT(bossState.elapsedSecs) + ' · ' + correct + '/25 correct answers</p>'
    + '<div class="rowbtns" style="justify-content:center; margin-top:18px;">'
    + '<button class="btn" onclick="startBossBattle(\''+c.id+'\')">⚔️ Replay Boss Battle</button>'
    + '<button class="btn ghost" onclick="examPrescriptionView()">🎯 View Prescription</button>'
    + '<button class="btn ghost" onclick="home()">Back to Home</button>'
    + '</div>'
    + '</div>';
}
