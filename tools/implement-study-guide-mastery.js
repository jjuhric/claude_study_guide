const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const isCRLF = html.includes('\r\n');
if (isCRLF) html = html.replace(/\r\n/g, '\n');

// 1. Add CSS for reading progress, notes, TOC, audio player, decision tree, RAG visualizer
const newStyles = `
  /* Reading Progress Line */
  #readingProgressBar{position:fixed; top:0; left:0; height:4px; background:linear-gradient(90deg, var(--coral), var(--gold)); width:0%; z-index:999; transition:width .1s linear;}

  /* In-Lesson Table of Contents */
  .lesson-toc{display:flex; flex-wrap:wrap; gap:8px; background:var(--card); border:1px solid var(--border); border-radius:12px; padding:10px 14px; margin:12px 0 18px;}
  .toc-title{font-size:11.5px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); width:100%; margin-bottom:2px;}
  .toc-pill{background:var(--bg); border:1px solid var(--border); border-radius:20px; padding:4px 10px; font-size:12px; color:var(--ink); text-decoration:none; cursor:pointer; transition:all .15s;}
  .toc-pill:hover{border-color:var(--coral); color:var(--coral);}

  /* In-Lesson Study Tools Bar */
  .lesson-tools-bar{display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; background:rgba(0,0,0,.03); border:1px dashed var(--border); border-radius:12px; padding:8px 12px; margin-bottom:14px;}
  [data-theme="dark"] .lesson-tools-bar{background:rgba(255,255,255,.03);}
  .audio-player{display:inline-flex; align-items:center; gap:6px;}
  .audio-btn{background:var(--card); border:1px solid var(--border); border-radius:8px; padding:5px 10px; font-size:12px; cursor:pointer; font-family:inherit; color:var(--ink); display:inline-flex; align-items:center; gap:4px;}
  .audio-btn:hover{border-color:var(--coral); color:var(--coral);}
  .audio-btn.playing{background:var(--coral); color:#fff; border-color:var(--coral);}

  /* Study Notes Drawer */
  .notes-drawer{background:var(--card); border:2px solid var(--gold); border-radius:12px; padding:12px 14px; margin:12px 0; display:none;}
  .notes-drawer.open{display:block;}
  .notes-drawer textarea{width:100%; height:90px; padding:8px 10px; border:1px solid var(--border); border-radius:8px; font-size:13px; font-family:inherit; background:var(--bg); color:var(--ink); resize:vertical;}

  /* Decision Trees & RAG Visualizer */
  .tree-card{background:var(--card); border:2px solid var(--border); border-radius:14px; padding:16px; margin:16px 0;}
  .tree-step{background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:10px;}
  .tree-opt{display:inline-block; margin:4px; padding:6px 12px; border:1px solid var(--border); border-radius:8px; cursor:pointer; background:var(--card); font-size:12.5px; transition:all .15s;}
  .tree-opt:hover{border-color:var(--coral); color:var(--coral);}
  .tree-opt.active{background:var(--coral); color:#fff; border-color:var(--coral); font-weight:700;}
  .tree-result{background:rgba(90,158,111,.12); border-left:4px solid var(--green); border-radius:0 10px 10px 0; padding:12px; margin-top:12px;}

  .rag-chunk{border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px; background:var(--card); font-family:monospace; font-size:12px; line-height:1.5;}
  .rag-overlap{background:rgba(232,180,72,.35); font-weight:700; border-radius:3px; padding:0 2px;}

  /* Printable Handbook */
  @media print{
    .handbook-page{break-after:page; page-break-after:always; margin-bottom:30px;}
  }
`;

if (!html.includes('#readingProgressBar')) {
  html = html.replace('/* Print Styles */', newStyles + '\n  /* Print Styles */');
}

// 2. Add #readingProgressBar to DOM right under <body>
if (!html.includes('id="readingProgressBar"')) {
  html = html.replace('<body>', '<body>\n<div id="readingProgressBar"></div>');
}

// 3. Update S_DEFAULTS with notes and bookmarks
if (!html.includes('notes:{}')) {
  html = html.replace(
    'theme:"auto", sound:false, customDecks:[]',
    'theme:"auto", sound:false, customDecks:[], notes:{}, bookmarks:[]'
  );
}

