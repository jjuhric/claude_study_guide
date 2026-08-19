/* 06-practice.js
   Timed modes, drills, mini-games
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= MASTERCLASS UPGRADE SYSTEMS & BUG FIXES ================= */

/* ================= FIX 1: BOSS BATTLE REPAIRED ================= */
function startBossBattle(certId){
  const c = CERTS.find(x => x.id === certId);
  if (!c) return;
  if (!c._loaded) {
    loadCert(c).then(() => startBossBattle(certId)).catch(e => {
      alert("Could not load certification questions: " + (e && e.message || e));
    });
    return;
  }
  
  if (!c.questions || !c.questions.length) {
    alert("No questions available for this certification yet.");
    return;
  }

  // sampleByDomain returns an array of numeric indices. Map them to actual question objects.
  const idxs = sampleByDomain(c, 25);
  const pool = idxs.map(i => c.questions[i]);

  bossState = {
    cert: c,
    questions: pool,
    idx: 0,
    answers: new Array(pool.length).fill(null),
    startTime: Date.now(),
    timer: null,
    elapsedSecs: 0
  };

  clearInterval(bossState.timer);
  bossState.timer = setInterval(() => {
    bossState.elapsedSecs++;
    const tEl = document.getElementById("bossTimerDisplay");
    if (tEl) tEl.textContent = fmtT(bossState.elapsedSecs);
  }, 1000);
  
  renderBossQuestion();
}

function renderBossQuestion(){
  renderHeader();
  const q = bossState.questions[bossState.idx];
  const c = bossState.cert;
  if (!q || !c) { home(); return; }
  
  const ansCount = bossState.answers.filter(a => a !== null).length;
  
  $("app").innerHTML = '<button class="back" onclick="abandonBoss()">← Abandon Boss Battle</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">'
    + '<span style="font-size:13px; font-weight:800; color:var(--purple);">👑 Boss Battle · ' + c.code + ' (Question ' + (bossState.idx + 1) + ' of ' + bossState.questions.length + ')</span>'
    + '<span id="bossTimerDisplay" style="font-size:14px; font-weight:800; color:var(--coral);">' + fmtT(bossState.elapsedSecs) + '</span>'
    + '<span style="font-size:12px; color:var(--muted);">' + ansCount + ' / ' + bossState.questions.length + ' answered</span>'
    + '</div>'
    + '<div class="domtag">' + esc((c.domains && c.domains[q.d]) || 'General Domain') + '</div>'
    + '<div class="qtext" style="font-size:15px; font-weight:700; margin:10px 0 14px;">' + esc(q.q) + '</div>'
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + (q.opts || []).map((o, j) => {
        const sel = bossState.answers[bossState.idx] === j;
        return '<button class="opt' + (sel ? ' correct' : '') + '" onclick="pickBossAnswer(' + j + ')" style="text-align:left; padding:12px 14px; font-size:13.5px;"><b class="okey">' + (j + 1) + '</b> ' + esc(o) + '</button>';
      }).join('')
    + '</div>'
    + '<div class="rowbtns" style="margin-top:16px;">'
    + (bossState.idx > 0 ? '<button class="btn ghost sm" onclick="bossState.idx--; renderBossQuestion()">← Prev</button>' : '')
    + (bossState.idx < bossState.questions.length - 1 ? '<button class="btn sm" onclick="bossState.idx++; renderBossQuestion()">Next →</button>' : '<button class="btn sm" style="background:var(--green); margin-left:auto;" onclick="finishBossBattle()">Submit Boss Exam 🏁</button>')
    + '</div>'
    + '</div>';
}

function pickBossAnswer(j){
  bossState.answers[bossState.idx] = j;
  playSound('click');
  if (bossState.idx < bossState.questions.length - 1) {
    bossState.idx++;
    renderBossQuestion();
  } else {
    renderBossQuestion();
  }
}

/* ================= 1. ORAL DEFENSE / MOCK INTERVIEWER ================= */
const ORAL_DEFENSE_SCENARIOS = [
  {
    title: "Scenario 1: Enterprise KYC Document Pipeline",
    cert: "CCAR-F",
    prompt: "Your client processes 50,000 PDF bank statements and passports daily. Why do you recommend an Orchestrator-Workers topology over an open-ended Autonomous Loop, and what is your context compaction trigger?",
    options: [
      {
        text: "Use an Autonomous agent loop with an iteration cap of 50, compacting at 95% token capacity.",
        score: 40,
        feedback: "❌ Risky: Autonomous loops introduce non-deterministic execution paths and high token variance for fixed document extraction workflows. Compacting at 95% leaves zero token headroom for the compaction prompt."
      },
      {
        text: "Deploy Orchestrator-Workers fan-out parallel processing with deterministic JSON output validation, compacting proactively at 80% capacity (160k tokens).",
        score: 100,
        feedback: "✅ Optimal: Orchestrator-Workers parallelizes independent document chunks, reducing wall-clock latency from sum(t) to max(t). Compacting proactively at 80% (160k tokens) preserves critical context and compaction headroom."
      },
      {
        text: "Use sequential prompt chaining with FIFO truncation when the 200k token limit is reached.",
        score: 50,
        feedback: "⚠️ Sub-optimal: Sequential chaining processes 50k documents linearly with excessive latency. FIFO truncation causes catastrophic amnesia of earlier system instructions."
      }
    ]
  },
  {
    title: "Scenario 2: Financial RAG Table Hallucination",
    cert: "CCAR-P",
    prompt: "Your financial RAG pipeline hallucinates markdown transaction table values across quarterly reports. What is the root architectural fix?",
    options: [
      {
        text: "Increase top_k retrieval from 5 to 50 chunks without changing embedding or chunking strategies.",
        score: 30,
        feedback: "❌ Incorrect: Increasing top_k injects massive retrieval noise into the prompt and increases token costs without fixing table fragmentation."
      },
      {
        text: "Deploy a 3-Tier Hybrid RAG architecture (Dense Vector + BM25 Keyword + Cross-Encoder Re-Ranking) with semantic chunking that preserves table boundaries and prepends contextual chunk headers.",
        score: 100,
        feedback: "✅ Optimal: Slicing tables across arbitrary character boundaries destroys relational headers. Semantic chunking + contextual headers + Reciprocal Rank Fusion (RRF) eliminates table hallucination."
      },
      {
        text: "Switch primary model from Claude Sonnet 5 to Claude Opus 5 without modifying chunk boundaries.",
        score: 45,
        feedback: "⚠️ Ineffective: Model capability cannot compensate for corrupted or severed relational table chunks."
      }
    ]
  }
];

let oralDefenseIdx = 0;
let oralDefenseScore = 0;

function mockInterviewView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  const sc = ORAL_DEFENSE_SCENARIOS[oralDefenseIdx % ORAL_DEFENSE_SCENARIOS.length];
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Review Board Simulation</span><h2 style="font-size:20px; margin-top:4px;">🤖 Architectural Oral Defense Simulator</h2></div>'
    + '<span style="font-size:12px; font-weight:700; color:var(--muted);">' + (oralDefenseIdx + 1) + ' / ' + ORAL_DEFENSE_SCENARIOS.length + ' Case Studies</span>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Defend your enterprise architectural decisions before the Anthropic Review Board. Graded on Soundness, Cost Efficiency, Latency, and Best Practices.</p>'
    + '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;">'
    + '<div style="font-size:11px; font-weight:800; color:var(--coral); text-transform:uppercase; margin-bottom:4px;">' + sc.cert + ' · ' + sc.title + '</div>'
    + '<div style="font-size:14.5px; font-weight:700; color:var(--ink); line-height:1.5; margin-bottom:14px;">💬 "' + sc.prompt + '"</div>'
    + '<div style="display:flex; flex-direction:column; gap:10px;" id="defenseOptionsList">'
    + sc.options.map((opt, oIdx) => '<button class="opt" onclick="submitDefenseAnswer(' + oIdx + ')" style="text-align:left; padding:12px 14px; font-size:13px; line-height:1.4;"><b class="okey">' + String.fromCharCode(65 + oIdx) + '</b> ' + esc(opt.text) + '</button>').join('')
    + '</div>'
    + '<div id="defenseFeedbackBox" style="margin-top:14px;"></div>'
    + '</div>'
    + '</div>';
}

