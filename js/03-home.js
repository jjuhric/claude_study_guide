/* 03-home.js
   Dashboard, tool registry, cert view
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= SCREENS ================= */
/* Totals come from the manifest so the home screen is accurate before a
   certification's content has been fetched. */
function totalQs(c){ return c._loaded ? c.questions.length : ((c.counts&&c.counts.questions)||0); }
function totalLessons(c){ return c._loaded ? c.lessons.length : ((c.counts&&c.counts.lessons)||0); }
function certProgress(c){
  const ans=S.answered[c.id]||{};
  /* Once loaded, count only ids still present, so retired questions cannot
     push "seen" past the size of the bank. */
  const keys=c._loaded ? c.questions.map((q,i)=>qKey(c,i)).filter(k=>k in ans) : Object.keys(ans);
  const seen=keys.length;
  const correct=keys.filter(k=>ans[k]).length;
  const total=totalQs(c);
  return {seen, correct, total, pct: total?Math.round(seen/total*100):0,
          acc: seen?Math.round(correct/seen*100):0};
}
/* ================= TOOL REGISTRY =================
   Every tool reachable from the dashboard is declared here rather than
   hand-written into home(). 43 tools previously existed as callable functions
   with no UI entry point at all; the test suite now fails if a zero-argument
   tool view is missing from this list. */
