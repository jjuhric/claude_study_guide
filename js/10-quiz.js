/* 10-quiz.js
   Quiz, flashcards, mock exam
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= LESSON WIDGETS ================= */
function initLessonWidgets(){
  const boxes = document.querySelectorAll('.widget-box');
  boxes.forEach(box => {
    const type = box.getAttribute('data-widget');
    if(type === 'token-cost') renderTokenCostCalculator(box);
    else if(type === 'prompt-caching-sim') renderPromptCachingSimulator(box);
    else if(type === 'multi-agent-dag') renderMultiAgentDagSimulator(box);
    else if(type === 'mcp-inspector') renderMcpInspector(box);
    else if(type === 'thinking-simulator') renderThinkingSimulator(box);
    else if(type === 'computer-use') renderComputerUseSimulator(box);
    else if(type === 'xml-prompt') renderXmlPromptChecker(box);
    else if(type === 'stop-reason') renderStopReasonSimulator(box);
    else if(type === 'model-decision-tree') { box.innerHTML = renderModelDecisionTree(); }
    else if(type === 'arch-decision-tree') { box.innerHTML = renderArchitectureDecisionTree(); }
    else if(type === 'rag-visualizer') { box.innerHTML = renderRagChunkingVisualizer(); updateRagChunks(); }
  });

  const pres = document.querySelectorAll('.lesson-body pre');
  pres.forEach(pre => {
    if(!pre.parentElement.classList.contains('code-wrapper')){
      const wrap = document.createElement('div');
      wrap.className = 'code-wrapper';
      pre.parentNode.insertBefore(wrap, pre);
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = '📋 Copy';
      btn.onclick = () => copyCode(btn);
      wrap.appendChild(btn);
      wrap.appendChild(pre);
    }
  });
}

function renderMcpInspector(container){
  container.innerHTML = `
    <h5>🔌 Interactive MCP (Model Context Protocol) Inspector</h5>
    <p style="font-size:12px; color:var(--muted); margin-bottom:8px;">Click a JSON-RPC 2.0 protocol method to inspect the exact wire request and response payload:</p>
    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
      <button class="btn ghost sm" onclick="simMcp('tools/list')">tools/list</button>
      <button class="btn ghost sm" onclick="simMcp('tools/call')">tools/call</button>
      <button class="btn ghost sm" onclick="simMcp('resources/list')">resources/list</button>
      <button class="btn ghost sm" onclick="simMcp('resources/read')">resources/read</button>
      <button class="btn ghost sm" onclick="simMcp('prompts/get')">prompts/get</button>
      <button class="btn ghost sm" onclick="simMcp('roots/list')">roots/list</button>
    </div>
    <div id="wMcpResult" class="sim-terminal">Select a method above to inspect JSON-RPC 2.0 payload.</div>
  `;
  simMcp('tools/list');
}

function simMcp(method){
  let req = {}, res = {};
  if(method === 'tools/list'){
    req = { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} };
    res = {
      jsonrpc: "2.0", id: 1,
      result: {
        tools: [{
          name: "query_database",
          description: "Read-only SQL query runner against analytics replica",
          inputSchema: {
            type: "object",
            properties: { sql: { type: "string" } },
            required: ["sql"]
          }
        }]
      }
    };
  } else if(method === 'tools/call'){
    req = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "query_database", arguments: { sql: "SELECT count(*) FROM users" } } };
    res = { jsonrpc: "2.0", id: 2, result: { content: [{ type: "text", text: "count: 14205" }], isError: false } };
  } else if(method === 'resources/list'){
    req = { jsonrpc: "2.0", id: 3, method: "resources/list", params: {} };
    res = { jsonrpc: "2.0", id: 3, result: { resources: [{ uri: "postgres://analytics/schema", name: "DB Schema", mimeType: "application/json" }] } };
  } else if(method === 'resources/read'){
    req = { jsonrpc: "2.0", id: 4, method: "resources/read", params: { uri: "postgres://analytics/schema" } };
    res = { jsonrpc: "2.0", id: 4, result: { contents: [{ uri: "postgres://analytics/schema", mimeType: "application/json", text: "{\"tables\": [\"users\", \"orders\"]}" }] } };
  } else if(method === 'prompts/get'){
    req = { jsonrpc: "2.0", id: 5, method: "prompts/get", params: { name: "summarize_ticket", arguments: { ticketId: "TK-404" } } };
    res = { jsonrpc: "2.0", id: 5, result: { description: "Summarize support ticket", messages: [{ role: "user", content: { type: "text", text: "Summarize ticket TK-404" } }] } };
  } else if(method === 'roots/list'){
    req = { jsonrpc: "2.0", id: 6, method: "roots/list", params: {} };
    res = { jsonrpc: "2.0", id: 6, result: { roots: [{ uri: "file:///workspace/project", name: "Project Root" }] } };
  }

  const out = document.getElementById('wMcpResult');
  if(out){
    out.innerHTML = '<span style="color:#569cd6;">// JSON-RPC 2.0 Request:</span>\n' + JSON.stringify(req, null, 2)
      + '\n\n<span style="color:#4ec9b0;">// JSON-RPC 2.0 Response:</span>\n' + JSON.stringify(res, null, 2);
  }
}