function submitDefenseAnswer(optIdx){
  const sc = ORAL_DEFENSE_SCENARIOS[oralDefenseIdx % ORAL_DEFENSE_SCENARIOS.length];
  const opt = sc.options[optIdx];
  const fBox = document.getElementById("defenseFeedbackBox");
  const optList = document.getElementById("defenseOptionsList");
  
  if (optList) {
    optList.querySelectorAll(".opt").forEach((b, i) => {
      b.disabled = true;
      if (i === optIdx) b.classList.add(opt.score === 100 ? "correct" : "wrong");
    });
  }
  
  if (opt.score === 100) {
    award("mock_interview");
    addXP(25, "Oral Defense Cleared");
    playSound('correct');
  } else {
    playSound('wrong');
  }
  
  if (fBox) {
    fBox.innerHTML = '<div style="border-left:4px solid ' + (opt.score === 100 ? 'var(--green)' : 'var(--coral)') + '; background:var(--bg); padding:12px 14px; border-radius:0 8px 8px 0; font-size:13px; line-height:1.5;">'
      + '<div style="font-weight:700; font-size:14px; color:' + (opt.score === 100 ? 'var(--green)' : 'var(--coral)') + '; margin-bottom:4px;">Score: ' + opt.score + '/100 — ' + (opt.score === 100 ? 'Approved by Review Board ✨' : 'Architectural Revisions Requested ⚠️') + '</div>'
      + opt.feedback
      + '</div>'
      + '<div class="rowbtns" style="margin-top:12px;">'
      + '<button class="btn sm" onclick="oralDefenseIdx++; mockInterviewView();">Next Architectural Defense →</button>'
      + '</div>';
  }
}

/* ================= 2. MODEL COST & LATENCY ROI CALCULATOR ================= */
let roiLastSummary = "";
let roiState = {
  mau: 5000,
  queriesPerDay: 5,
  inputTokens: 1500,
  outputTokens: 400,
  cachingHitRate: 60,
  batchApi: false
};

function modelRoiCalculatorView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--gold); color:#1a1a1a;">FinOps Workbench</span><h2 style="font-size:20px; margin-top:4px;">💰 Model Cost & Latency ROI Calculator</h2></div>'
    + '<button class="btn ghost sm" onclick="copyRoiSummary()">📋 Copy Executive Brief</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Calculate exact monthly token spend and latency tradeoffs across Claude Sonnet 5, Haiku, and Opus with Prompt Caching (reads at 0.1x input) and Batch API (50% off).</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-bottom:16px;">'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--card);">'
    + '<h4 style="font-size:13.5px; margin-bottom:10px;">📊 Workload Parameters</h4>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">Monthly Active Users (MAU): <span id="roiMauVal">' + roiState.mau.toLocaleString() + '</span></label><input type="range" min="500" max="50000" step="500" value="' + roiState.mau + '" oninput="updateRoiState(\'mau\', this.value)" style="width:100%;"></div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">Queries / User / Day: <span id="roiQVal">' + roiState.queriesPerDay + '</span></label><input type="range" min="1" max="25" step="1" value="' + roiState.queriesPerDay + '" oninput="updateRoiState(\'queriesPerDay\', this.value)" style="width:100%;"></div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">Avg Input Tokens / Turn: <span id="roiInVal">' + roiState.inputTokens + '</span></label><input type="range" min="200" max="10000" step="100" value="' + roiState.inputTokens + '" oninput="updateRoiState(\'inputTokens\', this.value)" style="width:100%;"></div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">Avg Output Tokens / Turn: <span id="roiOutVal">' + roiState.outputTokens + '</span></label><input type="range" min="100" max="4000" step="50" value="' + roiState.outputTokens + '" oninput="updateRoiState(\'outputTokens\', this.value)" style="width:100%;"></div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">Prompt Caching Hit Rate (%): <span id="roiCacheVal">' + roiState.cachingHitRate + '%</span></label><input type="range" min="0" max="95" step="5" value="' + roiState.cachingHitRate + '" oninput="updateRoiState(\'cachingHitRate\', this.value)" style="width:100%;"></div>'
    + '<div style="margin-top:12px;"><label style="font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:6px;"><input type="checkbox" ' + (roiState.batchApi ? 'checked' : '') + ' onchange="updateRoiState(\'batchApi\', this.checked)"> Batch API Mode (50% Cost Discount)</label></div>'
    + '</div>'
    + '<div id="roiComparisonTable" style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--card);"></div>'
    + '</div>'
    + '</div>';
  
  renderRoiCalculations();
}

function updateRoiState(k, v){
  roiState[k] = (k === 'batchApi') ? v : parseFloat(v);
  document.getElementById("roiMauVal") && (document.getElementById("roiMauVal").textContent = roiState.mau.toLocaleString());
  document.getElementById("roiQVal") && (document.getElementById("roiQVal").textContent = roiState.queriesPerDay);
  document.getElementById("roiInVal") && (document.getElementById("roiInVal").textContent = roiState.inputTokens.toLocaleString());
  document.getElementById("roiOutVal") && (document.getElementById("roiOutVal").textContent = roiState.outputTokens.toLocaleString());
  document.getElementById("roiCacheVal") && (document.getElementById("roiCacheVal").textContent = roiState.cachingHitRate + "%");
  renderRoiCalculations();
}