const TOOL_GROUPS = [
  {id:"labs",        name:"🧪 Labs &amp; Simulators",            desc:"Hands-on sandboxes, protocol runners, and interactive simulators."},
  {id:"practice",    name:"⚔️ Practice &amp; Testing",            desc:"Timed modes, adaptive battles, and custom exam construction."},
  {id:"diagnostics", name:"📊 Diagnostics &amp; Analytics",       desc:"Where you actually stand, and what to fix next."},
  {id:"reference",   name:"📚 Reference &amp; Study Aids",        desc:"Cheat sheets, explorers, maps, and calculators."},
  {id:"audio",       name:"🎧 Audio &amp; Voice",                 desc:"Hands-free study for commutes and revision."},
  {id:"share",       name:"🏅 Credentials, Sync &amp; Community", desc:"Diplomas, badges, cross-device sync, and leaderboards."},
];
const TOOLS = [
  {fn:"promptStudioView",        em:"🧪", name:"Golden Prompt Studio",         desc:"Live XML linter, positive framing check &amp; token budget advisor.", cta:"Open Studio",        g:"labs"},
  {fn:"sdkPlaygroundView",       em:"💻", name:"SDK Code Playground",          desc:"Python &amp; TypeScript SDK generator with caching &amp; thinking.", cta:"Generate Code",      g:"labs"},
  {fn:"mcpWorkbenchView",        em:"🔌", name:"MCP Protocol Inspector",       desc:"Step through JSON-RPC 2.0 tool execution loops.",                    cta:"Inspect Protocol",   g:"labs"},
  {fn:"apiErrorSimulator",       em:"🚨", name:"API Error Simulator",          desc:"Trigger and diagnose real API failure modes interactively.",         cta:"Simulate Errors",    g:"labs"},
  {fn:"apiPayloadInspector",     em:"📡", name:"API Payload Inspector",        desc:"Live request and response viewer for Messages API calls.",           cta:"Inspect Payloads",   g:"labs"},
  {fn:"cacheTTLSimulator",       em:"⏳", name:"Prompt Caching TTL Simulator", desc:"Watch cache prefixes expire and see what it costs.",                 cta:"Run Simulator",      g:"labs"},
  {fn:"consensusVotingView",     em:"🗳️", name:"Consensus Voting Engine",      desc:"Multi-model voting and LLM-as-judge adjudication.",                  cta:"Run Consensus",      g:"labs"},
  {fn:"diagramSandboxView",      em:"🧩", name:"Architecture Sandbox",         desc:"Assemble and validate multi-tier production pipelines.",             cta:"Open Sandbox",       g:"labs"},
  {fn:"inlineLessonPlayground",  em:"▶️", name:"Try It Live Playground",       desc:"Embedded mini-playground for experimenting inside lessons.",         cta:"Try It Live",        g:"labs"},
  {fn:"mcpSchemaBuilderView",    em:"🛠️", name:"Tool Schema Builder",          desc:"Build and validate compliant tool-calling definitions.",             cta:"Build Schema",       g:"labs"},
  {fn:"microVmSandboxView",      em:"🔒", name:"Zero-Trust MicroVM Sandbox",   desc:"Visualise isolated execution for untrusted agent code.",             cta:"Open Sandbox",       g:"labs"},
  {fn:"promptBenchmarkingLab",   em:"🧪", name:"Prompt Regression Lab",        desc:"Benchmark prompt A against prompt B on a fixed set.",                cta:"Run Benchmark",      g:"labs"},
  {fn:"redTeamSimulatorView",    em:"🛡️", name:"Prompt Injection Red-Team",    desc:"Indirect injection attacks and the defences that hold.",             cta:"Start Red-Team",     g:"labs"},
  {fn:"thinkingTraceExplorer",   em:"🧠", name:"Extended Thinking Explorer",   desc:"Inspect reasoning traces and where effort is spent.",                cta:"Explore Traces",     g:"labs"},
  {fn:"scenarioWhatIfExplorer",  em:"❓", name:"What-If Scenario Explorer",    desc:"Push architectural decisions to their edge cases.",                  cta:"Explore Scenarios",  g:"labs"},

  {fn:"warRoomView",             em:"🏛️", name:"Architect War Room",           desc:"Enterprise case studies with a live architecture scorecard.",        cta:"Enter War Room",     g:"practice"},
  {fn:"bossBattleSelect",        em:"👑", name:"Adaptive Boss Battle",         desc:"25-question computer-adaptive final mock simulation.",               cta:"Battle Boss",        g:"practice"},
  {fn:"speedRunSelect",          em:"⚡", name:"Sudden-Death Speed Run",       desc:"30-second countdown rapid-recall active testing.",                   cta:"Start Speed Run",    g:"practice"},
  {fn:"arcadeSurvivalView",      em:"🕹️", name:"Arcade Survival Gauntlet",     desc:"Endless-run survival mode — one miss and it ends.",                  cta:"Start Gauntlet",     g:"practice"},
  {fn:"flashcardBlitzView",      em:"⏲️", name:"60-Second Flashcard Blitz",    desc:"How many cards can you clear in one minute?",                        cta:"Start Blitz",        g:"practice"},
  {fn:"customExamBuilder",       em:"🧩", name:"Custom Exam Builder",          desc:"Build practice exams with your own domain ratios.",                  cta:"Build Exam",         g:"practice"},
  {fn:"customDeckStudio",        em:"🃏", name:"Custom Deck Builder",          desc:"Assemble bespoke flashcard decks and export to CSV.",                cta:"Build Deck",         g:"practice"},
  {fn:"socraticTutorView",       em:"💬", name:"Socratic Dialogue Tutor",      desc:"Work through principles by structured questioning.",                 cta:"Start Dialogue",     g:"practice"},
  {fn:"mockInterviewView",       em:"🤖", name:"Oral Defense Simulator",       desc:"Defend architectural decisions under interview questioning.",        cta:"Start Defense",      g:"practice"},
  {fn:"trapHunterView",          em:"🪤", name:"Exam Trap Hunter",             desc:"Spot the planted flaw in realistic distractor questions.",           cta:"Hunt Traps",         g:"practice"},
  {fn:"speedMatchView",          em:"🔀", name:"Flash Recall Speed Match",     desc:"Match terms to definitions against a 60-second clock.",              cta:"Start Match",        g:"practice"},

  {fn:"examPrescriptionView",    em:"🎯", name:"Exam Prescription",            desc:"Diagnostic remediation targeting your exact weak spots.",            cta:"View Diagnosis",     g:"diagnostics"},
  {fn:"diagnosticRadarView",     em:"📊", name:"Diagnostic Radar",             desc:"Multi-axis audit of preparation depth across domains.",              cta:"View Radar",         g:"diagnostics"},
  {fn:"weakspotHeatmapView",     em:"🗺️", name:"Mastery Heatmap",              desc:"Every question in the bank, mapped by mastery.",                     cta:"View Heatmap",       g:"diagnostics"},
  {fn:"forecastMatrixView",      em:"📅", name:"14-Day Review Forecast",       desc:"Which flashcards come due, and when.",                               cta:"View Forecast",      g:"diagnostics"},
  {fn:"forgettingCurveView",     em:"📉", name:"Forgetting Curve Simulator",   desc:"Ebbinghaus decay modelled against your own reviews.",                cta:"View Curve",         g:"diagnostics"},
  {fn:"executiveDossierView",    em:"📄", name:"Readiness Dossier",            desc:"Executive-style summary of candidate readiness.",                    cta:"Open Dossier",       g:"diagnostics"},
  {fn:"peerBenchmarkView",       em:"📈", name:"Peer Benchmark Curve",         desc:"Your percentile against the wider candidate curve.",                 cta:"View Benchmark",     g:"diagnostics"},
  {fn:"speedRunLeaderboardView", em:"🏆", name:"Speed Run Records",            desc:"Personal bests and response-pace telemetry.",                        cta:"View Records",       g:"diagnostics"},

  {fn:"studyPlanView",           em:"⏱️", name:"Study Plan &amp; Countdown",   desc:"Adaptive 7/14/30-day curriculum with target countdown.",             cta:"Plan Roadmap",       g:"reference"},
  {fn:"questionExplorerView",    em:"🔍", name:"Question Bank Explorer",       desc:"Search and filter the whole bank with full rationales.",             cta:"Explore Questions",  g:"reference"},
  {fn:"cramSheetSelect",         em:"📋", name:"Exam Cram Sheets",             desc:"High-density printable reference sheets per certification.",         cta:"Open Cram Sheets",   g:"reference"},
  {fn:"bookmarksView",           em:"📌", name:"Bookmarks &amp; Notes",        desc:"Every saved takeaway and bookmarked section.",                       cta:"Open Bookmarks",     g:"reference"},
  {fn:"cheatSheetGenerator",     em:"📝", name:"Cheat Sheet Generator",        desc:"Generate a printable quick-reference sheet.",                        cta:"Generate Sheet",     g:"reference"},
  {fn:"knowledgeGraphView",      em:"🕸️", name:"Knowledge Graph",              desc:"How concepts across the syllabus connect.",                          cta:"Open Graph",         g:"reference"},
  {fn:"lessonMindMapper",        em:"🗺️", name:"Mind Mapper",                  desc:"Conceptual mind maps of architecture topics.",                       cta:"Open Mind Map",      g:"reference"},
  {fn:"modelCapabilityNavigator",em:"🧭", name:"Model Capability Navigator",   desc:"Match a requirement to the right model capability.",                 cta:"Navigate Models",    g:"reference"},
  {fn:"modelMatrixView",         em:"📊", name:"Model Comparison Matrix",      desc:"Side-by-side pricing, latency, and capability tradeoffs.",           cta:"View Matrix",        g:"reference"},
  {fn:"modelRoiCalculatorView",  em:"💰", name:"Model ROI Calculator",         desc:"Monthly token spend and latency tradeoffs, costed.",                 cta:"Calculate ROI",      g:"reference"},
  {fn:"promptTransformGallery",  em:"✨", name:"Prompt Transformation Gallery",desc:"Before and after, with the reasoning for each change.",              cta:"Open Gallery",       g:"reference"},
  {fn:"handbookSelect",          em:"📖", name:"Full Study Handbook",          desc:"Every lesson for a certification as one continuous read.",           cta:"Open Handbook",      g:"reference"},
  {fn:"notesView",               em:"🗒️", name:"Scratch Notes",                desc:"Free-form notes kept alongside your study.",                         cta:"Open Notes",         g:"reference"},

  {fn:"audioQuizView",           em:"🎧", name:"Hands-Free Audio Quiz",        desc:"Active recall without looking at the screen.",                       cta:"Start Audio Quiz",   g:"audio"},
  {fn:"audioSpeedDrillView",     em:"🔊", name:"Audio Speed Drill",            desc:"Rapid spoken drilling against the clock.",                           cta:"Start Drill",        g:"audio"},
  {fn:"lessonAudioRecap",        em:"🎵", name:"30-Second Audio Recap",        desc:"High-yield spoken summary of a lesson.",                             cta:"Play Recap",         g:"audio"},
  {fn:"voiceNotesHubView",       em:"🎙️", name:"Voice Notes Hub",              desc:"Record and replay short spoken study memos.",                        cta:"Open Voice Notes",   g:"audio"},

  {fn:"certificateSelect",       em:"🎓", name:"Verified Diplomas",            desc:"Printable certificates of exam readiness.",                          cta:"View Diplomas",      g:"share"},
  {fn:"cryptoDiplomaView",       em:"📜", name:"Cryptographic Diploma",        desc:"Verifiable diploma with a checkable signature.",                     cta:"View Diploma",       g:"share"},
  {fn:"openBadgeGenerator",      em:"🏅", name:"OpenBadge Generator",          desc:"Standards-compliant digital credential badge.",                      cta:"Generate Badge",     g:"share"},
  {fn:"socialBadgeView",         em:"📢", name:"Shareable Badge Card",         desc:"A card built for sharing your verified progress.",                   cta:"Get Badge Card",     g:"share"},
  {fn:"communityLeaderboardView",em:"🌐", name:"Community Leaderboard",        desc:"Rankings across XP, speed runs, and mastery.",                       cta:"View Leaderboard",   g:"share"},
  {fn:"gistSyncView",            em:"☁️", name:"Gist Cloud Sync",              desc:"Sync progress across devices through a GitHub gist.",                cta:"Sync Devices",       g:"share"},
  {fn:"mobileExportView",        em:"📱", name:"Mobile App Export",            desc:"Package the app for iOS and Android via Capacitor.",                 cta:"Export Mobile",      g:"share"},

  {fn:"mcpToolSimulator",        em:"🔧", name:"Mock MCP Tool Sandbox",       desc:"Invoke mock MCP tools and inspect the round trip.",                  cta:"Run Tools",          g:"labs"},
  {fn:"multiTurnCompactionLab",  em:"🗜️", name:"Context Compaction Lab",      desc:"Watch a long conversation get compacted turn by turn.",              cta:"Open Lab",           g:"labs"},
  {fn:"tokenProfilerLab",        em:"📊", name:"Token Budget Profiler",       desc:"Profile token spend and cost across a prompt.",                      cta:"Profile Tokens",     g:"labs"},
  {fn:"dagVisualizerView",       em:"🕸️", name:"Multi-Agent DAG Builder",     desc:"Build and inspect multi-agent topologies as a graph.",               cta:"Build DAG",          g:"labs"},
  {fn:"claudeCodeTerminalView",  em:"⌨️", name:"Claude Code CLI Simulator",   desc:"Practise the CLI workflow in a simulated terminal.",                 cta:"Open Terminal",      g:"labs"},

  {fn:"pacingSimulatorView",     em:"⏰", name:"Exam Pacing Simulator",       desc:"Strict 90-second clock per question, exam conditions.",              cta:"Start Pacing",       g:"practice"},
  {fn:"dailyBossView",           em:"📆", name:"Daily Boss Challenge",        desc:"A fresh rotating challenge every day.",                              cta:"Fight Today's Boss", g:"practice"},
  {fn:"oralDefenseBoardView",    em:"⚖️", name:"Executive Defense Board",     desc:"Defend a design to a simulated executive board.",                    cta:"Face the Board",     g:"practice"},
  {fn:"peerBattleView",          em:"🤺", name:"1v1 Peer Quiz Battle",        desc:"Head-to-head timed quiz against another candidate.",                 cta:"Enter Arena",        g:"practice"},
  {fn:"whiteboardDuelView",      em:"⚔️", name:"Whiteboard Duel",             desc:"Real-time architecture whiteboarding, head to head.",                cta:"Start Duel",         g:"practice"},

  {fn:"confidenceCalibrationView",em:"🎚️",name:"Confidence Calibration",      desc:"Brier score on where confidence and correctness diverge.",           cta:"Check Calibration",  g:"diagnostics"},
  {fn:"paretoFrontierView",      em:"📈", name:"Cost vs Latency Frontier",    desc:"Explore the P99 latency and cost Pareto frontier.",                  cta:"Explore Frontier",   g:"diagnostics"},

  {fn:"examCountdownPlannerView",em:"🗓️", name:"Exam Countdown Planner",      desc:"Daily pacing plan against your booked exam date.",                   cta:"Plan Countdown",     g:"reference"},
  {fn:"studyRoadmapView",        em:"🛣️", name:"Study Roadmap",               desc:"Milestone roadmap through the whole syllabus.",                      cta:"View Roadmap",       g:"reference"},
  {fn:"themeStudioView",         em:"🎨", name:"Theme Studio",                desc:"Customise the palette and save your own theme.",                     cta:"Open Theme Studio",  g:"reference"},

  {fn:"voiceRecallView",         em:"🗣️", name:"Voice Recognition Recall",    desc:"Speak your answers and have them checked aloud.",                    cta:"Start Voice Recall", g:"audio"},
  {fn:"voiceCommuterView",       em:"🚗", name:"Commuter Voice Quiz",         desc:"Fully hands-free quizzing for the drive in.",                        cta:"Start Commuting",    g:"audio"},

  {fn:"cohortHubView",           em:"👥", name:"Study Cohort Hub",            desc:"Group study progress and shared cohort milestones.",                 cta:"Open Cohort",        g:"share"},
];