function renderThinkingSimulator(container){
  container.innerHTML = `
    <h5>🧠 Adaptive Thinking &amp; Output Budget Simulator</h5>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div>
        <label>Tokens Claude spends thinking (adaptive — you do not set this directly)</label>
        <input type="range" id="wThinkBudget" min="1024" max="16384" step="1024" value="2048" oninput="calcThinkSim()">
        <div id="wThinkBudgetVal" style="font-size:12px; font-weight:700; color:var(--coral-dark);">2,048 tokens</div>
      </div>
      <div>
        <label>Total Max Tokens (max_tokens)</label>
        <input type="number" id="wThinkMax" value="8192" min="2048" max="64000" step="1024" oninput="calcThinkSim()">
      </div>
    </div>
    <div id="wThinkResult" style="margin-top:12px; font-size:13px; line-height:1.5;"></div>
  `;
  calcThinkSim();
}

function calcThinkSim(){
  const budget = parseInt(document.getElementById('wThinkBudget')?.value||2048, 10);
  const maxTok = parseInt(document.getElementById('wThinkMax')?.value||8192, 10);
  const bVal = document.getElementById('wThinkBudgetVal');
  if(bVal) bVal.textContent = budget.toLocaleString() + ' tokens';

  const valid = maxTok > budget;
  let html = '';
  if(!valid){
    html = '<div style="color:var(--red); font-weight:700;">⚠️ max_tokens ('+maxTok+') leaves no room for the answer: adaptive thinking would consume all of it ('+budget+'). max_tokens caps thinking AND response text together, so raise it or lower output_config.effort.</div>';
  } else {
    const remain = maxTok - budget;
    html = '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px;">'
      + '<div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px;">'
      + '<span>🧠 Internal Thinking Tokens: <b>'+budget.toLocaleString()+'</b></span>'
      + '<span>💬 Available Output Tokens: <b>'+remain.toLocaleString()+'</b></span>'
      + '</div>'
      + '<div style="width:100%; height:16px; background:var(--border); border-radius:8px; display:flex; overflow:hidden;">'
      + '<div style="width:'+((budget/maxTok)*100)+'%; background:var(--purple);"></div>'
      + '<div style="width:'+((remain/maxTok)*100)+'%; background:var(--green);"></div>'
      + '</div>'
      + '<p style="font-size:11.5px; color:var(--muted); margin-top:8px;">💡 <b>Exam Rule:</b> Thinking tokens are generated in a dedicated internal reasoning trace. They must be passed back unaltered in multi-turn conversation history to preserve reasoning context.</p>'
      + '</div>';
  }
  const res = document.getElementById('wThinkResult');
  if(res) res.innerHTML = html;
}
function renderStopReasonSimulator(container){
  container.innerHTML = `
    <h5>⚡ Interactive <code>stop_reason</code> Control-Flow Simulator</h5>
    <label>Select a simulated API <code>stop_reason</code>:</label>
    <select id="wStopSel" onchange="simStopReason()">
      <option value="end_turn">end_turn (Natural completion)</option>
      <option value="max_tokens">max_tokens (Token cap reached)</option>
      <option value="tool_use">tool_use (Model requested tool call)</option>
      <option value="refusal">refusal (Safety refusal)</option>
      <option value="pause_turn">pause_turn (Long-running loop paused)</option>
    </select>
    <div id="wStopResult" style="font-size:13px; line-height:1.5; border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--bg);"></div>
  `;
  simStopReason();
}
function simStopReason(){
  const val = document.getElementById('wStopSel')?.value || 'end_turn';
  let title = '', code = '', explanation = '';

  if(val === 'end_turn'){
    title = '✅ Natural Completion (end_turn)';
    code = 'deliver_response(response.content)';
    explanation = 'The generation completed naturally. The output in <code>content</code> is complete and safe to present to the user.';
  } else if(val === 'max_tokens'){
    title = '⚠️ Truncated Output (max_tokens)';
    code = 'raise_max_tokens_cap_or_append_continuation()';
    explanation = 'Generation was cut off mid-sentence because it hit your <code>max_tokens</code> limit. Do <b>not</b> present this as a complete answer. Raise <code>max_tokens</code> or pass the response back to continue.';
  } else if(val === 'tool_use'){
    title = '🛠️ Tool Execution Requested (tool_use)';
    code = 'result = execute_tool(response.content.tool_use)\nmessages.append({"role": "user", "content": [tool_result]})';
    explanation = 'This is normal tool-calling control flow (not an error!). Execute the requested function in your application and pass back a <code>tool_result</code> in the same message history.';
  } else if(val === 'refusal'){
    title = '🛑 Safety Refusal (refusal)';
    code = 'surface_refusal_to_user(response)\n# DO NOT RETRY THE IDENTICAL REQUEST';
    explanation = 'The request was refused on safety or policy grounds. Retrying the identical request will fail again. Surface the refusal or prompt the user to reframe.';
  } else if(val === 'pause_turn'){
    title = '⏸️ Pause Turn (pause_turn)';
    code = 'resume_server_tool_loop(response)';
    explanation = 'A server-side long-running tool execution paused. Resend the conversation state to resume generation.';
  }

  const res = document.getElementById('wStopResult');
  if(res){
    res.innerHTML = `
      <b style="color:var(--coral-dark);">${title}</b>
      <p style="margin:6px 0 8px;">${explanation}</p>
      <pre style="background:var(--card); padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-size:12px; font-family:'SF Mono',Consolas,monospace;">${code}</pre>
    `;
  }
}
function markRead(id,i,goNext){
  const c=CERTS.find(x=>x.id===id);
  S.lessonsRead[c.id]=S.lessonsRead[c.id]||[];
  const already=!!S.lessonsRead[c.id][i];
  S.lessonsRead[c.id][i]=true;
  save();
  if(!already) addXP(8,"lesson read");
  const lp=lessonProgress(c);
  if(lp.done>=lp.total){
    award("scholar_"+c.id);
    const allDone=CERTS.every(cc=>{ const p=lessonProgress(cc); return p.total>0 && p.done>=p.total; });
    if(allDone) award("polymath");
  }
  if (typeof window !== 'undefined') {
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
  if(goNext && i<c.lessons.length-1){ lessonView(id,i+1); }
  else{
    renderHeader(); if(lp.done>=lp.total) confetti();
    $("app").innerHTML='<div class="panel center"><h2 style="font-size:19px;">'+(lp.done>=lp.total?"Study guide complete! 🎓":"Nice work!")+'</h2>'
     +'<div class="subtext" style="margin-top:8px;">You\'ve read '+lp.done+'/'+lp.total+' '+c.code+' lessons. Ready to test yourself?</div>'
     +'<div class="rowbtns" style="justify-content:center;"><button class="btn" onclick="startQuiz(\''+c.id+'\')">⚔️ Quiz Battle</button>'
     +'<button class="btn ghost" onclick="learnList(\''+c.id+'\')">Back to lessons</button></div></div>';
  }
}

/* ================= QUIZ ================= */
let Q={};
/* Content arrives from data/*.json at runtime, so a missing or truncated file
   can leave a mode with nothing to show. Explain it rather than throwing. */
function noContent(c,kind){
  $("app").innerHTML='<button class="back" onclick="certView(\''+c.id+'\')">← Back to '+esc(c.code)+'</button>'
   +'<div class="panel"><h2 style="font-size:17px;">No '+esc(kind)+' available yet</h2>'
   +'<p style="font-size:13.5px; color:var(--muted); line-height:1.6; margin-top:8px;">Nothing was loaded for this certification. If other sections work, <code>data/'+esc(c.id)+'.json</code> is likely incomplete.</p></div>';
}
function pickQuestions(c,n){
  const ans=S.answered[c.id]||{};
  const unseen=c.questions.map((q,i)=>i).filter(i=>!(qKey(c,i) in ans));
  const wrong=c.questions.map((q,i)=>i).filter(i=>ans[qKey(c,i)]===false);
  const rest=c.questions.map((q,i)=>i).filter(i=>ans[qKey(c,i)]===true);
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const pool=[...shuffle(unseen),...shuffle(wrong),...shuffle(rest)];
  return pool.slice(0,n);
}
function startQuiz(id){
  const c=CERTS.find(x=>x.id===id);
  if(!c.questions.length) return noContent(c,"practice questions");
  Q={cert:c, idxs:pickQuestions(c,10), i:0, correct:0, combo:0, mode:"quiz", stats:{}};
  quizQ();
}
function quizQ(){
  const c=Q.cert, qi=Q.idxs[Q.i], q=c.questions[qi];
  renderHeader();
  let opts=''; q.opts.forEach((o,j)=>{ opts+='<button class="opt" onclick="answer('+j+')"><b class="okey">'+(j+1)+'</b>'+esc(o)+'</button>'; });
  $("app").innerHTML =
   '<button class="back" onclick="certView(\''+c.id+'\')">← Quit</button>'
   +'<div class="panel"><div class="qmeta"><span>Question '+(Q.i+1)+' / '+Q.idxs.length+'</span>'
   +(Q.combo>=2?'<span class="combo">🔥 Combo ×'+Q.combo+'</span>':'')
   +'<span>✅ '+Q.correct+'</span></div>'
   +(Q.label?'<div class="modebar">'+esc(Q.label)+'</div>':'')
   +'<div class="domtag">'+esc(c.domains[q.d])+'</div>'
   +'<div class="qtext">'+esc(q.q)+'</div>'+opts
   +'<div class="exp" id="exp"></div>'
   +'<div class="center"><button class="btn" id="nextb" style="display:none" onclick="nextQ()">'+(Q.i+1<Q.idxs.length?"Next →":"See results 🏁")+'</button></div>'
   +'</div>';
}
function recordAnswer(c,qi,ok){
  const q=c.questions[qi];
  S.answered[c.id]=S.answered[c.id]||{};
  S.answered[c.id][qKey(c,qi)]=ok;
  S.domStats[c.id]=S.domStats[c.id]||{};
  const st=S.domStats[c.id][q.d]=S.domStats[c.id][q.d]||{s:0,c:0};
  st.s++; if(ok)st.c++;
  save();
}
function answer(j){
  const c=Q.cert, qi=Q.idxs[Q.i], q=c.questions[qi];
  const btns=document.querySelectorAll(".opt");
  btns.forEach(b=>{ b.disabled=true; b.setAttribute("aria-disabled","true"); });
  const ok=(j===q.a);
  btns[q.a].classList.add("correct");
  if(!ok) btns[j].classList.add("wrong");
  btns.forEach((b,k)=>{ if(k!==q.a&&k!==j) b.classList.add("dim"); });
  /* Correctness must not be conveyed by colour alone — add a glyph plus text
     only a screen reader sees, and announce the outcome on the live region. */
  btns[q.a].insertAdjacentHTML("beforeend",'<span class="mark" aria-hidden="true">✓</span><span class="vhide"> — correct answer</span>');
  if(!ok) btns[j].insertAdjacentHTML("beforeend",'<span class="mark" aria-hidden="true">✗</span><span class="vhide"> — your answer, incorrect</span>');
  announce((ok?"Correct. ":"Incorrect. The correct answer is: "+q.opts[q.a]+". ")+q.exp);
  recordAnswer(c,qi,ok);
  award("first");
  if(ok){
    Q.correct++; Q.combo++;
    if(Q.combo>=5)award("combo5"); if(Q.combo>=10)award("combo10");
    const bonus=Math.min(Q.combo-1,5)*2;
    addXP(10+bonus, bonus?("combo ×"+Q.combo):"correct");
  } else { Q.combo=0; }
  Q.stats=Q.stats||{};
  const st=Q.stats[q.d]=Q.stats[q.d]||{s:0,c:0};
  st.s++; if(ok)st.c++;
  const e=$("exp");
  /* "I narrowed it to two and picked wrong" is the common failure mode, so
     when a question carries per-option rationales, show all of them. */
  let why='';
  if(Array.isArray(q.why)&&q.why.length===q.opts.length){
    why='<div class="whybox">';
    q.opts.forEach((o,k)=>{
      const right=(k===q.a);
      why+='<div class="wrow '+(right?"ok":"no")+'"><b>'+(right?"✓":"✗")+' '+esc(o)+'</b>'
        +'<span>'+esc(q.why[k])+'</span></div>';
    });
    why+='</div>';
  }
  e.innerHTML='<b>'+(ok?"✅ Correct!":"❌ Not quite.")+'</b> '+esc(q.exp)+why;
  e.classList.add("show");
  const nb=$("nextb");
  nb.style.display="inline-block";
  nb.focus();                       // the answer buttons just went disabled
}
function nextQ(){
  Q.i++;
  if(Q.i<Q.idxs.length){ quizQ(); return; }
  if(Q.correct===Q.idxs.length&&Q.idxs.length>=10){ award("perfect10"); }
  renderHeader();
  const pct=Math.round(Q.correct/Q.idxs.length*100);
  const msg=pct===100?"Flawless victory! 💎":pct>=80?"Excellent — exam-ready pace! 🚀":pct>=60?"Solid. Review the misses and go again. 💪":"Every miss is a future point. Review & retry! 🌱";
  if(pct>=80)confetti();
  $("app").innerHTML='<div class="panel center"><h2 style="font-size:20px;">Round complete!</h2>'
   +'<div class="bigscore" style="color:'+Q.cert.color+'">'+Q.correct+'/'+Q.idxs.length+'</div>'
   +'<div class="subtext">'+msg+'</div>'
   +weakDomainLinks(Q.cert, Q.stats||{}, "Where you dropped marks")
   +'<div class="rowbtns" style="justify-content:center;">'
   +(Q.mode==="review"
      ? '<button class="btn" onclick="startReview(\''+Q.cert.id+'\')">🎯 Review more misses</button>'
      : '<button class="btn" onclick="startQuiz(\''+Q.cert.id+'\')">⚔️ Another round</button>')
   +'<button class="btn ghost" onclick="startWeakest(\''+Q.cert.id+'\')">🩹 Weakest domain</button>'
   +'<button class="btn ghost" onclick="certView(\''+Q.cert.id+'\')">Back to '+esc(Q.cert.code)+'</button></div></div>';
}


/* ================= FLASHCARD ANKI EXPORT & CUSTOM CARDS ================= */
function exportCardsToAnki(certId){
  const c = CERTS.find(x => x.id === certId);
  if (!c) return;
  const allCards = [...(c.cards || []), ...((S.customCards || {})[certId] || [])];
  if (!allCards.length) {
    toast('No flashcards available to export');
    return;
  }
  let tsv = "#separator:tab\n#html:true\n#tags column:3\n";
  allCards.forEach(card => {
    const front = (card.f || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const back = (card.b || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
    const tag = c.code.toLowerCase().replace(/[^a-z0-9]/g, '_');
    tsv += front + "\t" + back + "\t" + tag + "\n";
  });
  
  const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = c.code.toLowerCase() + "-anki-deck.tsv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("📥 Exported " + allCards.length + " cards for Anki / Quizlet!");
}

function openCustomCardModal(certId){
  const c = CERTS.find(x => x.id === certId);
  if (!c) return;
  const modal = document.createElement("div");
  modal.id = "customCardModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:460px; background:var(--card); border:2px solid var(--border); border-radius:14px; padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.35);">
      <h3 style="font-size:17px; margin-bottom:6px;">➕ Add Custom Flashcard (${c.code})</h3>
      <p style="font-size:12.5px; color:var(--muted); margin-bottom:12px;">Create your own personal flashcard stored locally and scheduled in your Leitner spaced repetition deck.</p>
      <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Card Front (Prompt / Question / Concept):</label>
      <textarea id="customCardFront" placeholder="e.g. What is the minimum token threshold for Haiku Prompt Caching?" style="width:100%; height:70px; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:12px; font-family:inherit;"></textarea>
      <label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Card Back (Explanation / Answer / Formula):</label>
      <textarea id="customCardBack" placeholder="e.g. 2,048 tokens for Haiku (vs 1,024 tokens for Sonnet/Opus). 85% discount on cached reads with 5-min TTL." style="width:100%; height:80px; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg); color:var(--ink); font-size:13px; margin-bottom:14px; font-family:inherit;"></textarea>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button class="btn ghost sm" onclick="document.getElementById('customCardModal').remove()">Cancel</button>
        <button class="btn sm" onclick="saveCustomCard('${certId}')">Save Flashcard</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const f = document.getElementById("customCardFront");
  if (f) f.focus();
}

function saveCustomCard(certId){
  const f = (document.getElementById("customCardFront")?.value || '').trim();
  const b = (document.getElementById("customCardBack")?.value || '').trim();
  if (!f || !b) {
    alert("Please fill in both the front and back of the flashcard.");
    return;
  }
  S.customCards = S.customCards || {};
  S.customCards[certId] = S.customCards[certId] || [];
  const cardId = certId + "_custom_" + Date.now();
  S.customCards[certId].push({ id: cardId, f, b, custom: true });
  save();
  const modal = document.getElementById("customCardModal");
  if (modal) modal.remove();
  toast("✨ Custom flashcard added to deck!");
  startCards(certId);
}

/* ================= FLASHCARDS ================= */
let F={};
function startCards(id,mode){
  const c=CERTS.find(x=>x.id===id);
  if(!c.cards.length) return noContent(c,"flashcards");
  const deck = getAllCertCards(c); const idxs = mode==="all" ? deck.map((_,i)=>i) : dueCards(c);
  if(!idxs.length) return cardsCaughtUp(c);
  F={cert:c, idxs:shuffleArr(idxs.slice()), i:0, knew:0, again:new Set(), mode:mode||"due"};
  cardView();
}
function cardView(){
  const c=F.cert, deck=getAllCertCards(c), card=deck[F.idxs[F.i]];
  renderHeader();
  $("app").innerHTML =
   '<button class="back" onclick="certView(\''+c.id+'\')">← Quit flashcards</button>'
   +'<div class="panel"><div class="qmeta"><span>Card '+(F.i+1)+' / '+F.idxs.length+(F.mode==="all"?" · whole deck":" · due today")+'</span>'
   +'<span>'+"▮".repeat(cardBox(c,F.idxs[F.i]).b)+"▯".repeat(5-cardBox(c,F.idxs[F.i]).b)+' · 👍 '+F.knew+'</span></div>'
   +'<div class="hint">Tap the card to flip · <b>Space</b> flip · <b>1</b> still learning · <b>2</b> knew it</div>'
   +'<div class="fcstage"><div class="fcard" id="fc" onclick="this.classList.toggle(\'flip\'); playSound(\'flip\');">'
   +'<div class="fface front">'+esc(card.f)+'</div>'
   +'<div class="fface backf">'+esc(card.b)+'</div>'
   +'</div></div>'
   +'<div class="fcbtns"><button class="btn ghost sm" onclick="gradeCard(false)">🤔 Still learning</button>'
   +'<button class="btn sm" onclick="gradeCard(true)">✅ Knew it</button></div></div>';
}
function gradeCard(knew){
  const c=F.cert, ci=F.idxs[F.i];
  scheduleCard(c,ci,knew);
  S.cardsSeen++; save();
  if(S.cardsSeen>=25)award("cards25");
  if(knew){ F.knew++; addXP(4,"flashcard"); }
  else if(!F.again.has(ci)){ F.again.add(ci); F.idxs.push(ci); }  // one same-session repeat
  F.i++;
  if(F.i<F.idxs.length){ cardView(); return; }
  renderHeader(); confetti();
  const ret=Math.round(cardRetention(c)*100);
  const left=dueCards(c).length;
  const nd=nextDueDate(c);
  $("app").innerHTML='<div class="panel center"><h2 style="font-size:20px;">Session complete 🃏</h2>'
   +'<div class="bigscore" style="color:'+c.color+'; font-size:38px;">'+F.knew+'<span style="font-size:20px; color:var(--muted);"> / '+F.idxs.length+' recalled</span></div>'
   +'<div class="subtext">'+ret+'% of the '+esc(c.code)+' deck has reached a durable box.'
   +(left?' '+left+' card'+(left===1?'':'s')+' still due.':(nd?' Next review: <b>'+esc(nd)+'</b>.':''))+'</div>'
   +'<div class="rowbtns" style="justify-content:center;">'
   +(left?'<button class="btn" onclick="startCards(\''+c.id+'\')">Keep going ('+left+' due)</button>':'')
   +'<button class="btn ghost" onclick="startCards(\''+c.id+'\',\'all\')">Drill whole deck</button>'
   +'<button class="btn ghost" onclick="certView(\''+c.id+'\')">Back to '+esc(c.code)+'</button></div></div>';
}
function cardsCaughtUp(c){
  const nd=nextDueDate(c);
  renderHeader();
  $("app").innerHTML='<button class="back" onclick="certView(\''+c.id+'\')">← Back to '+esc(c.code)+'</button>'
   +'<div class="panel center"><div style="font-size:38px;">🌤️</div>'
   +'<h2 style="font-size:19px; margin-top:6px;">Nothing due right now</h2>'
   +'<div class="subtext" style="margin-top:8px;">'+Math.round(cardRetention(c)*100)+'% of this deck is in a durable box.'
   +(nd?' Your next card is due <b>'+esc(nd)+'</b>.':'')
   +' Spacing reviews out is what makes recall stick — coming back then beats drilling now.</div>'
   +'<div class="rowbtns" style="justify-content:center;"><button class="btn ghost" onclick="startCards(\''+c.id+'\',\'all\')">Drill the whole deck anyway</button>'
   +'<button class="btn" onclick="certView(\''+c.id+'\')">Back to '+esc(c.code)+'</button></div></div>';
}

/* ================= TARGETED PRACTICE ================= */
function startDrill(id,domIdx){
  const c=CERTS.find(x=>x.id===id);
  const pool=c.questions.map((q,i)=>i).filter(i=>c.questions[i].d===domIdx);
  if(!pool.length) return noContent(c,"questions for that domain");
  Q={cert:c, idxs:shuffleArr(pool).slice(0,10), i:0, correct:0, combo:0, mode:"drill", stats:{}, label:"Drilling "+c.domains[domIdx]};
  quizQ();
}
function startWeakest(id){
  const c=CERTS.find(x=>x.id===id);
  if(!c.questions.length) return noContent(c,"practice questions");
  const st=S.domStats[c.id]||{};
  const ranked=c.domains.map((d,i)=>{
    const s=st[i]||{s:0,c:0};
    return {i, has:c.questions.some(q=>q.d===i), acc: s.s>=3 ? s.c/s.s : -1};  // untested sorts first
  }).filter(x=>x.has).sort((a,b)=>a.acc-b.acc);
  if(!ranked.length) return noContent(c,"practice questions");
  startDrill(id, ranked[0].i);
}
function startReview(id){
  const c=CERTS.find(x=>x.id===id);
  const ans=S.answered[c.id]||{};
  const pool=c.questions.map((q,i)=>i).filter(i=>ans[qKey(c,i)]===false);
  if(!pool.length){
    renderHeader();
    $("app").innerHTML='<button class="back" onclick="certView(\''+c.id+'\')">← Back to '+esc(c.code)+'</button>'
     +'<div class="panel center"><div style="font-size:38px;">✨</div><h2 style="font-size:19px; margin-top:6px;">No missed questions</h2>'
     +'<div class="subtext" style="margin-top:8px;">Nothing to revisit for '+esc(c.code)+' yet. Missed questions land here automatically so you can hunt down weak spots.</div>'
     +'<div class="rowbtns" style="justify-content:center;"><button class="btn" onclick="startQuiz(\''+c.id+'\')">⚔️ Quiz Battle</button>'
     +'<button class="btn ghost" onclick="certView(\''+c.id+'\')">Back</button></div></div>';
    return;
  }
  Q={cert:c, idxs:shuffleArr(pool).slice(0,15), i:0, correct:0, combo:0, mode:"review", stats:{}, label:"Reviewing past misses"};
  quizQ();
}

/* ================= MOCK EXAM ================= */
let M={};
/* Stratified sample across domains. Uniform random over the whole bank can
   over-sample one domain and skip another entirely, which a blueprinted exam
   never does. Slots are allocated proportionally to each domain's pool with a
   floor of one, then largest-remainder balanced to hit exactly n. */
function sampleByDomain(c,n){
  const byDom={};
  c.questions.forEach((q,i)=>{ (byDom[q.d]=byDom[q.d]||[]).push(i); });
  const doms=Object.keys(byDom).map(Number).sort((a,b)=>a-b);
  const total=c.questions.length;
  n=Math.min(n,total);
  const alloc=doms.map(d=>{
    const ideal=n*byDom[d].length/total;
    return {d, ideal, take:Math.min(byDom[d].length, Math.max(1, Math.floor(ideal)))};
  });
  let used=alloc.reduce((s,a)=>s+a.take,0);
  while(used<n){                                  // hand out leftovers by largest shortfall
    const cand=alloc.slice().sort((x,y)=>(y.ideal-y.take)-(x.ideal-x.take)).find(a=>a.take<byDom[a.d].length);
    if(!cand) break;
    cand.take++; used++;
  }
  while(used>n){                                  // trim overshoot, never below one per domain
    const cand=alloc.slice().sort((x,y)=>(x.ideal-x.take)-(y.ideal-y.take)).find(a=>a.take>1);
    if(!cand) break;
    cand.take--; used--;
  }
  const out=[];
  alloc.forEach(a=>{ out.push(...shuffleArr(byDom[a.d].slice()).slice(0,a.take)); });
  return shuffleArr(out);
}
function startMock(id, count){
  const c=CERTS.find(x=>x.id===id);
  if(!c.questions.length) return noContent(c,"mock exam questions");
  const n=Math.min(count || 20, c.questions.length);
  const timeMins = (n >= 40) ? 60 : 40;
  M={cert:c, idxs:sampleByDomain(c,n), i:0, picks:new Array(n).fill(null), flags:[], secs:timeMins*60, timer:null};
  M.timer=setInterval(()=>{ M.secs--; const t=$("mt"); if(t){ t.textContent=fmtT(M.secs); if(M.secs<=300)t.classList.add("low"); } if(M.secs<=0)finishMock(); },1000);
  mockQ();
}
function fmtT(s){ const m=Math.floor(s/60), ss=s%60; return m+":"+(ss<10?"0":"")+ss; }
function mockQ(){
  const c=M.cert, qi=M.idxs[M.i], q=c.questions[qi];
  renderHeader();
  let opts=''; q.opts.forEach((o,j)=>{
    const sel=M.picks[M.i]===j;
    opts+='<button class="opt'+(sel?" correct":"")+'" onclick="mockPick('+j+')"><b class="okey">'+(j+1)+'</b>'+esc(o)+'</button>';
  });
  let nav=''; M.idxs.forEach((_,k)=>{
    nav+='<button class="'+(M.picks[k]!==null?"answered ":"")+(M.flags.includes(k)?"flagged ":"")+(k===M.i?"cur":"")+'"'
      +' onclick="M.i='+k+';mockQ()" aria-label="Question '+(k+1)+(M.picks[k]!==null?", answered":", unanswered")+(M.flags.includes(k)?", flagged":"")+'">'+(k+1)+'</button>';
  });
  const answered=M.picks.filter(p=>p!==null).length;
  const flagged=M.flags.includes(M.i);
  $("app").innerHTML =
   '<button class="back" onclick="abandonMock()">← Abandon exam</button>'
   +'<div class="panel"><div class="qmeta"><span>Q '+(M.i+1)+' / '+M.idxs.length+'</span>'
   +'<span class="timer'+(M.secs<=300?" low":"")+'" id="mt">'+fmtT(M.secs)+'</span>'
   +'<span>'+answered+' answered'+(M.flags.length?' · '+M.flags.length+' 🚩':'')+'</span></div>'
   +'<div class="domtag">'+esc(c.domains[q.d])+'</div>'
   +'<div class="qtext">'+esc(q.q)+'</div>'+opts
   +'<div class="rowbtns">'
   +(M.i>0?'<button class="btn ghost sm" onclick="M.i--;mockQ()">← Prev</button>':'')
   +(M.i<M.idxs.length-1?'<button class="btn sm" onclick="M.i++;mockQ()">Next →</button>':'')
   +'<button class="btn ghost sm'+(flagged?" flagon":"")+'" onclick="toggleFlag()" aria-pressed="'+flagged+'">'
   +(flagged?"🚩 Flagged":"⚐ Flag for review")+'</button>'
   +'<button class="btn sm" style="background:var(--green); margin-left:auto;" onclick="confirmFinish()">Review & submit 🏁</button>'
   +'</div><div class="mocknav">'+nav+'</div></div>';
}
function toggleFlag(){
  const k=M.i;                       // flags track position in the paper, not question id
  const at=M.flags.indexOf(k);
  if(at>=0) M.flags.splice(at,1); else M.flags.push(k);
  mockQ();
}
/* Real proctored exams end with a review screen rather than a blind submit. */
function reviewScreen(){
  const c=M.cert;
  const un=M.idxs.map((_,k)=>k).filter(k=>M.picks[k]===null);
  const fl=M.flags.slice().sort((a,b)=>a-b);
  const chip=(k,cls)=>'<button class="'+cls+'" onclick="M.i='+k+';mockQ()">'+(k+1)+'</button>';
  $("app").innerHTML =
   '<button class="back" onclick="mockQ()">← Back to the exam</button>'
   +'<div class="panel"><h2 style="font-size:19px;">Review before submitting</h2>'
   +'<div class="qmeta" style="margin-top:8px;"><span class="timer'+(M.secs<=300?" low":"")+'" id="mt">'+fmtT(M.secs)+' left</span>'
   +'<span>'+(M.idxs.length-un.length)+' / '+M.idxs.length+' answered</span></div>'
   +'<div style="margin-top:14px;"><h4 style="font-size:13.5px;">Unanswered ('+un.length+')</h4>'
   +'<div class="mocknav">'+(un.length?un.map(k=>chip(k,"")).join(""):'<span style="font-size:13px; color:var(--muted);">None — every question has an answer.</span>')+'</div></div>'
   +'<div style="margin-top:14px;"><h4 style="font-size:13.5px;">Flagged for review ('+fl.length+')</h4>'
   +'<div class="mocknav">'+(fl.length?fl.map(k=>chip(k,"flagged")).join(""):'<span style="font-size:13px; color:var(--muted);">None flagged.</span>')+'</div></div>'
   +'<div class="rowbtns" style="margin-top:18px;"><button class="btn ghost" onclick="mockQ()">Keep working</button>'
   +'<button class="btn" style="background:var(--green);" onclick="finishMock()">Submit for scoring 🏁</button></div></div>';
}
function mockPick(j){ M.picks[M.i]= (M.picks[M.i]===j? null : j); if(M.i<M.idxs.length-1){M.i++;} mockQ(); }
function abandonMock(){ if(confirm("Abandon this mock exam? No score will be recorded.")){ clearInterval(M.timer); certView(M.cert.id); } }
function confirmFinish(){ reviewScreen(); }
function finishMock(){
  clearInterval(M.timer);
  const c=M.cert;
  let correct=0; const missed=[];
  M.idxs.forEach((qi,k)=>{ const ok=M.picks[k]===c.questions[qi].a; if(ok)correct++; else missed.push(qi); recordAnswer(c,qi,ok); });
  const scaled=Math.round(100+900*(correct/M.idxs.length));
  const pass=scaled>=720;
  S.mocks[c.id]=S.mocks[c.id]||[]; S.mocks[c.id].push(scaled); save();
  award("mock1"); if(pass)award("pass_"+c.id);
  addXP(20+correct*5, "mock exam");
  renderHeader(); if(pass)confetti();
  /* A bare score says nothing actionable. The per-domain split is what turns a
     mock into a study plan, so it leads the results and links into drilling. */
  const dstat={};
  M.idxs.forEach((qi,k)=>{
    const d=c.questions[qi].d;
    const s=dstat[d]=dstat[d]||{s:0,c:0};
    s.s++; if(M.picks[k]===c.questions[qi].a)s.c++;
  });
  const ordered=Object.keys(dstat).map(Number).sort((a,b)=>(dstat[a].c/dstat[a].s)-(dstat[b].c/dstat[b].s));
  let domHtml='<div class="dombreak"><h4>📊 How you did by domain</h4>';
  ordered.forEach(d=>{
    const s=dstat[d], pc=Math.round(s.c/s.s*100);
    const li=lessonForDomain(c,d);
    domHtml+='<div class="dombar"><div class="dl"><span>'+esc(c.domains[d])+'</span><span class="pc">'+pc+'% ('+s.c+'/'+s.s+')</span></div>'
      +'<div class="pbar"><div style="width:'+pc+'%; background:'+(pc>=70?"var(--green)":pc>=50?"var(--gold)":"var(--red)")+'"></div></div>'
      +'<div class="wact" style="margin-top:7px;"><button class="btn ghost sm" onclick="startDrill(\''+c.id+'\','+d+')">🩹 Drill</button>'
      +(li>=0?'<button class="btn ghost sm" onclick="lessonView(\''+c.id+'\','+li+')">📖 Lesson</button>':'')
      +'</div></div>';
  });
  const worst=ordered[0];
  domHtml+='<p style="font-size:12.5px; color:var(--muted); margin-top:8px;">Weakest here: <b>'+esc(c.domains[worst])+'</b>'
    +' — drill it, or read the lesson that covers it.</p></div>';
  let missHtml='';
  if(missed.length){
    missHtml='<div style="text-align:left; margin-top:16px;"><h4 style="font-size:14px; margin-bottom:8px;">📝 Review your misses</h4>';
    missed.slice(0,8).forEach(qi=>{
      const q=c.questions[qi];
      missHtml+='<div class="exp show" style="margin-bottom:10px;"><b>'+esc(q.q)+'</b><br>✅ '+esc(q.opts[q.a])+'<br><span style="color:var(--muted)">'+esc(q.exp)+'</span></div>';
    });
    if(missed.length>8) missHtml+='<div class="subtext">…and '+(missed.length-8)+' more. Hit Quiz Battle to drill them.</div>';
    missHtml+='</div>';
  }
  $("app").innerHTML='<div class="panel center"><h2 style="font-size:20px;">'+c.code+' Mock Exam Results</h2>'
   +'<div class="bigscore" style="color:'+(pass?"var(--green)":"var(--red)")+'">'+scaled+'</div>'
   +'<div class="verdict '+(pass?"pass":"fail")+'">'+(pass?"Cleared the 720 practice benchmark! 🎉":"Below the 720 practice benchmark — keep drilling!")+'</div>'
   +'<div class="subtext">'+correct+'/'+M.idxs.length+' correct · practice score on a 100–1000 scale · 720 is this app\'s own benchmark, not a verified official pass mark</div>'
   +domHtml
   +missHtml
   +'<div class="rowbtns" style="justify-content:center;"><button class="btn" onclick="startMock(\''+c.id+'\')">⏱️ Retake mock</button>'
   +'<button class="btn ghost" onclick="startDrill(\''+c.id+'\','+worst+')">🩹 Drill '+esc(c.domains[worst])+'</button>'
   +'<button class="btn ghost" onclick="certView(\''+c.id+'\')">Back to '+c.code+'</button></div></div>';
}

/* ================= KEYBOARD =================
   Drilling speed matters when you are doing hundreds of reps, so every
   answer path is reachable without the mouse. Handlers read the live DOM
   rather than tracking screen state, so they stay correct as views change. */
document.addEventListener("keydown", e=>{
  const tag=(e.target&&e.target.tagName||"").toLowerCase();
  if(tag==="input"||tag==="textarea") return;

  // Shortcuts with Ctrl / Meta
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "k" || e.key === "K") { e.preventDefault(); openSearchModal(); return; }
    if (e.key === "b" || e.key === "B") { e.preventDefault(); bookmarksView(); return; }
    if (e.key === "m" || e.key === "M") { e.preventDefault(); toggleSound(); return; }
    if (e.key === "t" || e.key === "T") { e.preventDefault(); cycleTheme(); return; }
    if (e.key === "/" || e.key === "?") { e.preventDefault(); openShortcutsModal(); return; }
  }

  // Escape to close modals or back
  if (e.key === "Escape") {
    const m = document.querySelector(".modal-overlay");
    if (m) { m.remove(); return; }
  }

  if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    openShortcutsModal();
    return;
  }

  // F to toggle flag in mock
  if ((e.key === "f" || e.key === "F") && typeof M !== 'undefined' && M && Array.isArray(M.idxs)) {
    e.preventDefault();
    if (typeof toggleFlag === 'function') toggleFlag(M.i);
    return;
  }

  if(e.metaKey||e.ctrlKey||e.altKey) return;
  const card=$("fc");
  const opts=[...document.querySelectorAll(".opt")];
  const next=$("nextb");

  if(card){                                          // flashcards
    if(e.key===" "||e.key==="Enter"){ e.preventDefault(); card.classList.toggle("flip"); }
    else if(e.key==="1"){ e.preventDefault(); gradeCard(false); }
    else if(e.key==="2"){ e.preventDefault(); gradeCard(true); }
    return;
  }
  if(next&&next.style.display!=="none"&&(e.key==="Enter"||e.key===" ")){  // advance after answering
    e.preventDefault(); nextQ(); return;
  }
  if(opts.length&&/^[1-9]$/.test(e.key)){            // quiz and mock share .opt
    const i=+e.key-1;
    if(i<opts.length&&!opts[i].disabled){ e.preventDefault(); opts[i].click(); }
  }
});

/* boot happens after data loads (bottom of file) */