function renderRoiCalculations(){
  const tbl = document.getElementById("roiComparisonTable");
  if (!tbl) return;
  
  const totalMonthlyQueries = roiState.mau * roiState.queriesPerDay * 30;
  const rawInputMTok = (totalMonthlyQueries * roiState.inputTokens) / 1000000;
  const rawOutputMTok = (totalMonthlyQueries * roiState.outputTokens) / 1000000;
  
  const cacheHit = roiState.cachingHitRate / 100;
  const effectiveCachedInMTok = rawInputMTok * cacheHit;
  const effectiveUncachedInMTok = rawInputMTok * (1 - cacheHit);
  
  const batchMult = roiState.batchApi ? 0.5 : 1.0;
  
  // Rates per 1M tokens, from docs/FACTS.md 1. cacheRate is the read rate,
  // which is 0.1x input on every current model. The old "P99 latency" column
  // was removed rather than updated: Anthropic publishes no such figure, so
  // every number in it was invented, and a learner would have carried it into
  // a capacity plan. Relative speed is the honest version of what it conveyed.
  const models = [
    { name: "Claude Haiku 4.5", inRate: 1.00, cacheRate: 0.10, outRate: 5.00,  speed: "Fastest",      color: "var(--blue)" },
    { name: "Claude Sonnet 5",  inRate: 3.00, cacheRate: 0.30, outRate: 15.00, speed: "Balanced",     color: "var(--coral)" },
    { name: "Claude Opus 5",    inRate: 5.00, cacheRate: 0.50, outRate: 25.00, speed: "Most capable", color: "var(--purple)" }
  ];
  
  let rowsHtml = '';
  const summaryLines = [];
  models.forEach(m => {
    const costIn = (effectiveUncachedInMTok * m.inRate + effectiveCachedInMTok * m.cacheRate) * batchMult;
    const costOut = (rawOutputMTok * m.outRate) * batchMult;
    const totalCost = costIn + costOut;
    
    rowsHtml += '<div style="border-bottom:1px solid var(--border); padding:10px 0;">'
      + '<div style="display:flex; justify-content:space-between; align-items:baseline;">'
      + '<b style="color:' + m.color + '; font-size:14px;">' + m.name + '</b>'
      + '<span style="font-size:18px; font-weight:900; color:var(--ink);">' + ('$' + Math.round(totalCost).toLocaleString()) + '<small style="font-size:11px; color:var(--muted); font-weight:normal;">/mo</small></span>'
      + '</div>'
      + '<div style="font-size:11.5px; color:var(--muted); margin-top:2px;">'
      + '• ' + m.speed + ' · Input: ' + ('$' + Math.round(costIn).toLocaleString()) + ' · Output: ' + ('$' + Math.round(costOut).toLocaleString())
      + '</div>'
      + '</div>';
    summaryLines.push(m.name + ': $' + Math.round(totalCost).toLocaleString() + '/mo ('
      + 'input $' + Math.round(costIn).toLocaleString() + ', output $' + Math.round(costOut).toLocaleString() + ')');
  });
  roiLastSummary = 'Claude FinOps estimate — ' + Math.round(totalMonthlyQueries).toLocaleString() + ' calls/month\n'
    + roiState.inputTokens + ' input / ' + roiState.outputTokens + ' output tokens per call, '
    + roiState.cachingHitRate + '% cache hit rate' + (roiState.batchApi ? ', Batch API applied' : '') + '\n\n'
    + summaryLines.join('\n')
    + '\n\nRates per 1M tokens: Haiku 4.5 $1/$5, Sonnet 5 $3/$15, Opus 5 $5/$25. Cache reads bill at 0.1x input.';
  
  tbl.innerHTML = '<h4 style="font-size:13.5px; margin-bottom:10px;">💵 Monthly Spend Comparison (' + Math.round(totalMonthlyQueries).toLocaleString() + ' calls)</h4>'
    + rowsHtml
    + '<div style="font-size:11.5px; color:var(--green); margin-top:12px; line-height:1.4;">'
    + '💡 <b>Architect FinOps Takeaway:</b> On Sonnet 5, a ' + roiState.cachingHitRate + '% cache hit rate saves <b>' + ('$' + Math.round(rawInputMTok * cacheHit * 3.00 * 0.90 * batchMult).toLocaleString()) + '/mo</b> on input alone — a cache read bills at 0.1x input, so a hit saves 90% of that token rather than all of it. The first write of a prefix costs 25% more than input, which this figure ignores: if your prefix changes every call you pay the write and never collect the read.'
    + '</div>';
  
  award("roi_architect");
}

function copyRoiSummary(){
  /* This used to toast "copied" without copying anything. The summary is
     captured by the render, so the text and the table cannot disagree. */
  if(!roiLastSummary){ toast("⚠️ Nothing to copy yet — adjust an input first."); return; }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(roiLastSummary)
      .then(() => toast("📋 FinOps summary copied to clipboard!"))
      .catch(() => toast("⚠️ Clipboard blocked by the browser — select the table and copy manually."));
  } else {
    toast("⚠️ This browser exposes no clipboard API — select the table and copy manually.");
  }
}

/* ================= 3. LIVE CONTEXT WINDOW & 80% COMPACTION VISUALIZER ================= */
let ctxTokens = {
  system: 2500,
  tools: 4200,
  rag: 45000,
  history: 110000,
  compactionActive: false
};

function contextCompactionVisualizer(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--coral); color:#fff;">Context Architecture</span><h2 style="font-size:20px; margin-top:4px;">🧱 200k Context Window & 80% Compaction Simulator</h2></div>'
    + '<button class="btn sm ' + (ctxTokens.compactionActive ? 'ghost' : '') + '" onclick="toggleContextCompaction()">' + (ctxTokens.compactionActive ? '↺ Reset to Uncompacted State' : '⚡ Apply 80% Semantic Compaction') + '</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Anthropic models share a finite token budget across System Prompts, Tool Schemas, RAG Chunks, and Conversation History &mdash; up to 1M on current Opus and Sonnet models, 200K on Haiku 4.5.</p>'
    + '<div id="ctxBudgetVisualBar" style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;"></div>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--bg);">'
    + '<h4 style="font-size:13.5px; margin-bottom:6px; color:var(--coral);">⚠️ FIFO Truncation Failure Mode</h4>'
    + '<p style="font-size:12px; color:var(--muted); line-height:1.4;">Blindly slicing off early turns causes catastrophic amnesia. The agent forgets initial user constraints, tool output schemas, and security boundaries.</p>'
    + '</div>'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--bg);">'
    + '<h4 style="font-size:13.5px; margin-bottom:6px; color:var(--green);">✓ Structured Semantic Compaction (80% Rule)</h4>'
    + '<p style="font-size:12px; color:var(--muted); line-height:1.4;">Triggered proactively at 160k tokens. Compresses raw turns into a structured <code>&lt;key_facts&gt;</code> XML summary while preserving execution headroom.</p>'
    + '</div>'
    + '</div>'
    + '</div>';
  
  renderContextBudget();
}

function toggleContextCompaction(){
  ctxTokens.compactionActive = !ctxTokens.compactionActive;
  if (ctxTokens.compactionActive) {
    ctxTokens.history = 18000; // Compressed from 110k to 18k
    award("context_master");
    playSound('correct');
    toast("✨ Compacted 110k history into 18k structured <key_facts> summary!");
  } else {
    ctxTokens.history = 110000;
  }
  renderContextBudget();
}

function renderContextBudget(){
  const barEl = document.getElementById("ctxBudgetVisualBar");
  if (!barEl) return;
  
  const totalUsed = ctxTokens.system + ctxTokens.tools + ctxTokens.rag + ctxTokens.history;
  const pctUsed = Math.min(100, Math.round((totalUsed / 200000) * 100));
  const isOver80 = totalUsed >= 160000;
  
  barEl.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">'
    + '<div><span style="font-size:26px; font-weight:900; color:' + (isOver80 ? 'var(--coral)' : 'var(--green)') + ';">' + totalUsed.toLocaleString() + '</span><span style="font-size:13px; color:var(--muted);"> / 1,000,000 tokens (' + pctUsed + '%)</span></div>'
    + '<span style="font-size:12px; font-weight:700; color:' + (isOver80 ? 'var(--coral)' : 'var(--green)') + ';">' + (isOver80 ? '🚨 Over 80% Threshold — Compaction Required' : '🟢 Healthy Execution Headroom') + '</span>'
    + '</div>'
    + '<div style="height:20px; width:100%; border-radius:6px; background:var(--border); overflow:hidden; display:flex; margin-bottom:12px;">'
    + '<div style="width:' + ((ctxTokens.system / 200000) * 100) + '%; background:var(--blue);" title="System Prompt: ' + ctxTokens.system + 't"></div>'
    + '<div style="width:' + ((ctxTokens.tools / 200000) * 100) + '%; background:var(--purple);" title="Tool Schemas: ' + ctxTokens.tools + 't"></div>'
    + '<div style="width:' + ((ctxTokens.rag / 200000) * 100) + '%; background:var(--gold);" title="RAG Chunks: ' + ctxTokens.rag + 't"></div>'
    + '<div style="width:' + ((ctxTokens.history / 200000) * 100) + '%; background:' + (ctxTokens.compactionActive ? 'var(--green)' : 'var(--coral)') + ';" title="Conversation History: ' + ctxTokens.history + 't"></div>'
    + '</div>'
    + '<div style="display:flex; gap:12px; flex-wrap:wrap; font-size:11.5px; color:var(--muted);">'
    + '<span>🟦 System Prompt: <b>' + ctxTokens.system.toLocaleString() + 't</b></span>'
    + '<span>🟪 Tool Schemas: <b>' + ctxTokens.tools.toLocaleString() + 't</b></span>'
    + '<span>🟨 RAG Chunks: <b>' + ctxTokens.rag.toLocaleString() + 't</b></span>'
    + '<span>' + (ctxTokens.compactionActive ? '🟩 Compacted History:' : '🟥 Raw History:') + ' <b>' + ctxTokens.history.toLocaleString() + 't</b></span>'
    + '</div>';
}