/* Cert picker for the handbook, mirroring cramSheetSelect. */
function handbookSelect(){
  renderHeader();
  let h='<button class="back" onclick="home()">← Back to Home</button>'
    +'<div class="panel"><h2 style="font-size:19px; margin-bottom:6px;">📖 Full Study Handbook</h2>'
    +'<p style="font-size:13px; color:var(--muted); margin-bottom:16px;">Every lesson for a certification, in order, as one continuous read.</p>'
    +'<div class="certs">';
  for(const c of CERTS){
    h+='<div class="cert" onclick="fullHandbookView(\''+c.id+'\')">'
      +'<div class="ribbon" style="background:'+c.color+'"></div>'
      +'<div class="em">'+c.em+'</div><h3>'+c.name+'</h3>'
      +'<div class="code">'+c.code+' · Complete Handbook</div>'
      +'<div class="rowbtns" style="margin-top:12px;"><button class="btn sm">Open Handbook →</button></div>'
      +'</div>';
  }
  $("app").innerHTML = h+'</div></div>';
}

/* Which tool groups the user has expanded. Deliberately a plain variable and
   not part of S: it survives a re-render (open a tool, come back, your section
   is still open) but not a reload, so a fresh visit still starts fully
   collapsed the way the dashboard is meant to be met. */