// 4. Implement all new JavaScript functions before the end of the script block
const newJs = `
/* ================= READING PROGRESS SCROLL ================= */
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('readingProgressBar');
    if (!bar) return;
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (h > 0) {
      const pct = Math.min(100, Math.max(0, (window.scrollY / h) * 100));
      bar.style.width = pct + '%';
    } else {
      bar.style.width = '0%';
    }
  });
}

/* ================= WEB SPEECH AUDIO LESSON NARRATOR ================= */
let ttsUtterance = null;
let ttsSpeed = 1.0;
let ttsIsPlaying = false;

function ttsCleanText(htmlStr){
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  // remove code blocks and script tags from spoken text
  div.querySelectorAll("pre, code, script, style, .widget-box, .sim-terminal").forEach(el => el.remove());
  return div.innerText || div.textContent || "";
}

function ttsPlayLesson(id, i){
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    toast("Speech synthesis not supported in this browser");
    return;
  }
  const c = CERTS.find(x => x.id === id);
  if (!c || !c.lessons || !c.lessons[i]) return;
  const les = c.lessons[i];
  
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    ttsIsPlaying = true;
    updateAudioControlsUI(true);
    return;
  }
  
  window.speechSynthesis.cancel();
  const text = les.h + ". " + ttsCleanText(les.b);
  ttsUtterance = new SpeechSynthesisUtterance(text);
  ttsUtterance.rate = ttsSpeed;
  
  ttsUtterance.onend = () => {
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
  };
  ttsUtterance.onerror = () => {
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
  };
  
  window.speechSynthesis.speak(ttsUtterance);
  ttsIsPlaying = true;
  updateAudioControlsUI(true);
  toast("🎧 Playing audio lesson (" + ttsSpeed + "x)");
}

function ttsPause(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
    toast("Audio paused");
  }
}

function ttsStop(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
  }
}

function ttsSetSpeed(speed){
  ttsSpeed = parseFloat(speed) || 1.0;
  if (ttsIsPlaying && ttsUtterance) {
    // restart with new speed
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      ttsUtterance.rate = ttsSpeed;
      window.speechSynthesis.speak(ttsUtterance);
    }
  }
  toast("Audio speed: " + ttsSpeed + "x");
}

function updateAudioControlsUI(playing){
  const playBtn = document.getElementById("ttsPlayBtn");
  if (playBtn) {
    if (playing) {
      playBtn.classList.add("playing");
      playBtn.innerHTML = "⏸️ Pause";
      playBtn.onclick = () => ttsPause();
    } else {
      playBtn.classList.remove("playing");
      playBtn.innerHTML = "▶️ Listen";
      playBtn.onclick = () => {
        const id = playBtn.getAttribute("data-cert");
        const idx = parseInt(playBtn.getAttribute("data-idx"), 10);
        ttsPlayLesson(id, idx);
      };
    }
  }
}

/* ================= BOOKMARKS & PERSONAL STUDY NOTES ================= */
function getLessonKey(id, i){ return id + "_l_" + i; }

function toggleBookmark(id, i){
  const key = getLessonKey(id, i);
  S.bookmarks = S.bookmarks || [];
  const at = S.bookmarks.indexOf(key);
  if (at >= 0) {
    S.bookmarks.splice(at, 1);
    toast("Bookmark removed");
  } else {
    S.bookmarks.push(key);
    toast("📌 Lesson bookmarked!");
  }
  save();
  const bmBtn = document.getElementById("bmBtn");
  if (bmBtn) {
    const isBm = S.bookmarks.includes(key);
    bmBtn.innerHTML = isBm ? "📌 Bookmarked" : "🔖 Bookmark";
    if (isBm) bmBtn.classList.add("flagon"); else bmBtn.classList.remove("flagon");
  }
}

function toggleNotesDrawer(id, i){
  const drawer = document.getElementById("notesDrawer");
  if (drawer) {
    drawer.classList.toggle("open");
    if (drawer.classList.contains("open")) {
      const ta = document.getElementById("noteInput");
      if (ta) ta.focus();
    }
  }
}

function saveLessonNote(id, i, txt){
  const key = getLessonKey(id, i);
  S.notes = S.notes || {};
  if (!txt || !txt.trim()) {
    delete S.notes[key];
  } else {
    S.notes[key] = txt;
  }
  save();
  const noteStatus = document.getElementById("noteSaveStatus");
  if (noteStatus) {
    noteStatus.textContent = "Saved to local storage ✓";
    setTimeout(() => { if (noteStatus) noteStatus.textContent = ""; }, 2000);
  }
}

function notesView(){
  renderHeader();
  let list = '';
  const notes = S.notes || {};
  const bms = S.bookmarks || [];
  
  const allKeys = Array.from(new Set([...Object.keys(notes), ...bms]));
  
  if (!allKeys.length) {
    $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
      + '<div class="panel center"><div style="font-size:38px;">📝</div>'
      + '<h2 style="font-size:19px; margin-top:8px;">No Study Notes or Bookmarks Yet</h2>'
      + '<p class="subtext" style="margin-top:6px;">While reading any lesson, click <b>🔖 Bookmark</b> or <b>📝 Study Note</b> to save takeaways here.</p>'
      + '<div class="rowbtns" style="justify-content:center; margin-top:14px;"><button class="btn" onclick="home()">Browse Certifications</button></div></div>';
    return;
  }
  
  allKeys.forEach(k => {
    const parts = k.split("_l_");
    const certId = parts[0];
    const lidx = parseInt(parts[1], 10);
    const c = CERTS.find(x => x.id === certId);
    if (!c) return;
    const les = c.lessons && c.lessons[lidx];
    const title = les ? les.h : ('Lesson ' + lidx);
    const noteTxt = notes[k] || '';
    const isBm = bms.includes(k);
    
    list += '<div class="panel" style="margin-bottom:14px;">'
      + '<div style="display:flex; justify-content:space-between; align-items:center;">'
      + '<div><span class="ltag">' + c.code + ' · Lesson ' + lidx + '</span>'
      + '<h3 style="font-size:15px; margin-top:4px;">' + esc(title) + '</h3></div>'
      + '<div><button class="btn ghost sm" onclick="lessonView(\\'' + certId + '\\',' + lidx + ')">Open Lesson →</button></div>'
      + '</div>'
      + (isBm ? '<div style="font-size:11.5px; color:var(--coral); font-weight:700; margin-top:6px;">📌 Bookmarked</div>' : '')
      + (noteTxt ? '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px; margin-top:10px; font-size:13px; font-family:inherit;"><b>My Notes:</b><br>' + esc(noteTxt).replace(/\\n/g, '<br>') + '</div>' : '')
      + '</div>';
  });
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel"><h2 style="font-size:19px; margin-bottom:6px;">📝 My Study Notes & Bookmarks</h2>'
    + '<p class="subtext">Personal notes and bookmarked lessons stored locally.</p></div>'
    + list;
}

/* ================= INTERACTIVE DECISION TREES ================= */
function renderModelDecisionTree(){
  return \`
    <div class="widget-box" id="modelDecisionTreeWidget">
      <h5>🌳 Interactive Model Selection Decision Tree</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Answer 3 quick questions to determine the optimal Anthropic model and API cost strategy:</p>
      
      <div class="tree-step">
        <label><b>1. Task Primary Constraint:</b></label>
        <div id="treeQ1">
          <span class="tree-opt active" onclick="setTreeStep(1, 'speed', this)">⚡ Sub-second Latency / High Volume Classification</span>
          <span class="tree-opt" onclick="setTreeStep(1, 'code', this)">💻 Complex Coding / Vision / Multimodal Reasoning</span>
          <span class="tree-opt" onclick="setTreeStep(1, 'deep', this)">🧠 Maximum Depth Nuance & Synthesis</span>
        </div>
      </div>
      
      <div class="tree-step">
        <label><b>2. Workload Execution Timing:</b></label>
        <div id="treeQ2">
          <span class="tree-opt active" onclick="setTreeStep(2, 'sync', this)">⚡ Real-Time Synchronous (Live Chat / User Waiting)</span>
          <span class="tree-opt" onclick="setTreeStep(2, 'batch', this)">📦 Asynchronous Offline Batch (Within 24h)</span>
        </div>
      </div>
      
      <div class="tree-step">
        <label><b>3. Repeated Static Context:</b></label>
        <div id="treeQ3">
          <span class="tree-opt active" onclick="setTreeStep(3, 'caching', this)">🔄 Yes (Shared System Prompt, FAQ, or Docs > 1,024 tokens)</span>
          <span class="tree-opt" onclick="setTreeStep(3, 'nocache', this)">❌ No (Short or Fully Unique Prompts)</span>
        </div>
      </div>
      
      <div class="tree-result" id="treeModelResult">
        <b>Recommended Architecture:</b> <span style="color:var(--coral-dark); font-weight:700;">Claude 3.5 Haiku + Prompt Caching</span><br>
        <span style="font-size:12.5px; line-height:1.5; color:var(--ink);">
          • <b>Model:</b> Claude 3.5 Haiku ($0.80 / $4.00 per MTok)<br>
          • <b>Optimization:</b> Ephemeral Prompt Caching saves 85% on cached input tokens ($0.08 / MTok read).<br>
          • <b>Key Exam Rationale:</b> Lightweight classification, routing, and high-throughput tagging should always default to Haiku.
        </span>
      </div>
    </div>
  \`;
}

let treeState = { q1: 'speed', q2: 'sync', q3: 'caching' };
function setTreeStep(step, val, el){
  const parent = el.parentElement;
  parent.querySelectorAll('.tree-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  if(step === 1) treeState.q1 = val;
  if(step === 2) treeState.q2 = val;
  if(step === 3) treeState.q3 = val;
  updateTreeModelResult();
}

function updateTreeModelResult(){
  const res = document.getElementById("treeModelResult");
  if(!res) return;
  
  let model = treeState.q1 === 'speed' ? 'Claude 3.5 Haiku' : treeState.q1 === 'code' ? 'Claude 3.5 Sonnet' : 'Claude 3.5 Opus';
  let pricing = treeState.q1 === 'speed' ? '$0.80 / $4.00' : treeState.q1 === 'code' ? '$3.00 / $15.00' : '$15.00 / $75.00';
  let batchStr = treeState.q2 === 'batch' ? ' + Batches API (50% overall discount)' : '';
  let cacheStr = treeState.q3 === 'caching' ? ' + Prompt Caching (85% input discount)' : '';
  
  let rationale = treeState.q1 === 'speed'
    ? 'High-throughput intent routing and lightweight extraction should default to Haiku for sub-second response times.'
    : treeState.q1 === 'code'
    ? 'Sonnet is the premier architectural choice for software engineering, tool calling, and multimodal vision workflows.'
    : 'Opus provides the highest ceiling on complex multi-step reasoning, philosophical analysis, and nuanced synthesis.';
    
  res.innerHTML = '<b>Recommended Architecture:</b> <span style="color:var(--coral-dark); font-weight:700;">' + model + batchStr + cacheStr + '</span><br>'
    + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
    + '• <b>Base Pricing:</b> ' + pricing + ' per MTok<br>'
    + (treeState.q2 === 'batch' ? '• <b>Batches API:</b> 50% discount across input and output tokens.<br>' : '')
    + (treeState.q3 === 'caching' ? '• <b>Prompt Caching:</b> 85% discount on cached prefix reads ($0.08, $0.30, or $1.50/MTok).<br>' : '')
    + '• <b>Exam Rule:</b> ' + rationale
    + '</span>';
}

/* ================= INTERACTIVE ARCHITECTURAL TOPOLOGY TREE ================= */
function renderArchitectureDecisionTree(){
  return \`
    <div class="widget-box" id="archDecisionTreeWidget">
      <h5>🏛️ Interactive Workflow & Agent Topology Selector</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Choose the core characteristics of your workflow:</p>
      
      <div class="tree-step">
        <label><b>1. Task Structure:</b></label>
        <div id="archQ1">
          <span class="tree-opt active" onclick="setArchStep(1, 'seq', this)">Fixed Sequential Steps</span>
          <span class="tree-opt" onclick="setArchStep(1, 'route', this)">Distinct Category Branching</span>
          <span class="tree-opt" onclick="setArchStep(1, 'par', this)">Independent Parallel Subtasks</span>
          <span class="tree-opt" onclick="setArchStep(1, 'eval', this)">Iterative Quality Refinement</span>
          <span class="tree-opt" onclick="setArchStep(1, 'agent', this)">Unknown Multi-Step Tool Exploration</span>
        </div>
      </div>
      
      <div class="tree-result" id="treeArchResult">
        <b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Prompt Chaining / Sequential Pipeline</span><br>
        <span style="font-size:12.5px; line-height:1.5; color:var(--ink);">
          • <b>Implementation:</b> Deterministic state machine where step N passes validated structured output to step N+1.<br>
          • <b>When to use:</b> Document extraction followed by policy check followed by notification drafting.<br>
          • <b>Exam Takeaway:</b> Never use an autonomous agent loop where a predictable sequential pipeline is sufficient.
        </span>
      </div>
    </div>
  \`;
}

function setArchStep(step, val, el){
  const parent = el.parentElement;
  parent.querySelectorAll('.tree-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const res = document.getElementById("treeArchResult");
  if(!res) return;
  
  if(val === 'seq'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Prompt Chaining / Sequential Pipeline</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Deterministic state machine where step N passes validated structured output to step N+1.<br>'
      + '• <b>Exam Rule:</b> Always prefer deterministic pipelines for known business logic to minimize latency and token spend.'
      + '</span>';
  } else if(val === 'route'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Router Pattern (Classifier + Specialists)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Haiku classifies intent -> dispatches to targeted specialist prompt with dedicated toolsets.<br>'
      + '• <b>Exam Rule:</b> Eliminates tool and prompt clutter by keeping specialist prompts small and modular.'
      + '</span>';
  } else if(val === 'par'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Orchestrator-Workers (Parallel Fan-Out)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Central orchestrator decomposes task into N independent worker prompts running in parallel via Promise.all().<br>'
      + '• <b>Exam Rule:</b> Cuts wall-clock latency from sum(t) to max(t).'
      + '</span>';
  } else if(val === 'eval'){
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Evaluator-Optimizer Loop</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Optimizer generates draft -> Evaluator grades against rubric -> Loops until quality threshold or iteration cap.<br>'
      + '• <b>Exam Rule:</b> Enforce hard iteration bounds (max 3-5 passes) to avoid infinite loops.'
      + '</span>';
  } else {
    res.innerHTML = '<b>Selected Pattern:</b> <span style="color:var(--coral-dark); font-weight:700;">Autonomous Agent (Model Context Protocol / Tool Loop)</span><br>'
      + '<span style="font-size:12.5px; line-height:1.5; color:var(--ink);">'
      + '• <b>Implementation:</b> Model iteratively chooses tools, inspects outputs, and reasons toward an open goal.<br>'
      + '• <b>Exam Rule:</b> Requires iteration caps, token spend ceilings, and human-in-the-loop gates for destructive actions.'
      + '</span>';
  }
}

/* ================= INTERACTIVE RAG CHUNKING VISUALIZER ================= */
function renderRagChunkingVisualizer(){
  return \`
    <div class="widget-box" id="ragChunkVisualizer">
      <h5>🔬 Interactive RAG Chunking & Overlap Visualizer</h5>
      <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">Adjust Chunk Size and Overlap to see how text is segmented and contextual headers are injected:</p>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
        <div>
          <label><b>Chunk Size (characters):</b> <span id="chunkSizeVal">300</span></label>
          <input type="range" id="chunkSizeRange" min="150" max="600" step="50" value="300" oninput="updateRagChunks()">
        </div>
        <div>
          <label><b>Chunk Overlap (%):</b> <span id="chunkOverlapVal">20%</span></label>
          <input type="range" id="chunkOverlapRange" min="0" max="40" step="5" value="20" oninput="updateRagChunks()">
        </div>
      </div>
      
      <div id="ragChunkResults"></div>
    </div>
  \`;
}

function updateRagChunks(){
  const szEl = document.getElementById("chunkSizeRange");
  const ovEl = document.getElementById("chunkOverlapRange");
  if(!szEl || !ovEl) return;
  const sz = parseInt(szEl.value, 10);
  const ovPct = parseInt(ovEl.value, 10);
  document.getElementById("chunkSizeVal").textContent = sz;
  document.getElementById("chunkOverlapVal").textContent = ovPct + "%";
  
  const sampleText = "Anthropic's Model Context Protocol (MCP) provides a standardized open architecture for connecting LLMs to external data and tools. By adopting JSON-RPC 2.0 primitives, MCP establishes clean client-server boundaries. Tools provide executable functions, resources deliver structured data, and prompts furnish parameterized templates. When architecting RAG systems, preserving contextual headers and 10% to 20% chunk overlap prevents information fragmentation across chunk splits.";
  
  const ovChars = Math.round(sz * (ovPct / 100));
  const step = Math.max(50, sz - ovChars);
  
  let chunks = [];
  let pos = 0;
  let idx = 0;
  while(pos < sampleText.length && chunks.length < 5){
    const end = Math.min(sampleText.length, pos + sz);
    const body = sampleText.slice(pos, end);
    const prevOverlap = pos > 0 ? sampleText.slice(pos, pos + ovChars) : "";
    const core = pos > 0 ? sampleText.slice(pos + ovChars) : body;
    chunks.push({ idx: idx++, pos, end, prevOverlap, core });
    if(end >= sampleText.length) break;
    pos += step;
  }
  
  let html = '<div style="margin-top:10px;">';
  chunks.forEach(c => {
    html += '<div class="rag-chunk">'
      + '<div style="font-size:11px; color:var(--coral-dark); font-weight:700; margin-bottom:4px;">[Document: MCP Architecture > Section: Overview] · Chunk ' + (c.idx+1) + ' (' + c.pos + '..' + c.end + ')</div>'
      + (c.prevOverlap ? '<span class="rag-overlap" title="Overlapped with previous chunk">' + esc(c.prevOverlap) + '</span>' : '')
      + '<span>' + esc(c.core) + '</span>'
      + '</div>';
  });
  html += '</div>';
  const res = document.getElementById("ragChunkResults");
  if(res) res.innerHTML = html;
}

/* ================= 1-CLICK PRINTABLE FULL STUDY GUIDE HANDBOOK ================= */
function fullHandbookView(id){
  const c = CERTS.find(x => x.id === id);
  if(!c || !c.lessons) return;
  renderHeader();
  
  let lessonsHtml = '';
  c.lessons.forEach((les, idx) => {
    lessonsHtml += '<div class="handbook-page" style="margin-bottom:36px; padding-bottom:24px; border-bottom:2px dashed var(--border);">'
      + '<span class="ltag">' + lessonLabel(c, idx) + ' · ' + c.code + '</span>'
      + '<h2 style="font-size:22px; margin:8px 0 16px;">' + esc(les.h) + '</h2>'
      + '<div class="lesson-body">' + les.b + '</div>'
      + '</div>';
  });
  
  $("app").innerHTML = '<button class="back" onclick="learnList(\\'' + id + '\\')">← Back to Study Guide</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:16px;">'
    + '<div><h1 style="font-size:22px;">📚 ' + c.name + ' (' + c.code + ')</h1>'
    + '<p class="subtext">Full Printable Study Guide Handbook · All ' + c.lessons.length + ' Lessons</p></div>'
    + '<div class="rowbtns"><button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>'
    + '<button class="btn ghost" onclick="cramSheetView(\\'' + id + '\\')">📋 Cram Sheet</button></div>'
    + '</div>'
    + '<div class="handbook-content">' + lessonsHtml + '</div>'
    + '<div class="center" style="margin-top:20px;"><button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button></div>'
    + '</div>';
    
  initLessonWidgets();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
}
`;