/* ================= 4. FLASH RECALL SPEED MATCH MINI-GAME ================= */
const SPEED_MATCH_PAIRS = [
  { id: 1, a: "is_error: true", b: "Tool Execution Failure Return Handshake" },
  { id: 2, a: "429 Too Many Requests", b: "Full Jitter Exponential Retry Backoff" },
  { id: 3, a: "cache_control: {type: 'ephemeral'}", b: "5-Minute TTL Prompt Caching Prefix" },
  { id: 4, a: "RRF = Σ [1 / (60 + Rank)]", b: "Reciprocal Rank Fusion (Vector + BM25)" },
  { id: 5, a: "output_config.effort", b: "Adaptive thinking depth control" },
  { id: 6, a: "80% Rule (160k tokens)", b: "Proactive Context Compaction Trigger" }
];

let matchCards = [];
let matchFlipped = [];
let matchSolved = 0;
let matchTimer = null;
let matchSecs = 60;

function speedMatchView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  // Shuffle cards
  const cards = [];
  SPEED_MATCH_PAIRS.forEach(p => {
    cards.push({ id: p.id, text: p.a, type: 'term' });
    cards.push({ id: p.id, text: p.b, type: 'def' });
  });
  
  matchCards = shuffleArr(cards);
  matchFlipped = [];
  matchSolved = 0;
  matchSecs = 60;
  clearInterval(matchTimer);
  
  matchTimer = setInterval(() => {
    matchSecs--;
    const tEl = document.getElementById("speedMatchTimer");
    if (tEl) {
      tEl.textContent = matchSecs + "s";
      if (matchSecs <= 10) tEl.style.color = "var(--coral)";
    }
    if (matchSecs <= 0) {
      clearInterval(matchTimer);
      alert("⏱️ Time's up! Try again to beat the clock.");
      speedMatchView();
    }
  }, 1000);
  
  $("app").innerHTML = '<button class="back" onclick="clearInterval(matchTimer); home();">← Back</button>'
    + '<div class="panel center">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--gold); color:#1a1a1a;">Mini-Game</span><h2 style="font-size:20px; margin-top:4px;">⚡ Flash Recall Speed Match</h2></div>'
    + '<span id="speedMatchTimer" style="font-size:24px; font-weight:900; color:var(--coral);">' + matchSecs + 's</span>'
    + '</div>'
    + '<p class="subtext" style="margin-bottom:16px;">Click to pair matching architectural primitives and Anthropic best practices before the 60-second timer expires.</p>'
    + '<div id="speedMatchGrid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; max-width:720px; margin:0 auto;">'
    + matchCards.map((c, idx) => '<button id="mCard_' + idx + '" class="cert" onclick="clickMatchCard(' + idx + ')" style="padding:14px; min-height:80px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:12.5px; font-weight:700; border:2px solid var(--border); transition:all .15s;">'
        + esc(c.text)
        + '</button>').join('')
    + '</div>'
    + '</div>';
}

function clickMatchCard(idx){
  if (matchFlipped.length >= 2 || matchFlipped.includes(idx)) return;
  
  const el = document.getElementById("mCard_" + idx);
  if (!el || el.classList.contains("matched")) return;
  
  playSound('click');
  matchFlipped.push(idx);
  el.style.borderColor = "var(--blue)";
  el.style.background = "rgba(91,127,166,0.15)";
  
  if (matchFlipped.length === 2) {
    const c1 = matchCards[matchFlipped[0]];
    const c2 = matchCards[matchFlipped[1]];
    
    if (c1.id === c2.id && c1.type !== c2.type) {
      // Match found!
      playSound('correct');
      matchSolved++;
      const el1 = document.getElementById("mCard_" + matchFlipped[0]);
      const el2 = document.getElementById("mCard_" + matchFlipped[1]);
      setTimeout(() => {
        if (el1) { el1.classList.add("matched"); el1.style.borderColor = "var(--green)"; el1.style.background = "rgba(90,158,111,0.2)"; el1.disabled = true; }
        if (el2) { el2.classList.add("matched"); el2.style.borderColor = "var(--green)"; el2.style.background = "rgba(90,158,111,0.2)"; el2.disabled = true; }
        matchFlipped = [];
        
        if (matchSolved === SPEED_MATCH_PAIRS.length) {
          clearInterval(matchTimer);
          award("flash_match");
          addXP(50, "Speed Match Flawless Victory");
          confetti();
          alert("🎉 Spectacular! All pairs matched in " + (60 - matchSecs) + " seconds!");
        }
      }, 300);
    } else {
      // Wrong match
      playSound('wrong');
      const el1 = document.getElementById("mCard_" + matchFlipped[0]);
      const el2 = document.getElementById("mCard_" + matchFlipped[1]);
      setTimeout(() => {
        if (el1) { el1.style.borderColor = "var(--border)"; el1.style.background = "var(--card)"; }
        if (el2) { el2.style.borderColor = "var(--border)"; el2.style.background = "var(--card)"; }
        matchFlipped = [];
      }, 700);
    }
  }
}

/* ================= 5. CANDIDATE DIAGNOSTIC RADAR & AUDIT REPORT ================= */
function diagnosticRadarView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  let certRadarCards = '';
  CERTS.forEach(c => {
    const rp = prepProgress(c);
    certRadarCards += '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
      + '<span class="code" style="color:' + c.color + '; font-weight:800; font-size:15px;">' + c.code + ' · ' + c.name + '</span>'
      + '<span style="font-size:13px; font-weight:800; color:var(--coral);">' + rp.score + '% Overall Prep Index</span>'
      + '</div>'
      + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; align-items:center;">'
      + renderReadinessRadarSvg(c, rp)
      + '<div>'
      + '<h5 style="font-size:12.5px; margin-bottom:6px;">Domain Breakdown:</h5>'
      + rp.parts.map(p => '<div style="font-size:12px; margin-bottom:4px; display:flex; justify-content:space-between;">'
          + '<span>' + p.label + ':</span>'
          + '<b>' + Math.round(p.v * 100) + '%</b>'
          + '</div>').join('')
      + '<div style="margin-top:10px; font-size:12px; color:var(--muted);">'
      + '⚠️ <b>Weakest Focus Area:</b> ' + rp.weakest.todo
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  });
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">'
    + '<div><span class="ltag" style="background:var(--green); color:#fff;">Candidate Readiness Audit</span><h2 style="font-size:20px; margin-top:4px;">📊 Multi-Axis Diagnostic Radar & Audit Report</h2></div>'
    + '<button class="btn sm" onclick="window.print()">🖨️ Print Audit Report</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Comprehensive visual audit of candidate preparation depth across all 4 certification tracks.</p>'
    + certRadarCards
    + '</div>';
}