const openToolGroups = new Set();

/* Records a user's expand/collapse. Ignored while the filter box has text,
   because those toggles come from filterTools rather than from the user - and
   `toggle` fires asynchronously, so a synchronous "I am filtering" flag would
   not still be set by the time this ran. */
function toggleToolGroup(el){
  const box=$("toolsearch");
  if(box && box.value.trim()) return;
  const id=el.getAttribute("data-toolgroup");
  if(el.open) openToolGroups.add(id); else openToolGroups.delete(id);
}

function setAllToolGroups(open){
  document.querySelectorAll("[data-toolgroup]").forEach(sec=>{ sec.open=open; });
  const b=$("toolexpand");
  if(b){ b.textContent = open ? "Collapse all" : "Expand all"; b.setAttribute("aria-expanded", open?"true":"false"); }
}
function toggleAllToolGroups(){
  const secs=[...document.querySelectorAll("[data-toolgroup]")];
  setAllToolGroups(secs.some(s=>!s.open));
}

/* Live filter over the tool grid. Toggles visibility in place rather than
   re-rendering, so typing stays responsive with 50+ cards on screen. */
function filterTools(q){
  const term=(q||"").trim().toLowerCase();
  let shown=0;
  document.querySelectorAll("[data-tool]").forEach(el=>{
    const hit=!term || el.getAttribute("data-tool").indexOf(term)>=0;
    el.style.display = hit ? "" : "none";
    if(hit) shown++;
  });
  document.querySelectorAll("[data-toolgroup]").forEach(sec=>{
    const any=[...sec.querySelectorAll("[data-tool]")].some(el=>el.style.display!=="none");
    sec.style.display = any ? "" : "none";
    /* A hit inside a collapsed group is invisible, so searching expands whatever
       matched and puts it back the way the user left it once the box is empty. */
    sec.open = term ? any : openToolGroups.has(sec.getAttribute("data-toolgroup"));
  });
  const n=$("toolcount"); if(n) n.textContent = shown+" of "+TOOLS.length+" tools";
}