if (!html.includes('function ttsPlayLesson')) {
  html = html.replace('function cramSheetSelect(){', newJs + '\nfunction cramSheetSelect(){');
}

// 5. Update learnList to include "Printable Handbook" button
const oldLearnListPanel = `<div class="studybar"><div class="pbar" style="flex:1;"><div style="width:'+lp.pct+'%; background:'+c.color+'"></div></div><span>'+lp.done+'/'+lp.total+' read</span></div>`;
const newLearnListPanel = `<div class="studybar"><div class="pbar" style="flex:1;"><div style="width:'+lp.pct+'%; background:'+c.color+'"></div></div><span>'+lp.done+'/'+lp.total+' read</span></div>`
  + `\\n   +'<div style="display:flex; gap:10px; justify-content:flex-end; margin-bottom:12px;"><button class="btn ghost sm" onclick="fullHandbookView(\\\''+id+'\\\')">📚 Printable Handbook</button><button class="btn ghost sm" onclick="cramSheetView(\\\''+id+'\\\')">📋 Cram Sheet</button></div>'`;

if (html.includes(oldLearnListPanel) && !html.includes('fullHandbookView')) {
  html = html.replace(oldLearnListPanel, newLearnListPanel);
}

// 6. Update lessonView to include TOC, Audio Player, Bookmarks, and Notes
const oldLessonHdr = `   +'<div class="panel"><div class="lesson-hdr"><span class="ltag">'+lessonLabel(c,i)+' · '+c.code+'</span></div>'
   +'<h2 style="font-size:19px; margin-bottom:12px;">'+esc(les.h)+'</h2>'
   +'<div class="lesson-body">'+les.b+'</div>'`;