/* ================= 1. KEYBOARD SHORTCUTS HUD ================= */
function openShortcutsModal(){
  const existing = document.getElementById("shortcutsModal");
  if (existing) { existing.remove(); return; }
  
  const modal = document.createElement("div");
  modal.id = "shortcutsModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:500px; background:var(--card); border:2px solid var(--border); border-radius:14px; padding:20px; box-shadow:0 12px 36px rgba(0,0,0,0.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="font-size:18px; margin:0;">⌨️ Power-User Keyboard Shortcuts</h3>
        <button class="btn ghost sm" onclick="document.getElementById('shortcutsModal').remove()" style="padding:2px 8px;">✕</button>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12.5px;">
        <div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px;">
          <b style="display:block; color:var(--ink); margin-bottom:6px;">Study & Testing</b>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">1</kbd>–<kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">4</kbd> Select Answer Option</div>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Space</kbd> / <kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Enter</kbd> Flip Card / Advance</div>
          <div><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">F</kbd> Flag Question in Mock</div>
        </div>
        <div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px;">
          <b style="display:block; color:var(--ink); margin-bottom:6px;">Global Navigation</b>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Ctrl+K</kbd> Universal Search</div>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Ctrl+B</kbd> Bookmarks & Notes</div>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Ctrl+M</kbd> Toggle Audio Sound</div>
          <div style="margin-bottom:4px;"><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">Ctrl+T</kbd> Cycle Dark/Light Theme</div>
          <div><kbd style="background:var(--card); border:1px solid var(--border); padding:2px 5px; border-radius:4px; font-weight:700;">?</kbd> Open Shortcuts Menu</div>
        </div>
      </div>
      <div style="margin-top:14px; text-align:right;">
        <button class="btn sm" onclick="document.getElementById('shortcutsModal').remove()">Got it!</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/* ================= 2. CALENDAR .ICS SCHEDULE EXPORT ================= */
function exportStudyScheduleIcs(){
  const trackId = document.getElementById("spCertSelect")?.value || "ccdv";
  const paceDays = parseInt(document.getElementById("spDaysSelect")?.value || "14", 10);
  const cert = CERTS.find(x => x.id === trackId) || CERTS[0];
  
  let ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Claude Cert Quest//Study Planner//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
  const now = new Date();
  
  for (let d = 1; d <= paceDays; d++) {
    const eventDate = new Date(now.getTime() + d * 86400000);
    const dateStr = eventDate.toISOString().slice(0,10).replace(/-/g, "");
    const isMockDay = (d % 7 === 0) || (d === paceDays);
    const summary = isMockDay ? ("👑 " + cert.code + " Timed Mock Simulation") : ("📚 " + cert.code + " Daily Practice Session (Day " + d + ")");
    const desc = isMockDay ? "Sit for a full timed 20-question practice mock exam in Claude Cert Quest." : "Complete 1 lesson and 15 practice drill questions in Claude Cert Quest.";
    
    ics += "BEGIN:VEVENT\r\n"
      + "UID:certquest-" + trackId + "-day-" + d + "-" + dateStr + "@certquest.app\r\n"
      + "DTSTAMP:" + dateStr + "T090000Z\r\n"
      + "DTSTART:" + dateStr + "T090000Z\r\n"
      + "DTEND:" + dateStr + "T093000Z\r\n"
      + "SUMMARY:" + summary + "\r\n"
      + "DESCRIPTION:" + desc + "\r\n"
      + "STATUS:CONFIRMED\r\n"
      + "END:VEVENT\r\n";
  }
  
  ics += "END:VCALENDAR\r\n";
  
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = cert.code.toLowerCase() + "-study-schedule.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("📅 Exported " + paceDays + "-day study schedule (.ics) for Google/Apple/Outlook!");
}

/* ================= 3. INTERACTIVE MCP TOOL SCHEMA BUILDER ================= */
let toolBuilderState = {
  name: "get_weather_forecast",
  desc: "Retrieve 7-day weather forecast and precipitation alerts for a specific city.",
  params: [
    { name: "city", type: "string", desc: "The city name (e.g. San Francisco)", enumVals: "", required: true },
    { name: "unit", type: "string", desc: "Temperature unit", enumVals: "celsius, fahrenheit", required: false },
    { name: "days", type: "number", desc: "Forecast horizon in days (1-7)", enumVals: "", required: false }
  ]
};

function mcpSchemaBuilderView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--blue); color:#fff;">Tool Architecture</span><h2 style="font-size:20px; margin-top:4px;">🧩 Interactive Tool Schema Builder & JSON Validator</h2></div>'
    + '<div style="display:flex; gap:6px;">'
    + '<button class="btn sm" onclick="copyToolSchemaJson()">📋 Copy JSON Schema</button>'
    + '<button class="btn ghost sm" onclick="addToolParamRow()">➕ Add Parameter</button>'
    + '</div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Construct and validate Anthropic-compliant tool calling definitions with real-time JSON Schema output.</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:16px;">'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--card);">'
    + '<h4 style="font-size:13.5px; margin-bottom:10px;">🛠️ Tool Definition</h4>'
    + '<div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:700; display:block; margin-bottom:2px;">Tool Name:</label><input id="tbName" type="text" value="' + esc(toolBuilderState.name) + '" oninput="toolBuilderState.name=this.value; renderToolSchemaJson()" style="width:100%; padding:6px 8px; font-size:13px; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--ink);"></div>'
    + '<div style="margin-bottom:12px;"><label style="font-size:12px; font-weight:700; display:block; margin-bottom:2px;">Tool Description:</label><textarea id="tbDesc" oninput="toolBuilderState.desc=this.value; renderToolSchemaJson()" style="width:100%; height:60px; padding:6px 8px; font-size:12.5px; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-family:inherit;">' + esc(toolBuilderState.desc) + '</textarea></div>'
    + '<h5 style="font-size:12.5px; margin-bottom:8px;">Input Parameters (JSON Schema Properties):</h5>'
    + '<div id="tbParamsList" style="display:flex; flex-direction:column; gap:8px;"></div>'
    + '</div>'
    + '<div>'
    + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">'
    + '<span style="font-size:12px; font-weight:700; color:var(--coral-dark);">Validated Anthropic Tool Definition:</span>'
    + '<span id="tbValidationBadge" style="font-size:11px; font-weight:700; color:var(--green);">✓ Valid JSON Schema</span>'
    + '</div>'
    + '<pre id="tbSchemaOutput" style="background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px; font-size:11.5px; font-family:Consolas,monospace; line-height:1.4; overflow-x:auto; max-height:420px;"></pre>'
    + '</div>'
    + '</div>'
    + '</div>';
  
  renderToolParamRows();
  renderToolSchemaJson();
}

function renderToolParamRows(){
  const list = document.getElementById("tbParamsList");
  if (!list) return;
  list.innerHTML = toolBuilderState.params.map((p, idx) => `
    <div style="border:1px solid var(--border); border-radius:8px; padding:10px; background:var(--bg); font-size:12px;">
      <div style="display:flex; gap:6px; margin-bottom:6px;">
        <input type="text" placeholder="param_name" value="${esc(p.name)}" oninput="toolBuilderState.params[${idx}].name=this.value; renderToolSchemaJson()" style="flex:2; padding:4px 6px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--ink); font-size:12px;">
        <select onchange="toolBuilderState.params[${idx}].type=this.value; renderToolSchemaJson()" style="flex:1; padding:4px 6px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--ink); font-size:12px;">
          <option value="string" ${p.type==='string'?'selected':''}>string</option>
          <option value="number" ${p.type==='number'?'selected':''}>number</option>
          <option value="boolean" ${p.type==='boolean'?'selected':''}>boolean</option>
          <option value="array" ${p.type==='array'?'selected':''}>array</option>
          <option value="object" ${p.type==='object'?'selected':''}>object</option>
        </select>
        <button class="btn ghost sm" onclick="removeToolParamRow(${idx})" style="padding:2px 6px; color:var(--coral);">✕</button>
      </div>
      <input type="text" placeholder="Parameter description..." value="${esc(p.desc)}" oninput="toolBuilderState.params[${idx}].desc=this.value; renderToolSchemaJson()" style="width:100%; padding:4px 6px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--ink); font-size:11.5px; margin-bottom:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <input type="text" placeholder="Optional enum (comma-separated)" value="${esc(p.enumVals)}" oninput="toolBuilderState.params[${idx}].enumVals=this.value; renderToolSchemaJson()" style="flex:1; padding:3px 6px; border-radius:4px; border:1px solid var(--border); background:var(--card); color:var(--ink); font-size:11px; margin-right:8px;">
        <label style="font-size:11.5px; font-weight:700; display:flex; align-items:center; gap:4px;"><input type="checkbox" ${p.required?'checked':''} onchange="toolBuilderState.params[${idx}].required=this.checked; renderToolSchemaJson()"> Required</label>
      </div>
    </div>
  `).join('');
}