function toolCard(t){
  const hay=(t.name+" "+t.desc+" "+t.fn).toLowerCase().replace(/&amp;/g,"&");
  return '<div class="cert toolcard" data-tool="'+esc(hay)+'" onclick="'+t.fn+'()" role="button" tabindex="0"'
    +' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();'+t.fn+'();}"'
    +' aria-label="'+esc(t.name.replace(/&amp;/g,"&"))+'">'
    +'<div style="font-size:22px; margin-bottom:4px;">'+t.em+'</div>'
    +'<h4 style="font-size:13.5px; margin:0 0 2px;">'+t.name+'</h4>'
    +'<p style="font-size:11px; color:var(--muted); line-height:1.3; margin:0 0 8px;">'+t.desc+'</p>'
    +'<span class="btn sm" style="font-size:11px; padding:4px 8px;">'+t.cta+' →</span>'
    +'</div>';
}

/* The whole dashboard tool section, built from TOOLS. */
function renderToolGrid(){
  let h='<div style="margin-top:28px;">'
    +'<div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; margin-bottom:10px;">'
    +'<div><h3 style="font-size:17px; font-weight:800; color:var(--ink);">🛠️ Labs, Simulators &amp; Toolkits</h3>'
    +'<p style="font-size:12px; color:var(--muted); margin-top:2px;">Every interactive tool in the app · <span id="toolcount">'+TOOLS.length+' tools</span> · open a section to browse it</p></div>'
    +'<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">'
    +'<input id="toolsearch" type="search" placeholder="Filter tools…" aria-label="Filter tools"'
    +' oninput="filterTools(this.value)"'
    +' style="flex:0 1 240px; min-width:160px; padding:8px 11px; border:2px solid var(--border); border-radius:10px;'
    +' background:var(--card); color:var(--ink); font-size:13px; font-family:inherit;">'
    +'<button id="toolexpand" class="btn sm" onclick="toggleAllToolGroups()" aria-expanded="false"'
    +' style="font-size:12px; padding:8px 12px; background:var(--card); color:var(--ink); border:2px solid var(--border);">Expand all</button>'
    +'</div></div>';
  /* `open` is written only for groups the user expanded earlier this session.
     openToolGroups is empty on a fresh load, so a first visit is all collapsed. */
  for(const g of TOOL_GROUPS){
    const items=TOOLS.filter(t=>t.g===g.id);
    if(!items.length) continue;
    h+='<details class="toolgroup" data-toolgroup="'+g.id+'" ontoggle="toggleToolGroup(this)"'
      +(openToolGroups.has(g.id)?' open':'')+'>'
      +'<summary><span class="tgchev" aria-hidden="true">▶</span>'
      +'<span><span class="tgname">'+g.name+'</span><span class="tgdesc">'+g.desc+'</span></span>'
      +'<span class="tgcount">'+items.length+'</span></summary>'
      +'<div class="tgbody">'+items.map(toolCard).join('')+'</div>'
      +'</details>';
  }
  return h+'</div>';
}