const newLessonHdr = `   +'<div class="panel">'
   +'<div class="lesson-tools-bar">'
   +'<div class="audio-player">'
   +'<button id="ttsPlayBtn" class="audio-btn" data-cert="'+id+'" data-idx="'+i+'" onclick="ttsPlayLesson(\\''+id+'\\','+i+')">▶️ Listen</button>'
   +'<select class="audio-btn" onchange="ttsSetSpeed(this.value)" style="padding:4px 6px;" aria-label="Audio Speed">'
   +'<option value="1.0">1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option>'
   +'</select>'
   +'</div>'
   +'<div style="display:inline-flex; gap:6px;">'
   +'<button id="bmBtn" class="btn ghost sm'+((S.bookmarks||[]).includes(getLessonKey(id,i))?' flagon':'')+'" onclick="toggleBookmark(\\''+id+'\\','+i+')">'
   +((S.bookmarks||[]).includes(getLessonKey(id,i))?'📌 Bookmarked':'🔖 Bookmark')+'</button>'
   +'<button class="btn ghost sm" onclick="toggleNotesDrawer(\\''+id+'\\','+i+')">📝 My Note</button>'
   +'</div></div>'
   +'<div id="notesDrawer" class="notes-drawer">'
   +'<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">'
   +'<label style="font-size:12px; font-weight:700; color:var(--coral-dark);">📝 Personal Study Notes (Auto-saved):</label>'
   +'<span id="noteSaveStatus" style="font-size:11px; color:var(--green); font-weight:700;"></span></div>'
   +'<textarea id="noteInput" placeholder="Type key takeaways, mnemonics, or tricky traps..." oninput="saveLessonNote(\\''+id+'\\','+i+',this.value)">'+esc((S.notes||{})[getLessonKey(id,i)]||'')+'</textarea>'
   +'</div>'
   +'<div class="lesson-hdr"><span class="ltag">'+lessonLabel(c,i)+' · '+c.code+'</span></div>'
   +'<h2 style="font-size:19px; margin-bottom:8px;">'+esc(les.h)+'</h2>'
   +'<div class="lesson-toc">'
   +'<span class="toc-title">⚡ Quick Jump In This Lesson:</span>'
   +'<span class="toc-pill" onclick="document.querySelector(\\'.lesson-body\\').scrollIntoView({behavior:\\'smooth\\'})">📌 Overview</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\\'.callout, .code-wrapper, table\\')||document.querySelector(\\'.lesson-body\\')).scrollIntoView({behavior:\\'smooth\\'})">🏛️ Core Concepts</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\\'.warn, .exambox\\')||document.querySelector(\\'.takeaways\\')).scrollIntoView({behavior:\\'smooth\\'})">⚠️ Exam Traps</span>'
   +'<span class="toc-pill" onclick="(document.querySelector(\\'.takeaways\\')||document.querySelector(\\'.rowbtns\\')).scrollIntoView({behavior:\\'smooth\\'})">📋 Takeaways</span>'
   +'</div>'
   +'<div class="lesson-body">'+les.b+'</div>'`;

if (html.includes(oldLessonHdr)) {
  html = html.replace(oldLessonHdr, newLessonHdr);
}

// 7. Add Notes & Bookmarks button to Home screen buttons
const oldHomeBtns = `    +'<button class="btn ghost" onclick="analyticsView()">📊 Analytics</button>'`;
const newHomeBtns = `    +'<button class="btn ghost" onclick="notesView()">📝 Notes & Bookmarks ('+Object.keys(S.notes||{}).length+')</button>'
    +'<button class="btn ghost" onclick="analyticsView()">📊 Analytics</button>'`;

if (html.includes(oldHomeBtns) && !html.includes('notesView()')) {
  html = html.replace(oldHomeBtns, newHomeBtns);
}

// Validate JS syntax with vm
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  new vm.Script(match[1]);
  console.log('Script block 0 verified valid JS syntax!');
}

if (isCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully injected all Study Guide mastery enhancements into index.html');