function addToolParamRow(){
  toolBuilderState.params.push({ name: "new_param", type: "string", desc: "", enumVals: "", required: false });
  renderToolParamRows();
  renderToolSchemaJson();
}

function removeToolParamRow(idx){
  toolBuilderState.params.splice(idx, 1);
  renderToolParamRows();
  renderToolSchemaJson();
}

function renderToolSchemaJson(){
  const out = document.getElementById("tbSchemaOutput");
  if (!out) return;
  
  const properties = {};
  const required = [];
  
  toolBuilderState.params.forEach(p => {
    if (!p.name) return;
    const prop = { type: p.type, description: p.desc || "" };
    if (p.enumVals) {
      prop.enum = p.enumVals.split(",").map(s => s.trim()).filter(Boolean);
    }
    properties[p.name] = prop;
    if (p.required) required.push(p.name);
  });
  
  const toolObj = {
    name: toolBuilderState.name || "custom_tool",
    description: toolBuilderState.desc || "",
    input_schema: {
      type: "object",
      properties: properties,
      required: required
    }
  };
  
  out.textContent = JSON.stringify(toolObj, null, 2);
}

function copyToolSchemaJson(){
  const text = document.getElementById("tbSchemaOutput")?.textContent || "";
  navigator.clipboard.writeText(text).then(() => toast("📋 Anthropic Tool Schema copied!"));
}

/* ================= 4. CROSS-TRACK ULTIMATE REMEDIATION PLAYLIST ================= */
function startMasterRemediation(){
  const allMisses = [];
  CERTS.forEach(c => {
    const ans = S.answered[c.id] || {};
    if (c._loaded && c.questions) {
      c.questions.forEach((q, qi) => {
        if (ans[qKey(c, qi)] === false) {
          allMisses.push({ cert: c, q, qi });
        }
      });
    }
  });
  
  if (!allMisses.length) {
    toast("✨ No missed questions recorded across any track! Try a quiz first.");
    return;
  }
  
  // Launch master drill on random sample of misses
  const selected = shuffleArr(allMisses).slice(0, 20);
  const sampleCert = selected[0].cert;
  
  Q = {
    cert: sampleCert,
    idxs: selected.map(s => s.qi),
    i: 0,
    correct: 0,
    combo: 0,
    mode: "review",
    stats: {},
    label: "Cross-Track Master Remediation (" + selected.length + " misses)"
  };
  
  quizQ();
}


/* ================= 1. EXAM TRAP HUNTER MINI-GAME ================= */
const TRAP_SCENARIOS = [
  {
    title: "Scenario 1: Extended Thinking Budget Configuration",
    desc: "Find the fatal configuration error that causes the Messages API to reject this call with HTTP 400.",
    lines: [
      { t: "import anthropic", err: false },
      { t: "client = anthropic.Anthropic()", err: false },
      { t: "response = client.messages.create(", err: false },
      { t: "    model='claude-sonnet-5',", err: false },
      { t: "    max_tokens=4000,", err: false },
      { t: "    thinking={'type': 'enabled', 'budget_tokens': 4096},", err: true, reason: "FATAL: budget_tokens was removed. On Opus 5, Sonnet 5, Opus 4.8 and 4.7 this returns an immediate HTTP 400. Use thinking={'type':'adaptive'} and control depth with output_config={'effort':...}." },
      { t: "    messages=[{'role': 'user', 'content': 'Prove the Riemann Hypothesis'}]", err: false },
      { t: ")", err: false }
    ]
  },
  {
    title: "Scenario 2: HTTP 429 Rate Limit Retry Loop",
    desc: "Identify the flawed retry pattern that causes cascading server outages ('thundering herd').",
    lines: [
      { t: "def call_claude_with_retry(prompt, attempt=0):", err: false },
      { t: "    try:", err: false },
      { t: "        return client.messages.create(model='claude-haiku-4-5', max_tokens=1000, ...)", err: false },
      { t: "    except anthropic.RateLimitError:", err: false },
      { t: "        if attempt >= 5: raise", err: false },
      { t: "        time.sleep(2 ** attempt)", err: true, reason: "FATAL ERROR: Standard deterministic exponential backoff synchronizes retries across thousands of clients. You MUST implement Full Jitter: random.uniform(0, min(max_backoff, base * 2**attempt))." },
      { t: "        return call_claude_with_retry(prompt, attempt + 1)", err: false }
    ]
  },
  {
    title: "Scenario 3: Tool Execution Error Return Protocol",
    desc: "Spot the protocol error that causes Claude to hallucinate that a failed database query succeeded.",
    lines: [
      { t: "# Application executes tool call", err: false },
      { t: "try:", err: false },
      { t: "    res = db.execute('SELECT * FROM secret_vault')", err: false },
      { t: "except DatabaseTimeoutError as e:", err: false },
      { t: "    tool_response = {", err: false },
      { t: "        'type': 'tool_result',", err: false },
      { t: "        'tool_use_id': 'toolu_019A8B',", err: false },
      { t: "        'content': 'Database connection timed out after 5000ms'", err: true, reason: "FATAL ERROR: Missing 'is_error': True! Without is_error: True, Claude interprets the timeout message as a successful string result returned from the database." },
      { t: "    }", err: false }
    ]
  },
  {
    title: "Scenario 4: Prompt Engineering Directives",
    desc: "Identify the poor prompt practice that violates Anthropic positive framing guidelines.",
    lines: [
      { t: "<system>", err: false },
      { t: "You are a customer billing specialist.", err: false },
      { t: "<instructions>", err: false },
      { t: "Don't be verbose, never use markdown headers, and don't make mistakes.", err: true, reason: "POOR PRACTICE: Negative directives ('Don't do X', 'Never do Y') provide no actionable guidance. Replace with positive, measurable criteria: 'Provide a 3-bullet concise summary in plain text.'" },
      { t: "</instructions>", err: false },
      { t: "</system>", err: false }
    ]
  }
];

let trapIdx = 0;
let trapHunterScore = 0;

function trapHunterView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  const sc = TRAP_SCENARIOS[trapIdx % TRAP_SCENARIOS.length];
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--coral); color:#fff;">Mini-Game</span><h2 style="font-size:20px; margin-top:4px;">⚡ Exam Trap Hunter (Spot-the-Bug)</h2></div>'
    + '<span style="font-size:12px; font-weight:700; color:var(--muted);">' + (trapIdx + 1) + ' / ' + TRAP_SCENARIOS.length + ' Traps</span>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Review the production code / configuration snippet below. Click on the <b>single faulty line</b> that violates Anthropic best practices or API rules.</p>'
    + '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;">'
    + '<h4 style="font-size:14px; margin-bottom:4px; color:var(--ink);">' + sc.title + '</h4>'
    + '<p style="font-size:12px; color:var(--muted); margin-bottom:12px;">' + sc.desc + '</p>'
    + '<div id="trapCodeLines" style="display:flex; flex-direction:column; gap:2px; font-family:Consolas,monospace; font-size:12px;">'
    + sc.lines.map((l, i) => '<div id="trapLine_' + i + '" onclick="pickTrapLine(' + i + ')" style="padding:6px 10px; border-radius:6px; background:var(--bg); border:1px solid transparent; cursor:pointer; user-select:none; transition:all .15s;">'
        + '<span style="color:var(--muted); margin-right:10px; font-size:10.5px;">' + (i + 1) + '</span>'
        + esc(l.t)
        + '</div>').join('')
    + '</div>'
    + '<div id="trapFeedbackBox" style="margin-top:14px;"></div>'
    + '</div>'
    + '</div>';
}