function home(){
  renderHeader();
  let h='<div class="grid">';
  for(const c of CERTS){
    const p=certProgress(c);
    const best=S.mocks[c.id]?Math.max(...S.mocks[c.id]):null;
    h+='<div class="cert" onclick="certView(\''+c.id+'\')">'
     +'<div class="ribbon" style="background:'+c.color+'"></div>'
     +'<div class="price">'+c.price+'</div>'
     +'<div class="em">'+c.em+'</div><h3>'+c.name+'</h3>'
     +'<div class="code">'+c.sub+' · '+c.code+'</div>'
     +'<div class="pbar"><div style="width:'+p.pct+'%; background:'+c.color+'"></div></div>'
     +'<div class="pmeta"><span>'+p.seen+'/'+p.total+' questions seen</span><span>'+(best?("Best mock: "+best):(p.seen?p.acc+"% accuracy":"Start your quest →"))+'</span></div>'
     +'</div>';
  }
  h+='</div>';

  h+=renderToolGrid();

  h+='<div class="rowbtns" style="justify-content:center; margin-top:24px; flex-wrap:wrap; gap:8px;">'
   +'<button class="btn ghost" onclick="badgesView()">🏅 Badges ('+S.badges.length+'/'+BADGES.length+')</button>'
   +'<button class="btn ghost" onclick="analyticsView()">📊 Analytics & Readiness</button>'
   +'<button class="btn ghost" onclick="accessibilityModal()">🔠 Visuals & Fonts</button>'
   +'<button class="btn ghost" onclick="exportProgress()" title="Download your progress as a JSON file">⬇️ Export Backup</button>'
   +'<button class="btn ghost" onclick="document.getElementById(\'impf\').click()" title="Restore progress from a JSON file">⬆️ Import Backup</button>'
   +'<button class="btn ghost" onclick="resetConfirm()" style="color:var(--coral);">↺ Reset Progress</button></div>'
   +'<div class="footer-note" style="margin-top:14px;">All progress, notes, and custom decks are stored securely in this browser. Use <b>Export Backup</b> to sync across devices.</div>';
   
  $("app").innerHTML=h;
}

function resetConfirm(){
  if(confirm("⚠️ Reset ALL XP, badges, analytics, test history, bookmarks, and progress?\n\nThis will restore the app to brand-new condition.")){
    try { localStorage.removeItem("certquest"); } catch(e){}
    mem = {};
    S = getFreshState();
    S.days = [new Date().toISOString().slice(0,10)];
    save();
    applyTheme();
    home();
    playSound('badge');
    toast("✨ All progress, badges, analytics, and history have been reset!");
  }
}
function badgesView(){
  renderHeader();
  let h='<button class="back" onclick="home()">← Back</button><div class="panel"><h2 style="font-size:18px;">🏅 Badge Collection</h2><div class="bgrid">';
  for(const b of BADGES){
    const won=S.badges.includes(b.id);
    h+='<div class="badge'+(won?" won":"")+'"><div class="em">'+b.em+'</div><h5>'+b.name+'</h5><p>'+b.desc+'</p></div>';
  }
  h+='</div></div>'; $("app").innerHTML=h;
}
/* Lessons run [foundation, ...one per domain in order], so domain d is taught
   by lesson d+1. Verified for every certification by the test suite. */
function lessonForDomain(c,d){
  const i=d+1;
  return (c.lessons&&c.lessons[i]&&!c.lessons[i].foundation) ? i : -1;
}
/* Weak domains from a finished round, worst first, with the lesson that
   teaches each — so a bad round turns into a specific next action. */