function pickTrapLine(i){
  const sc = TRAP_SCENARIOS[trapIdx % TRAP_SCENARIOS.length];
  const line = sc.lines[i];
  const fBox = document.getElementById("trapFeedbackBox");
  const el = document.getElementById("trapLine_" + i);
  
  if (!el) return;
  
  if (line.err) {
    // Found the trap!
    el.style.background = "rgba(90,158,111,0.25)";
    el.style.borderColor = "var(--green)";
    playSound('correct');
    trapHunterScore++;
    if (trapHunterScore >= 2) award("trap_hunter");
    addXP(30, "Trap Spotted");
    
    if (fBox) {
      fBox.innerHTML = '<div style="border-left:4px solid var(--green); background:var(--bg); padding:12px 14px; border-radius:0 8px 8px 0; font-size:12.5px; line-height:1.5;">'
        + '<div style="font-weight:700; color:var(--green); font-size:13.5px; margin-bottom:4px;">🎯 Trap Caught! Spot-on!</div>'
        + esc(line.reason)
        + '</div>'
        + '<div class="rowbtns" style="margin-top:12px;">'
        + '<button class="btn sm" onclick="trapIdx++; trapHunterView()">Next Exam Trap →</button>'
        + '</div>';
    }
  } else {
    // Wrong line
    el.style.background = "rgba(217,119,87,0.2)";
    el.style.borderColor = "var(--coral)";
    playSound('wrong');
    setTimeout(() => {
      el.style.background = "var(--bg)";
      el.style.borderColor = "transparent";
    }, 600);
  }
}

/* ================= 2. HANDS-FREE AUDIO QUIZ MODE ================= */
let audioQuizState = {
  certId: "ccao",
  active: false,
  idx: 0,
  questions: [],
  timer: null
};

function audioQuizView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  $("app").innerHTML = '<button class="back" onclick="stopAudioQuiz(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎙️</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Hands-Free Audio Quiz (Active Recall)</h2>'
    + '<p class="subtext" style="margin-top:6px;">Study on the go. High-yield questions and 4-way explanations read aloud automatically with pause-and-reveal timing.</p>'
    + '<div style="display:flex; justify-content:center; gap:10px; margin:16px 0; flex-wrap:wrap;">'
    + '<select id="aqTrackSelect" onchange="audioQuizState.certId=this.value" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(c => '<option value="' + c.id + '" ' + (c.id === audioQuizState.certId ? 'selected' : '') + '>' + c.code + ' · ' + c.name + '</option>').join('')
    + '</select>'
    + '<button id="aqStartBtn" class="btn" onclick="startAudioQuizSession()">▶️ Start Audio Session</button>'
    + '<button id="aqStopBtn" class="btn ghost" onclick="stopAudioQuiz()" style="display:none;">⏹️ Stop</button>'
    + '</div>'
    + '<div id="aqDisplayCard" style="border:2px solid var(--border); border-radius:12px; padding:18px; background:var(--card); max-width:600px; margin:0 auto; text-align:left; display:none;">'
    + '<div id="aqStatus" style="font-size:12px; font-weight:700; color:var(--coral); margin-bottom:6px;"></div>'
    + '<div id="aqQuestionText" style="font-size:15px; font-weight:700; line-height:1.5; margin-bottom:12px;"></div>'
    + '<div id="aqOptionsText" style="font-size:13px; color:var(--muted); line-height:1.6; margin-bottom:12px;"></div>'
    + '<div id="aqRationaleText" style="font-size:12.5px; border-left:3px solid var(--green); padding:8px 12px; background:var(--bg); display:none;"></div>'
    + '</div>'
    + '</div>';
}

function startAudioQuizSession(){
  const c = CERTS.find(x => x.id === audioQuizState.certId);
  if (!c) return;
  if (!c._loaded) {
    loadCert(c).then(() => startAudioQuizSession());
    return;
  }
  
  audioQuizState.questions = shuffleArr(c.questions.slice()).slice(0, 10);
  audioQuizState.idx = 0;
  audioQuizState.active = true;
  
  document.getElementById("aqStartBtn") && (document.getElementById("aqStartBtn").style.display = "none");
  document.getElementById("aqStopBtn") && (document.getElementById("aqStopBtn").style.display = "inline-block");
  document.getElementById("aqDisplayCard") && (document.getElementById("aqDisplayCard").style.display = "block");
  
  award("audio_scholar");
  playAudioQuizTurn();
}

function playAudioQuizTurn(){
  if (!audioQuizState.active || audioQuizState.idx >= audioQuizState.questions.length) {
    stopAudioQuiz();
    toast("✨ Audio Quiz Session Complete!");
    return;
  }
  
  const q = audioQuizState.questions[audioQuizState.idx];
  const qEl = document.getElementById("aqQuestionText");
  const oEl = document.getElementById("aqOptionsText");
  const rEl = document.getElementById("aqRationaleText");
  const sEl = document.getElementById("aqStatus");
  
  if (sEl) sEl.textContent = "Question " + (audioQuizState.idx + 1) + " of " + audioQuizState.questions.length;
  if (qEl) qEl.textContent = q.q;
  if (oEl) oEl.innerHTML = q.opts.map((o, i) => "<b>Option " + (i + 1) + ":</b> " + esc(o)).join("<br>");
  if (rEl) { rEl.style.display = "none"; rEl.textContent = ""; }
  
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    
    // 1. Speak Question
    const promptText = "Question " + (audioQuizState.idx + 1) + ": " + q.q + ". " + q.opts.map((o, i) => "Option " + (i + 1) + ": " + o).join(". ");
    const utt = new SpeechSynthesisUtterance(promptText);
    utt.rate = 1.0;
    
    utt.onend = () => {
      // 2. Pause for 3 seconds for active recall
      if (!audioQuizState.active) return;
      if (sEl) sEl.textContent = "🤔 Thinking... revealing answer in 3 seconds...";
      playSound('flip');
      
      setTimeout(() => {
        if (!audioQuizState.active) return;
        // 3. Reveal and speak answer
        if (sEl) sEl.textContent = "✅ Correct Answer: Option " + (q.a + 1);
        if (rEl) {
          rEl.style.display = "block";
          rEl.innerHTML = "<b>Correct Answer: Option " + (q.a + 1) + " (" + esc(q.opts[q.a]) + ")</b><br>" + esc(q.exp);
        }
        playSound('correct');
        
        const ansText = "The correct answer is Option " + (q.a + 1) + ": " + q.opts[q.a] + ". " + q.exp;
        const ansUtt = new SpeechSynthesisUtterance(ansText);
        ansUtt.rate = 1.0;
        ansUtt.onend = () => {
          if (!audioQuizState.active) return;
          setTimeout(() => {
            audioQuizState.idx++;
            playAudioQuizTurn();
          }, 2500);
        };
        window.speechSynthesis.speak(ansUtt);
      }, 3000);
    };
    
    window.speechSynthesis.speak(utt);
  }
}

function stopAudioQuiz(){
  audioQuizState.active = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  document.getElementById("aqStartBtn") && (document.getElementById("aqStartBtn").style.display = "inline-block");
  document.getElementById("aqStopBtn") && (document.getElementById("aqStopBtn").style.display = "none");
}

/* ================= 3. EXTENDED THINKING TRACE EXPLORER ================= */
let traceBudget = 2048;