function weakDomainLinks(c,stats,heading){
  const rows=Object.keys(stats).map(Number)
    .filter(d=>stats[d].s>0 && stats[d].c<stats[d].s)
    .sort((a,b)=>(stats[a].c/stats[a].s)-(stats[b].c/stats[b].s));
  if(!rows.length) return '';
  let h='<div class="dombreak"><h4>'+heading+'</h4>';
  rows.forEach(d=>{
    const s=stats[d], li=lessonForDomain(c,d);
    h+='<div class="weakrow"><div><b>'+esc(c.domains[d])+'</b>'
      +'<span class="pc"> '+s.c+'/'+s.s+' correct</span></div><div class="wact">'
      +'<button class="btn ghost sm" onclick="startDrill(\''+c.id+'\','+d+')">🩹 Drill</button>'
      +(li>=0?'<button class="btn ghost sm" onclick="lessonView(\''+c.id+'\','+li+')">📖 Lesson</button>':'')
      +'</div></div>';
  });
  return h+'</div>';
}
function lessonProgress(c){
  const read=S.lessonsRead[c.id]||[];
  const done=read.filter(Boolean).length;
  const total=totalLessons(c);
  return {done, total, pct: total?Math.round(done/total*100):0};
}
/* Single gate for a certification's content. Every study mode is reached from
   certView, so ensuring the fetch here covers all of them. */

function renderReadinessRadarSvg(c, rp){
  const cx = 130, cy = 130, r = 85;
  const labels = ["Lessons", "Coverage", "Accuracy", "Domains", "Recall", "Mock"];
  const n = 6;
  
  let gridPaths = '';
  [0.25, 0.5, 0.75, 1.0].forEach(level => {
    let pts = [];
    for(let i=0; i<n; i++){
      const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
      pts.push((cx + r * level * Math.cos(angle)).toFixed(1) + ',' + (cy + r * level * Math.sin(angle)).toFixed(1));
    }
    gridPaths += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="var(--border)" stroke-width="1" stroke-dasharray="' + (level === 1 ? 'none' : '2,2') + '"/>';
  });

  let axes = '';
  for(let i=0; i<n; i++){
    const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    axes += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--border)" stroke-width="1"/>';
    axes += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="600" fill="var(--muted)">' + labels[i] + '</text>';
  }

  let dataPts = [];
  rp.parts.forEach((p, i) => {
    const val = Math.max(0.08, Math.min(1.0, p.v));
    const angle = (i * 2 * Math.PI / n) - (Math.PI / 2);
    dataPts.push((cx + r * val * Math.cos(angle)).toFixed(1) + ',' + (cy + r * val * Math.sin(angle)).toFixed(1));
  });

  const verdict = rp.score >= 80
    ? '<span style="display:inline-block; padding:3px 8px; border-radius:6px; background:rgba(90,158,111,0.15); color:var(--green); font-weight:700; font-size:11px;">🟢 Ready to Schedule Exam</span>'
    : rp.score >= 50
    ? '<span style="display:inline-block; padding:3px 8px; border-radius:6px; background:rgba(232,180,72,0.15); color:var(--gold); font-weight:700; font-size:11px;">🟡 Progressing — Drill Weak Domains</span>'
    : '<span style="display:inline-block; padding:3px 8px; border-radius:6px; background:rgba(217,119,87,0.15); color:var(--coral); font-weight:700; font-size:11px;">🔴 Foundational Phase</span>';

  return '<div style="display:flex; align-items:center; justify-content:center; flex-direction:column; margin-top:8px;">'
    + '<svg viewBox="0 0 260 260" width="200" height="200" style="overflow:visible;">'
    + gridPaths + axes
    + '<polygon points="' + dataPts.join(' ') + '" fill="' + c.color + '" fill-opacity="0.35" stroke="' + c.color + '" stroke-width="2.5"/>'
    + '</svg>'
    + '<div style="margin-top:6px; text-align:center;">' + verdict + '</div>'
    + '</div>';
}