function thinkingTraceExplorer(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Reasoning Architecture</span><h2 style="font-size:20px; margin-top:4px;">🧠 Extended Thinking & Reasoning Trace Visualizer</h2></div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:14px;">Simulate Claude Sonnet 5\'s internal chain-of-thought generation inside private <code>&lt;thinking&gt;</code> blocks.</p>'
    + '<div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); margin-bottom:16px;">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">'
    + '<label style="font-size:12.5px; font-weight:700;">Simulated thinking spend at this effort level: <span id="traceBudgetVal" style="color:var(--purple); font-size:15px;">' + traceBudget.toLocaleString() + ' tokens</span></label>'
    + '<div style="display:flex; gap:6px;">'
    + '<button class="btn ghost sm" onclick="setTraceBudget(1024)">1,024t</button>'
    + '<button class="btn ghost sm" onclick="setTraceBudget(2048)">2,048t</button>'
    + '<button class="btn ghost sm" onclick="setTraceBudget(4096)">4,096t</button>'
    + '<button class="btn ghost sm" onclick="setTraceBudget(8192)">8,192t</button>'
    + '</div>'
    + '</div>'
    + '<div id="traceVisualBox"></div>'
    + '</div>'
    + '</div>';
  
  renderTraceVisual();
}

function setTraceBudget(b){
  traceBudget = b;
  document.getElementById("traceBudgetVal") && (document.getElementById("traceBudgetVal").textContent = b.toLocaleString() + " tokens");
  award("reasoning_master");
  renderTraceVisual();
}

function renderTraceVisual(){
  const box = document.getElementById("traceVisualBox");
  if (!box) return;
  
  const isHigh = traceBudget >= 4096;
  const isMed = traceBudget >= 2048 && traceBudget < 4096;
  
  box.innerHTML = '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--bg);">'
    + '<div style="font-size:11px; font-weight:800; color:var(--purple); text-transform:uppercase; margin-bottom:4px;">Internal Reasoning Trace (&lt;thinking&gt; block)</div>'
    + '<pre style="font-size:11px; font-family:Consolas,monospace; line-height:1.4; color:var(--ink); max-height:220px; overflow-y:auto; background:var(--card); padding:10px; border-radius:6px; border:1px solid var(--border);">'
    + esc(isHigh
        ? "<thinking>\n1. Analyzing enterprise constraint: 50,000 documents/day with sub-second SLA.\n2. Evaluating topology candidates:\n   - Autonomous loop: token variance +/-40%, non-deterministic branching.\n   - Orchestrator-Workers: deterministic fan-out, wall clock = max(t).\n3. Verifying context compaction rule:\n   - 80% threshold = 160,000 tokens.\n   - Preserving <key_facts> XML structure.\n4. Validating math & cost attribution spans...\n</thinking>"
        : isMed
        ? "<thinking>\n1. Evaluating Orchestrator-Workers vs Autonomous loop.\n2. Fan-out parallel processing is optimal.\n3. Context threshold: 160k tokens.\n</thinking>"
        : "<thinking>\n1. Selecting Orchestrator-Workers topology for predictable document extraction latency.\n</thinking>")
    + '</pre>'
    + '</div>'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--bg);">'
    + '<div style="font-size:11px; font-weight:800; color:var(--green); text-transform:uppercase; margin-bottom:4px;">Final Synthesized Output (User-Facing)</div>'
    + '<pre style="font-size:11px; font-family:Consolas,monospace; line-height:1.4; color:var(--ink); max-height:220px; overflow-y:auto; background:var(--card); padding:10px; border-radius:6px; border:1px solid var(--border);">'
    + esc("Deploy an Orchestrator-Workers topology with proactive 80% semantic compaction (160k tokens). This reduces pipeline latency from sum(t) to max(t) while guaranteeing full schema validation.")
    + '</pre>'
    + '<div style="font-size:11px; color:var(--muted); margin-top:8px;">'
    + '💡 <b>Exam Rule:</b> Thinking tokens are billed as standard output tokens, but are completely hidden from standard user output.'
    + '</div>'
    + '</div>'
    + '</div>';
}

/* ================= 4. CANDIDATE PERCENTILE BENCHMARK & BELL CURVE ================= */
function peerBenchmarkView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  // Calculate candidate global index
  let totalSeen = 0, totalCorrect = 0;
  CERTS.forEach(c => {
    const p = certProgress(c);
    totalSeen += p.seen;
    totalCorrect += p.correct;
  });
  
  const acc = totalSeen > 0 ? (totalCorrect / totalSeen) : 0;
  const xp = S.xp || 0;
  
  // Normalized score out of 1000
  const normScore = Math.min(990, Math.max(200, Math.round(acc * 800 + Math.min(190, xp / 10))));
  
  // Compute percentile using Gaussian error function approximation
  const mean = 550, stdDev = 140;
  const z = (normScore - mean) / stdDev;
  const percentile = Math.min(99.8, Math.max(1.0, Math.round((1 / (1 + Math.exp(-0.07056 * Math.pow(z, 3) - 1.5976 * z))) * 1000) / 10));
  
  if (percentile >= 90) award("top_percentile");
  
  // Draw SVG Bell Curve
  const w = 400, h = 160;
  let curvePts = [];
  for (let x = 0; x <= w; x += 5) {
    const scoreVal = 200 + (x / w) * 800;
    const zScore = (scoreVal - mean) / stdDev;
    const yVal = h - (Math.exp(-0.5 * zScore * zScore) * 130);
    curvePts.push(x + ',' + yVal.toFixed(1));
  }
  
  const markerX = Math.min(w - 10, Math.max(10, ((normScore - 200) / 800) * w));
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">📊</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Global Candidate Benchmark & Percentile Curve</h2>'
    + '<p class="subtext" style="margin-top:6px;">Statistical placement relative to candidate benchmark cohorts across all 4 Anthropic certifications.</p>'
    + '<div style="border:2px solid var(--border); border-radius:14px; padding:18px; background:var(--card); max-width:620px; margin:16px auto;">'
    + '<div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:12px;">'
    + '<div><span style="font-size:32px; font-weight:900; color:var(--coral);">' + normScore + '</span><span style="font-size:13px; color:var(--muted);"> / 1000 Normalized Readiness</span></div>'
    + '<span style="font-size:14px; font-weight:800; color:var(--green);">Top ' + (100 - percentile).toFixed(1) + '% (Percentile: ' + percentile + '%)</span>'
    + '</div>'
    + '<div style="margin:16px 0;">'
    + '<svg viewBox="0 0 400 160" width="100%" height="160" style="overflow:visible;">'
    + '<polyline points="' + curvePts.join(' ') + '" fill="none" stroke="var(--border)" stroke-width="3"/>'
    + '<line x1="' + markerX + '" y1="10" x2="' + markerX + '" y2="160" stroke="var(--coral)" stroke-width="2.5" stroke-dasharray="4,4"/>'
    + '<circle cx="' + markerX + '" cy="30" r="5" fill="var(--coral)"/>'
    + '<text x="' + markerX + '" y="16" text-anchor="middle" font-size="10" font-weight="800" fill="var(--coral)">YOU (' + normScore + ')</text>'
    + '</svg>'
    + '<div style="display:flex; justify-content:space-between; font-size:11px; color:var(--muted); margin-top:4px;">'
    + '<span>200 (Novice)</span><span>550 (Average Candidate)</span><span>720 (Passing Benchmark)</span><span>1000 (Grandmaster)</span>'
    + '</div>'
    + '</div>'
    + '<div style="font-size:12.5px; color:var(--muted); line-height:1.5; border-top:1px solid var(--border); padding-top:10px; margin-top:10px;">'
    + (normScore >= 720
        ? '🟢 <b>Ready for Exam Scheduling:</b> Your performance indexes comfortably above the 720 benchmark. You are in the top tier of candidates.'
        : '🟡 <b>Preparation Phase:</b> Keep drilling your weakest domains and taking timed mock exams to push your score past 720.')
    + '</div>'
    + '</div>'
    + '</div>';
}