function certView(id){
  const c=CERTS.find(x=>x.id===id);
  if(!c._loaded){
    renderHeader();
    $("app").innerHTML='<button class="back" onclick="home()">← All certifications</button>'
      +'<div class="panel center" style="color:var(--muted); font-size:14px;">Loading '+esc(c.code)+'…</div>';
    loadCert(c).then(()=>certView(id)).catch(e=>loadError(e,"certView('"+c.id+"')"));
    return;
  }
  certViewRender(c);
}
function certViewRender(c){
  const id=c.id;
  if(!S.seenCerts.includes(id)){ S.seenCerts.push(id); save(); if(S.seenCerts.length===4) award("allseen"); }
  renderHeader();
  const p=certProgress(c);
  const lp=lessonProgress(c);
  const rp=prepProgress(c);
  const due=dueCards(c).length, nd=nextDueDate(c);
  const ans=S.answered[c.id]||{};
  const misses=c.questions.filter((q,i)=>ans[qKey(c,i)]===false).length;
  let doms='';
  c.domains.forEach((d,i)=>{
    const st=(S.domStats[c.id]||{})[i]||{s:0,c:0};
    const pc=st.s?Math.round(st.c/st.s*100):0;
    const has=c.questions.some(q=>q.d===i);
    doms+='<div class="dombar'+(has?" drillable":"")+'"'+(has?' onclick="startDrill(\''+id+'\','+i+')" title="Drill this domain"':'')+'>'
      +'<div class="dl"><span>'+esc(d)+'</span><span class="pc">'+(st.s? pc+"% ("+st.c+"/"+st.s+")":"not yet tested")+(has?' <b>›</b>':'')+'</span></div>'
      +'<div class="pbar"><div style="width:'+pc+'%; background:'+c.color+'"></div></div></div>';
  });
  const meters=rp.parts.map(x=>{
    const v=Math.round(x.v*100);
    return '<div class="meter"><div class="dl"><span>'+x.label+'</span><span class="pc">'+v+'%</span></div>'
      +'<div class="pbar"><div style="width:'+v+'%; background:'+(x.v>=.8?"var(--green)":x.v>=.5?"var(--gold)":"var(--coral)")+'"></div></div></div>';
  }).join('');
  $("app").innerHTML =
   '<button class="back" onclick="home()">← All certifications</button>'
   +'<div class="panel"><div style="display:flex; gap:14px; align-items:center;"><div style="font-size:38px;">'+c.em+'</div>'
   +'<div><h2 style="font-size:19px;">'+c.name+' – '+c.sub+'</h2><div class="code" style="color:var(--muted); font-size:12px;">'+c.code+' · '+c.price+' · see the official exam guide for format</div>'
   +'<div style="font-size:13px; margin-top:4px; color:var(--muted);">'+c.blurb+'</div></div></div>'
   +'<div class="modes">'
   +'<div class="mode" onclick="startLearn(\''+id+'\')"><div class="em">📖</div><h4>Study Guide</h4><p>'+lp.total+' lessons · '+lp.done+' read</p></div>'
   +'<div class="mode" onclick="startQuiz(\''+id+'\')"><div class="em">⚔️</div><h4>Quiz Battle</h4><p>10 questions, instant feedback, combo XP</p></div>'
   +'<div class="mode" onclick="startCards(\''+id+'\')"><div class="em">🃏</div><h4>Flashcards</h4><p>'+(due?'<b style="color:var(--coral)">'+due+' due now</b>':(nd?'All caught up · next '+nd:'Spaced repetition'))+'</p></div>'
   +'<div class="mode" onclick="startMock(\''+id+'\')"><div class="em">⏱️</div><h4>Mock Exam</h4><p>20 questions, 40 min, practice scoring</p></div>'
   +'<div class="mode" onclick="startReview(\''+id+'\')"><div class="em">🎯</div><h4>Review Misses</h4><p>'+(misses?'<b style="color:var(--coral)">'+misses+' to revisit</b>':'Nothing missed yet')+'</p></div>'
   +'<div class="mode" onclick="startWeakest(\''+id+'\')"><div class="em">🩹</div><h4>Weakest Domain</h4><p>Target where you score lowest</p></div>'
   +'</div>'
   +'<div style="margin-top:12px; display:flex; justify-content:center;"><button class="btn ghost sm" onclick="cramSheetView(\''+id+'\')">📋 View '+c.code+' Exam Cram Sheet</button></div>'
   +'</div>'
   +'<div class="panel"><div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">'
   +'<div class="prepring" style="--pv:'+(rp.score*3.6)+'deg; --pc:'+c.color+'"><span>'+rp.score+'<small>%</small></span></div>'
   +'<div style="flex:1; min-width:200px;"><h3 style="font-size:15px;">Candidate Prep Readiness</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin-top:3px; line-height:1.5;">Based on this app\'s material only — not a prediction about the real exam.</p></div></div>'
   +'<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-top:14px; align-items:center;">'
   +'<div>'+meters+'</div>'
   +renderReadinessRadarSvg(c, rp)
   +'</div>'
   +'<div class="nextstep"><div class="lbl">Do this next</div>'+esc(rp.weakest.todo)
   +'<div style="margin-top:10px;"><button class="btn sm" onclick="'+rp.weakest.go+'(\''+id+'\')">'+esc(rp.weakest.label)+' →</button></div></div>'
   +'</div>'
   +'<div class="panel"><h3 style="font-size:15px; margin-bottom:10px;">📊 Domain mastery</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin:-4px 0 10px;">Tap a domain to drill just those questions.</p>'+doms+'</div>';
}
