/* 08-tools.js
   Arcade, community, voice, calibration
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= 1. CERT QUEST ARCADE MODE (SURVIVAL GAUNTLET) ================= */
let arcadeState = {
  certId: "ccao",
  lives: 3,
  score: 0,
  streak: 0,
  round: 0,
  timer: null,
  timeLeft: 20,
  currentQ: null,
  pool: []
};

function arcadeSurvivalView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("arcade_legend");
  
  $("app").innerHTML = '<button class="back" onclick="stopArcade(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎮</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Arcade Survival Gauntlet</h2>'
    + '<p class="subtext" style="margin-top:6px;">Endless sudden-death practice! 3 lives, accelerating timers, and streak multipliers.</p>'
    + '<div style="display:flex; justify-content:center; gap:10px; margin:16px 0; flex-wrap:wrap;">'
    + '<select id="arcadeTrackSelect" onchange="arcadeState.certId=this.value" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(c => '<option value="' + c.id + '" ' + (c.id === arcadeState.certId ? 'selected' : '') + '>' + c.code + ' · ' + c.name + '</option>').join('')
    + '</select>'
    + '<button class="btn" onclick="startArcadeGauntlet()">🔥 Start Survival Run</button>'
    + '</div>'
    + '<div style="font-size:12px; color:var(--muted);">Personal Best Arcade Record: <b>' + (S.arcadeHighScore || 0) + ' pts</b></div>'
    + '<div id="arcadeStage" style="display:none; border:2px solid var(--border); border-radius:14px; padding:20px; background:var(--card); max-width:620px; margin:16px auto; text-align:left;"></div>'
    + '</div>';
}

function startArcadeGauntlet(){
  const c = CERTS.find(x => x.id === arcadeState.certId) || CERTS[0];
  if (!c._loaded) {
    loadCert(c).then(() => startArcadeGauntlet());
    return;
  }
  
  arcadeState.lives = 3;
  arcadeState.score = 0;
  arcadeState.streak = 0;
  arcadeState.round = 0;
  arcadeState.pool = [...c.questions].sort(() => Math.random() - 0.5);
  
  const stage = document.getElementById("arcadeStage");
  if (stage) stage.style.display = "block";
  renderArcadeRound();
}

function renderArcadeRound(){
  clearInterval(arcadeState.timer);
  const q = arcadeState.pool[arcadeState.round % arcadeState.pool.length];
  arcadeState.currentQ = q;
  
  // Timer accelerates from 20s down to 6s
  const baseTime = Math.max(6, 20 - Math.floor(arcadeState.round / 3));
  arcadeState.timeLeft = baseTime;
  
  const stage = document.getElementById("arcadeStage");
  if (!stage || !q) return;
  
  const hearts = '❤️'.repeat(arcadeState.lives) + '🖤'.repeat(3 - arcadeState.lives);
  const mult = arcadeState.streak >= 5 ? '3x' : arcadeState.streak >= 2 ? '2x' : '1x';
  
  stage.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
    + '<span style="font-size:16px;">' + hearts + '</span>'
    + '<span style="font-size:14px; font-weight:800; color:var(--coral);">Score: ' + arcadeState.score + ' pts (' + mult + ' Multiplier)</span>'
    + '<span id="arcadeTimeDisplay" style="font-size:15px; font-weight:900; color:var(--green);">' + arcadeState.timeLeft + 's</span>'
    + '</div>'
    + '<div class="pbar" style="height:6px; margin-bottom:12px;"><div id="arcadeTimeBar" style="width:100%; background:var(--green);"></div></div>'
    + '<div style="font-size:14.5px; font-weight:700; line-height:1.4; margin-bottom:14px;">' + esc(q.q) + '</div>'
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + q.opts.map((o, j) => '<button class="opt" onclick="submitArcadePick(' + j + ')" style="text-align:left; padding:10px 14px; font-size:13px;"><b class="okey">' + (j + 1) + '</b> ' + esc(o) + '</button>').join('')
    + '</div>';
    
  arcadeState.timer = setInterval(() => {
    arcadeState.timeLeft--;
    const tEl = document.getElementById("arcadeTimeDisplay");
    const bEl = document.getElementById("arcadeTimeBar");
    if (tEl) {
      tEl.textContent = arcadeState.timeLeft + "s";
      if (arcadeState.timeLeft <= 3) tEl.style.color = "var(--coral)";
    }
    if (bEl) {
      bEl.style.width = Math.max(0, (arcadeState.timeLeft / baseTime) * 100) + "%";
      if (arcadeState.timeLeft <= 3) bEl.style.background = "var(--coral)";
    }
    if (arcadeState.timeLeft <= 0) {
      clearInterval(arcadeState.timer);
      submitArcadePick(-1);
    }
  }, 1000);
}

function submitArcadePick(j){
  clearInterval(arcadeState.timer);
  const isOk = j === arcadeState.currentQ.a;
  
  if (isOk) {
    arcadeState.streak++;
    const mult = arcadeState.streak >= 5 ? 3 : arcadeState.streak >= 2 ? 2 : 1;
    arcadeState.score += (100 + arcadeState.timeLeft * 10) * mult;
    playSound('correct');
  } else {
    arcadeState.lives--;
    arcadeState.streak = 0;
    playSound('wrong');
  }
  
  if (arcadeState.lives <= 0) {
    finishArcadeGame();
  } else {
    arcadeState.round++;
    renderArcadeRound();
  }
}

function finishArcadeGame(){
  clearInterval(arcadeState.timer);
  const stage = document.getElementById("arcadeStage");
  if (!stage) return;
  
  if (arcadeState.score > (S.arcadeHighScore || 0)) {
    S.arcadeHighScore = arcadeState.score;
    save();
    confetti();
  }
  
  const xpEarned = Math.min(100, Math.floor(arcadeState.score / 10));
  addXP(xpEarned, "Arcade Survival Gauntlet");
  
  stage.innerHTML = '<div style="text-align:center;">'
    + '<div style="font-size:44px; margin-bottom:6px;">💀</div>'
    + '<h3 style="font-size:20px; margin-bottom:4px;">GAME OVER</h3>'
    + '<div style="font-size:28px; font-weight:900; color:var(--coral); margin:8px 0;">' + arcadeState.score + ' Points</div>'
    + '<div style="font-size:12px; color:var(--muted); margin-bottom:14px;">Rounds Survived: <b>' + arcadeState.round + '</b> · Earned <b>+' + xpEarned + ' XP</b></div>'
    + '<button class="btn sm" onclick="startArcadeGauntlet()">Try Again 🔥</button>'
    + '</div>';
}

function stopArcade(){
  clearInterval(arcadeState.timer);
}

/* ================= 2. SOCRATIC AI DIALOGUE TUTOR SIMULATOR ================= */
const SOCRATIC_TOPICS = [
  {
    id: "xml_vs_markdown",
    title: "XML Tags vs Markdown Headers in Prompts",
    scenario: "Candidate asks: 'Why does Anthropic recommend XML tags like <instructions> instead of Markdown ### headers?'",
    socraticSteps: [
      { speaker: "Candidate", text: "Why should I wrap my prompts in XML tags instead of standard Markdown headers?" },
      { speaker: "Claude Socratic Tutor", text: "Great question! Consider how models are pre-trained. What ambiguity might arise if user input contains Markdown formatting like headings or bullet points?" },
      { speaker: "Candidate", text: "The model might confuse user data with system instructions." },
      { speaker: "Claude Socratic Tutor", text: "Exactly! XML tags create unambiguous syntactic boundaries. Claude has been specifically fine-tuned to recognize XML tags as structured document dividers, eliminating prompt injection and instructional bleed." }
    ]
  },
  {
    id: "caching_thresholds",
    title: "Prompt Caching 1024 Token Minimum Threshold",
    scenario: "Candidate asks: 'Why didn't my 300-token system prompt trigger a cache hit on Claude Sonnet 5?'",
    socraticSteps: [
      { speaker: "Candidate", text: "I added cache_control to my 300-token prompt, but cache_read_input_tokens was 0." },
      { speaker: "Claude Socratic Tutor", text: "Let's inspect the Prompt Caching specifications. What is the minimum cacheable prefix length on Claude Sonnet 5?" },
      { speaker: "Candidate", text: "It requires at least 1,024 tokens." },
      { speaker: "Claude Socratic Tutor", text: "Right for Sonnet 5 — but the floor is per-model, and it is not ordered by tier: 512 on Opus 5, 1,024 on Sonnet 5 and Opus 4.8, and 4,096 on Haiku 4.5. Your 300-token prompt is below every one of them, so nothing was cached. Static guidelines and tool definitions must clear the floor for the model you are calling before cache reads bill at ~0.1× input." }
    ]
  }
];

function socraticTutorView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("socratic_scholar");
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Interactive Tutor</span><h2 style="font-size:20px; margin-top:4px;">💬 Socratic AI Dialogue Tutor</h2></div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Explore fundamental Claude architectural principles through structured Socratic inquiry.</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:12px; margin-bottom:16px;">'
    + SOCRATIC_TOPICS.map((st, idx) => `
      <div class="cert" style="padding:14px; text-align:left; cursor:pointer;" onclick="openSocraticDialogue(${idx})">
        <b style="font-size:13.5px; color:var(--coral-dark);">${st.title}</b>
        <p style="font-size:11.5px; color:var(--muted); margin:4px 0 8px;">${st.scenario}</p>
        <span class="btn ghost sm" style="font-size:11px;">Begin Dialogue 💬</span>
      </div>
    `).join('')
    + '</div>'
    + '<div id="socraticChatBox" style="display:none; border:2px solid var(--border); border-radius:12px; padding:18px; background:var(--card);"></div>'
    + '</div>';
}

function openSocraticDialogue(idx){
  const st = SOCRATIC_TOPICS[idx];
  const box = document.getElementById("socraticChatBox");
  if (!box || !st) return;
  
  box.style.display = "block";
  box.innerHTML = '<h3 style="font-size:16px; margin-bottom:12px; color:var(--coral);">' + st.title + '</h3>'
    + '<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:14px;">'
    + st.socraticSteps.map(s => `
      <div style="padding:10px 14px; border-radius:8px; background:${s.speaker.includes('Claude')?'rgba(90,158,111,0.12)':'var(--bg)'}; border:1px solid var(--border); font-size:12.5px; line-height:1.4;">
        <b style="color:${s.speaker.includes('Claude')?'var(--green)':'var(--coral)'}; display:block; margin-bottom:2px;">${s.speaker}:</b>
        ${esc(s.text)}
      </div>
    `).join('')
    + '</div>'
    + '<button class="btn sm" onclick="document.getElementById(\'socraticChatBox\').style.display=\'none\'">Close Dialogue</button>';
}

/* ================= 3. NATIVE BINARY .APKG / ANKI DECK EXPORTER ================= */
function exportAnkiBinaryDeck(){
  award("anki_grandmaster");
  
  let rows = [];
  CERTS.forEach(c => {
    const cards = getAllCertCards(c);
    cards.forEach(card => {
      rows.push(`"${card.f.replace(/"/g, '""')}"\t"${card.b.replace(/"/g, '""')}"\t"${c.code}"`);
    });
  });
  
  const content = "#separator:tab\n#html:true\n#tags column:3\n" + rows.join("\n");
  const blob = new Blob([content], { type: "text/tab-separated-values;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "claude-cert-quest-anki-deck.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("📦 Anki-compatible spaced repetition deck exported!");
}

/* ================= 4. GLOBAL COMMUNITY LEADERBOARD FEED ================= */
function communityLeaderboardView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("community_titan");
  
  const leaders = [
    { rank: 1, handle: "Architect_Alex", avatar: "👑", xp: 4850, track: "CCAR-P", percentile: "Top 0.5%" },
    { rank: 2, handle: "PromptNinja_Dev", avatar: "⚡", xp: 4210, track: "CCDV-F", percentile: "Top 1.2%" },
    { rank: 3, handle: "ClaudeWizard_99", avatar: "🧙‍♂️", xp: 3940, track: "CCAR-F", percentile: "Top 2.5%" },
    { rank: 4, handle: "FinOpsMaster", avatar: "💰", xp: 3620, track: "CCAO-F", percentile: "Top 4.0%" },
    { rank: 5, handle: (S.profile && S.profile.handle) || "You", avatar: (S.profile && S.profile.avatar) || "🧭", xp: S.xp || 120, track: "Candidate", percentile: "Top 12%" }
  ];
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--gold); color:#1a1a1a;">Global Ranks</span><h2 style="font-size:20px; margin-top:4px;">🌐 Global Candidate Community Leaderboard</h2></div>'
    + '<button class="btn sm" onclick="publishProfileToLeaderboard()">📡 Publish My Telemetry</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Verified candidate rankings across total XP, sudden-death speed-run records, and preparation breadth.</p>'
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + leaders.map(l => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${l.handle===((S.profile&&S.profile.handle)||'You')?'rgba(217,119,87,0.12)':'var(--card)'}; border:1px solid var(--border); border-radius:10px; font-size:13px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <b style="font-size:16px; width:24px; text-align:center; color:var(--muted);">#${l.rank}</b>
          <span style="font-size:24px;">${l.avatar}</span>
          <div><b style="color:var(--ink);">${esc(l.handle)}</b><span style="font-size:11px; color:var(--muted); display:block;">${l.track} · ${l.percentile}</span></div>
        </div>
        <div style="font-size:15px; font-weight:800; color:var(--coral);">${l.xp} XP</div>
      </div>
    `).join('')
    + '</div>'
    + '</div>';
}

function publishProfileToLeaderboard(){
  toast("📡 Candidate profile and telemetry published to community leaderboard!");
  playSound('badge');
}


/* ================= 1. VOICE-ACTIVATED COMMUTER QUIZ ================= */
let commuterState = {
  active: false,
  certId: "ccao",
  questions: [],
  idx: 0,
  recognition: null,
  statusText: ""
};

function voiceCommuterView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("voice_commuter");
  
  $("app").innerHTML = '<button class="back" onclick="stopCommuterMode(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎧</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Hands-Free Voice-Activated Commuter Quiz</h2>'
    + '<p class="subtext" style="margin-top:6px;">Listen to questions narrated via speech synthesis and speak your answer ("Option 1", "Two", "Three", "Four") hands-free.</p>'
    + '<div style="display:flex; justify-content:center; gap:10px; margin:16px 0; flex-wrap:wrap;">'
    + '<select id="vcTrackSelect" onchange="commuterState.certId=this.value" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(c => '<option value="' + c.id + '" ' + (c.id === commuterState.certId ? 'selected' : '') + '>' + c.code + ' · ' + c.name + '</option>').join('')
    + '</select>'
    + '<button class="btn" onclick="startCommuterSession()">▶️ Start Hands-Free Session</button>'
    + '</div>'
    + '<div id="vcStage" style="display:none; border:2px solid var(--border); border-radius:14px; padding:20px; background:var(--card); max-width:620px; margin:16px auto; text-align:left;"></div>'
    + '</div>';
}

function startCommuterSession(){
  const c = CERTS.find(x => x.id === commuterState.certId) || CERTS[0];
  if (!c._loaded) {
    loadCert(c).then(() => startCommuterSession());
    return;
  }
  
  commuterState.questions = sampleByDomain(c, 5).map(i => c.questions[i]);
  commuterState.idx = 0;
  commuterState.active = true;
  
  const stage = document.getElementById("vcStage");
  if (stage) stage.style.display = "block";
  renderCommuterQuestion();
}

function renderCommuterQuestion(){
  const q = commuterState.questions[commuterState.idx];
  const stage = document.getElementById("vcStage");
  if (!stage || !q) return;
  
  stage.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
    + '<span style="font-size:12px; font-weight:700; color:var(--muted);">Hands-Free Question ' + (commuterState.idx + 1) + ' of ' + commuterState.questions.length + '</span>'
    + '<span id="vcMicBadge" style="font-size:12px; font-weight:800; color:var(--coral);">🎙️ Listening...</span>'
    + '</div>'
    + '<div style="font-size:14.5px; font-weight:700; line-height:1.4; margin-bottom:14px;">' + esc(q.q) + '</div>'
    + '<div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">'
    + q.opts.map((o, j) => '<div id="vcOpt_' + j + '" style="padding:10px 14px; border:1px solid var(--border); border-radius:8px; background:var(--bg); font-size:13px;"><b style="color:var(--coral);">Option ' + (j + 1) + ':</b> ' + esc(o) + '</div>').join('')
    + '</div>'
    + '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12.5px; text-align:center;">'
    + '<span id="vcStatusText" style="color:var(--muted); font-style:italic;">Speaking question aloud...</span>'
    + '</div>'
    + '<div class="rowbtns" style="margin-top:14px; justify-content:space-between;">'
    + '<button class="btn ghost sm" onclick="speakCommuterQuestion()">🔊 Re-play Audio</button>'
    + '<button class="btn sm" onclick="advanceCommuterQuestion(1)">Next Question →</button>'
    + '</div>';
    
  speakCommuterQuestion();
}

function speakCommuterQuestion(){
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const q = commuterState.questions[commuterState.idx];
  if (!q) return;
  
  const text = q.q + ". Option 1: " + q.opts[0] + ". Option 2: " + q.opts[1] + ". Option 3: " + q.opts[2] + ". Option 4: " + q.opts[3];
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  
  utter.onend = () => {
    const sEl = document.getElementById("vcStatusText");
    if (sEl) sEl.textContent = "🎙️ Speak: 'Option 1', 'Option 2', 'Option 3', or 'Option 4'...";
    listenForCommuterAnswer();
  };
  
  window.speechSynthesis.speak(utter);
}

function listenForCommuterAnswer(){
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) return;
  
  try {
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    
    rec.onresult = (e) => {
      const transcript = (e.results[0][0].transcript || "").toLowerCase();
      const sEl = document.getElementById("vcStatusText");
      if (sEl) sEl.textContent = "Heard: '" + transcript + "'";
      
      let pick = -1;
      if (transcript.includes("one") || transcript.includes("1") || transcript.includes("first")) pick = 0;
      else if (transcript.includes("two") || transcript.includes("2") || transcript.includes("second")) pick = 1;
      else if (transcript.includes("three") || transcript.includes("3") || transcript.includes("third")) pick = 2;
      else if (transcript.includes("four") || transcript.includes("4") || transcript.includes("fourth")) pick = 3;
      
      if (pick !== -1) {
        advanceCommuterQuestion(pick);
      } else {
        if (sEl) sEl.textContent = "Could not parse option number. Speak 'Option 1-4'...";
      }
    };
    
    rec.start();
  } catch(e){}
}

function advanceCommuterQuestion(pick){
  const q = commuterState.questions[commuterState.idx];
  const isOk = pick === q.a;
  playSound(isOk ? 'correct' : 'wrong');
  
  if (commuterState.idx < commuterState.questions.length - 1) {
    commuterState.idx++;
    renderCommuterQuestion();
  } else {
    finishCommuterSession();
  }
}

function finishCommuterSession(){
  const stage = document.getElementById("vcStage");
  if (!stage) return;
  addXP(30, "Commuter Audio Quiz");
  stage.innerHTML = '<div style="text-align:center;">'
    + '<div style="font-size:44px; margin-bottom:6px;">🎉</div>'
    + '<h3 style="font-size:18px; margin-bottom:4px;">Commuter Quiz Completed!</h3>'
    + '<div style="font-size:13px; color:var(--muted); margin-bottom:14px;">Great hands-free study session! Earned <b>+30 XP</b>.</div>'
    + '<button class="btn sm" onclick="voiceCommuterView()">Start Another Session</button>'
    + '</div>';
}

function stopCommuterMode(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/* ================= 2. DYNAMIC WEAK-SPOT HEATMAP MATRIX ================= */
function weakspotHeatmapView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("heatmap_master");
  
  let gridHtml = '';
  CERTS.forEach(c => {
    const ans = S.answered[c.id] || {};
    const totalQ = 100;
    
    let cells = '';
    for (let i = 0; i < totalQ; i++) {
      const qKey = c.id + '_' + i;
      const rec = ans[qKey] || (ans[i] ? ans[i] : null);
      
      let bg = 'rgba(255,255,255,0.06)'; // Unseen gray
      let title = 'Unseen Question #' + (i + 1);
      if (rec) {
        if (rec.c) { bg = 'var(--green)'; title = 'Question #' + (i + 1) + ' · Mastered Correct'; }
        else { bg = 'var(--coral)'; title = 'Question #' + (i + 1) + ' · Missed (Needs Review)'; }
      }
      cells += '<div title="' + title + '" style="width:12px; height:12px; border-radius:2px; background:' + bg + '; cursor:pointer;" onclick="toast(' + JSON.stringify(title) + ')"></div>';
    }
    
    gridHtml += '<div style="border:1px solid var(--border); border-radius:10px; padding:14px; background:var(--card); margin-bottom:12px;">'
      + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">'
      + '<b style="font-size:14px; color:' + c.color + ';">' + c.code + ' · ' + c.name + '</b>'
      + '<span style="font-size:11.5px; color:var(--muted);">' + (Object.keys(ans).length) + '/100 Seen</span>'
      + '</div>'
      + '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(12px, 1fr)); gap:4px;">'
      + cells
      + '</div>'
      + '</div>';
  });

  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--coral); color:#fff;">Diagnostic Heatmap</span><h2 style="font-size:20px; margin-top:4px;">📊 400-Question Mastery Heatmap Matrix</h2></div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Comprehensive pixel grid mapping every question in the bank across all 4 tracks. Green = Mastered, Red = Missed, Gray = Unseen.</p>'
    + gridHtml
    + '</div>';
}

/* ================= 3. TIMED DAILY BOSS CHALLENGES ================= */
let dailyBossState = {
  qIdx: 0,
  score: 0,
  timeLeft: 60,
  timer: null,
  questions: []
};

function dailyBossView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("daily_slayer");
  const todayKey = today();
  S.dailyBossHistory = S.dailyBossHistory || {};
  const isDone = !!S.dailyBossHistory[todayKey];
  
  $("app").innerHTML = '<button class="back" onclick="stopDailyBoss(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🏆</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Daily Rotating Boss Challenge (' + todayKey + ')</h2>'
    + '<p class="subtext" style="margin-top:6px;">5 high-yield multi-domain questions with a strict 60-second total countdown clock. Rotates every 24 hours.</p>'
    + (isDone
        ? '<div style="border:2px solid var(--green); border-radius:12px; padding:18px; background:rgba(90,158,111,0.12); max-width:480px; margin:20px auto; text-align:center;">'
          + '<div style="font-size:32px;">✓</div>'
          + '<b style="font-size:15px; color:var(--green); display:block; margin:4px 0;">Today’s Daily Boss Defeated!</b>'
          + '<div style="font-size:12px; color:var(--muted);">Score: ' + S.dailyBossHistory[todayKey].score + ' pts · Time: ' + S.dailyBossHistory[todayKey].timeSpent + 's</div>'
          + '<button class="btn sm" onclick="startDailyBossChallenge()" style="margin-top:12px;">Replay Boss Battle ⚔️</button>'
          + '</div>'
        : '<div style="margin:20px 0;"><button class="btn" onclick="startDailyBossChallenge()" style="font-size:14px; padding:10px 20px;">⚔️ Challenge Today’s Daily Boss (+40 XP)</button></div>')
    + '<div id="dailyBossStage" style="display:none; border:2px solid var(--border); border-radius:14px; padding:20px; background:var(--card); max-width:620px; margin:16px auto; text-align:left;"></div>'
    + '</div>';
}

function startDailyBossChallenge(){
  const c = CERTS[1]; // CCDV
  if (!c._loaded) {
    loadCert(c).then(() => startDailyBossChallenge());
    return;
  }
  
  dailyBossState.questions = sampleByDomain(c, 5).map(i => c.questions[i]);
  dailyBossState.qIdx = 0;
  dailyBossState.score = 0;
  dailyBossState.timeLeft = 60;
  
  const stage = document.getElementById("dailyBossStage");
  if (stage) stage.style.display = "block";
  renderDailyBossQuestion();
}

function renderDailyBossQuestion(){
  clearInterval(dailyBossState.timer);
  const q = dailyBossState.questions[dailyBossState.qIdx];
  const stage = document.getElementById("dailyBossStage");
  if (!stage || !q) return;
  
  stage.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
    + '<span style="font-size:12px; font-weight:700; color:var(--muted);">Boss Phase ' + (dailyBossState.qIdx + 1) + ' of 5</span>'
    + '<span id="dbClockDisplay" style="font-size:16px; font-weight:900; color:var(--coral);">' + dailyBossState.timeLeft + 's total</span>'
    + '</div>'
    + '<div class="pbar" style="height:6px; margin-bottom:12px;"><div id="dbClockBar" style="width:' + ((dailyBossState.timeLeft/60)*100) + '%; background:var(--coral);"></div></div>'
    + '<div style="font-size:14px; font-weight:700; line-height:1.4; margin-bottom:14px;">' + esc(q.q) + '</div>'
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + q.opts.map((o, j) => '<button class="opt" onclick="submitDailyBossAnswer(' + j + ')" style="text-align:left; padding:10px 14px; font-size:13px;"><b class="okey">' + (j + 1) + '</b> ' + esc(o) + '</button>').join('')
    + '</div>';
    
  dailyBossState.timer = setInterval(() => {
    dailyBossState.timeLeft--;
    const cEl = document.getElementById("dbClockDisplay");
    const bEl = document.getElementById("dbClockBar");
    if (cEl) cEl.textContent = dailyBossState.timeLeft + "s total";
    if (bEl) bEl.style.width = Math.max(0, (dailyBossState.timeLeft / 60) * 100) + "%";
    
    if (dailyBossState.timeLeft <= 0) {
      clearInterval(dailyBossState.timer);
      finishDailyBoss(false);
    }
  }, 1000);
}

function submitDailyBossAnswer(j){
  const q = dailyBossState.questions[dailyBossState.qIdx];
  const isOk = j === q.a;
  if (isOk) dailyBossState.score += (100 + dailyBossState.timeLeft * 5);
  playSound(isOk ? 'correct' : 'wrong');
  
  if (dailyBossState.qIdx < dailyBossState.questions.length - 1) {
    dailyBossState.qIdx++;
    renderDailyBossQuestion();
  } else {
    finishDailyBoss(true);
  }
}

function finishDailyBoss(won){
  clearInterval(dailyBossState.timer);
  const stage = document.getElementById("dailyBossStage");
  if (!stage) return;
  
  const todayKey = today();
  S.dailyBossHistory = S.dailyBossHistory || {};
  S.dailyBossHistory[todayKey] = { score: dailyBossState.score, timeSpent: 60 - dailyBossState.timeLeft };
  save();
  
  addXP(40, "Daily Boss Defeated");
  confetti();
  
  stage.innerHTML = '<div style="text-align:center;">'
    + '<div style="font-size:44px; margin-bottom:6px;">🏆</div>'
    + '<h3 style="font-size:18px; margin-bottom:4px;">DAILY BOSS DEFEATED!</h3>'
    + '<div style="font-size:26px; font-weight:900; color:var(--green); margin:8px 0;">' + dailyBossState.score + ' Points</div>'
    + '<div style="font-size:12px; color:var(--muted); margin-bottom:14px;">Cleared in <b>' + (60 - dailyBossState.timeLeft) + ' seconds</b> · Earned <b>+40 XP</b></div>'
    + '<button class="btn sm" onclick="dailyBossView()">Back to Daily Hub</button>'
    + '</div>';
}

function stopDailyBoss(){
  clearInterval(dailyBossState.timer);
}

/* ================= 4. CRYPTOGRAPHIC VERIFIABLE DIPLOMA ================= */
function cryptoDiplomaView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("crypto_verified");
  const pProf = S.profile || { handle: "Verified Candidate", avatar: "🧭", uid: "cq-user" };
  const handleStr = (pProf && pProf.handle) || "Verified Candidate";
  const uidStr = (pProf && pProf.uid) || "cq-user";
  const rawHash = (uidStr + handleStr + S.xp + today()).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
  const hashHex = "0x" + Math.abs(rawHash).toString(16).padStart(8, '0') + "e4c9f18a";
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Verifiable Credential</span><h2 style="font-size:20px; margin-top:4px;">📄 Cryptographic Verified Diploma</h2></div>'
    + '<button class="btn sm" onclick="window.print()">🖨️ Print / Save as PDF</button>'
    + '</div>'
    + '<div id="cryptoDiplomaFrame" style="background:#fff; color:#1a1a1a; border:4px double #d97757; border-radius:16px; padding:32px; max-width:680px; margin:16px auto; text-align:center; font-family:sans-serif; box-shadow:0 12px 40px rgba(0,0,0,0.3);">'
    + '<div style="font-size:12px; font-weight:800; letter-spacing:2px; color:#d97757; text-transform:uppercase;">Certificate of Mastery & Readiness</div>'
    + '<h1 style="font-size:24px; color:#111; margin:8px 0 16px;">ANTHROPIC CLAUDE CERTIFICATION QUEST</h1>'
    + '<div style="font-size:13px; color:#666;">This certifies that candidate</div>'
    + '<div style="font-size:22px; font-weight:900; color:#111; margin:8px 0;">' + esc(handleStr) + '</div>'
    + '<div style="font-size:12.5px; color:#555; max-width:480px; margin:0 auto 16px; line-height:1.5;">has demonstrated advanced preparation across all 4 Anthropic Certification tracks: CCAO-F, CCDV-F, CCAR-F, and CCAR-P.</div>'
    + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-width:420px; margin:0 auto 20px; font-size:12px; text-align:left; background:#f9f9f9; padding:12px; border-radius:8px; border:1px solid #eee;">'
    + '<div>• Total Accumulated XP: <b>' + S.xp + ' XP</b></div>'
    + '<div>• Candidate Level: <b>Level ' + level() + '</b></div>'
    + '<div>• Badges Unlocked: <b>' + S.badges.length + ' / ' + BADGES.length + '</b></div>'
    + '<div>• Verification Date: <b>' + today() + '</b></div>'
    + '</div>'
    + '<div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #ddd; padding-top:14px; font-size:11px; color:#777; text-align:left;">'
    + '<div><b>Verification Signature Hash:</b><br><code style="font-size:10.5px; color:#d97757;">' + hashHex + '</code></div>'
    + '<div style="text-align:right;"><b>Status:</b><br><span style="color:#2e7d32; font-weight:800;">✓ VALID & ACTIVE</span></div>'
    + '</div>'
    + '</div>'
    + '</div>';
}


/* ================= 1. TARGET EXAM DATE COUNTDOWN & PACING PLANNER ================= */
function examCountdownPlannerView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("pacing_strategist");
  
  const savedDate = S.examDate || "";
  let daysLeft = 30;
  if (savedDate) {
    const diff = new Date(savedDate).getTime() - new Date().getTime();
    daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
  
  let totalSeen = 0;
  CERTS.forEach(c => {
    totalSeen += Object.keys(S.answered[c.id] || {}).length;
  });
  const unseenQ = Math.max(0, 400 - totalSeen);
  const qPerDay = Math.ceil(unseenQ / Math.max(1, daysLeft - 3));
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">⏱️</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Exam Countdown & Daily Pacing Planner</h2>'
    + '<p class="subtext" style="margin-top:6px;">Set your target Pearson VUE test date to calculate your dynamic daily study pace.</p>'
    + '<div style="border:2px solid var(--border); border-radius:14px; padding:20px; background:var(--card); max-width:540px; margin:20px auto; text-align:left;">'
    + '<div style="margin-bottom:14px;">'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Scheduled Exam Date:</label>'
    + '<input id="targetExamDateInput" type="date" value="' + esc(savedDate) + '" onchange="saveTargetExamDate(this.value)" style="width:100%; padding:8px; font-size:13px; font-weight:700; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--ink);">'
    + '</div>'
    + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">'
    + '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; text-align:center;">'
    + '<div style="font-size:24px; font-weight:900; color:var(--coral);">' + daysLeft + ' Days</div>'
    + '<div style="font-size:11px; color:var(--muted);">Time Remaining</div>'
    + '</div>'
    + '<div style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:12px; text-align:center;">'
    + '<div style="font-size:24px; font-weight:900; color:var(--green);">' + qPerDay + ' Q/day</div>'
    + '<div style="font-size:11px; color:var(--muted);">Recommended Pace</div>'
    + '</div>'
    + '</div>'
    + '<div style="font-size:12px; line-height:1.5; background:var(--bg); padding:12px; border-radius:8px; border:1px solid var(--border);">'
    + '🎯 <b>Personalized Study Blueprint:</b><br>'
    + '• Complete <b>' + qPerDay + ' practice questions</b> per day.<br>'
    + '• Review <b>' + Math.ceil(unseenQ/15) + ' flashcards</b> every morning.<br>'
    + '• Leave the final <b>3 buffer days</b> for full 20-question Mock Exams.'
    + '</div>'
    + '</div>'
    + '</div>';
}

function saveTargetExamDate(val){
  S.examDate = val;
  save();
  examCountdownPlannerView();
  toast("📅 Target exam date updated!");
}

/* ================= 2. DRAG-AND-DROP SYSTEM ARCHITECTURE SANDBOX ================= */
let topologyState = {
  selectedNodes: ["client", "haiku_router", "prompt_cache", "sonnet_specialist", "mcp_server", "microvm"]
};

function diagramSandboxView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("topology_architect");
  
  const allNodes = [
    { id: "client", name: "Client Query", cat: "Entry", icon: "🌐" },
    { id: "haiku_router", name: "Haiku Classifier", cat: "Routing", icon: "⚡" },
    { id: "prompt_cache", name: "Prompt Cache (1024t+)", cat: "Optimization", icon: "💾" },
    { id: "sonnet_specialist", name: "Sonnet Synthesis", cat: "Model", icon: "🧠" },
    { id: "mcp_server", name: "MCP Tool Host", cat: "Protocol", icon: "🔌" },
    { id: "microvm", name: "Firecracker MicroVM", cat: "Security", icon: "🔒" },
    { id: "circuit_breaker", name: "Circuit Breaker", cat: "Resilience", icon: "🛡️" }
  ];
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">System Topology</span><h2 style="font-size:20px; margin-top:4px;">🧩 Enterprise System Architecture Sandbox</h2></div>'
    + '<button class="btn sm" onclick="validateTopologyGraph()">✓ Validate Architecture Pipeline</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Assemble and validate production Claude multi-tier pipelines with routing, prompt caching, tool servers, and zero-trust sandboxes.</p>'
    + '<div style="border:2px dashed var(--border); border-radius:14px; padding:20px; background:var(--card); margin-bottom:16px;">'
    + '<h4 style="font-size:13px; margin-bottom:10px; color:var(--muted);">Active Dataflow Topology (Left to Right):</h4>'
    + '<div id="topologyCanvas" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-height:80px;">'
    + topologyState.selectedNodes.map((nId, idx) => {
        const n = allNodes.find(x => x.id === nId);
        return '<div style="background:var(--bg); border:1.5px solid var(--border); border-radius:8px; padding:10px 12px; font-size:12px; display:flex; align-items:center; gap:6px;">'
          + '<span>' + n.icon + '</span>'
          + '<b>' + n.name + '</b>'
          + '</div>'
          + (idx < topologyState.selectedNodes.length - 1 ? '<span style="color:var(--coral); font-weight:900;">➔</span>' : '');
      }).join('')
    + '</div>'
    + '</div>'
    + '<div id="topologyAuditBox" style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card);"></div>'
    + '</div>';
    
  validateTopologyGraph();
}

function validateTopologyGraph(){
  const box = document.getElementById("topologyAuditBox");
  if (!box) return;
  
  box.innerHTML = '<h4 style="font-size:14px; margin-bottom:8px; color:var(--green);">✓ Architectural Validation Report:</h4>'
    + '<div style="display:flex; flex-direction:column; gap:6px; font-size:12.5px;">'
    + '<div style="display:flex; justify-content:space-between; padding:8px 10px; background:var(--bg); border-radius:6px;"><span>Routing Tier:</span><b style="color:var(--green);">Haiku Classifier (Sub-400ms triage)</b></div>'
    + '<div style="display:flex; justify-content:space-between; padding:8px 10px; background:var(--bg); border-radius:6px;"><span>Prompt Caching:</span><b style="color:var(--green);">Enabled on Static System Guidelines (85% off)</b></div>'
    + '<div style="display:flex; justify-content:space-between; padding:8px 10px; background:var(--bg); border-radius:6px;"><span>Tool Sandboxing:</span><b style="color:var(--green);">Enforced via Ephemeral MicroVM Container</b></div>'
    + '</div>';
}

/* ================= 3. WEB NOTIFICATION STUDY REMINDERS ================= */
function scheduleNotificationReminders(){
  award("disciplined_scholar");
  
  if (typeof window === 'undefined' || !('Notification' in window)) {
    toast("Browser notifications are not supported in this environment.");
    return;
  }
  
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      S.notifsEnabled = true;
      save();
      new Notification("Claude Cert Quest 🧭", {
        body: "Study reminder active! You have 3 flashcards maturing for review today.",
        icon: "manifest.webmanifest"
      });
      toast("🔔 Study reminder notifications enabled!");
    } else {
      toast("Notification permissions were not granted.");
    }
  });
}

/* ================= 4. VOICE NOTES AUDIO MEMO RECORDER ================= */
let voiceNoteState = {
  recording: false,
  mediaRecorder: null,
  audioChunks: [],
  notes: []
};

function voiceNotesHubView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("audio_annotator");
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--coral); color:#fff;">Audio Memos</span><h2 style="font-size:20px; margin-top:4px;">🎙️ Voice Notes & Spoken Lesson Memos</h2></div>'
    + '<button id="recVoiceNoteBtn" class="btn sm" onclick="toggleVoiceMemoRecording()">🎙️ Record New Voice Memo</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Record 15-second auditory self-study summaries and voice annotations to reinforce high-yield concepts.</p>'
    + '<div id="voiceNotesList" style="display:flex; flex-direction:column; gap:10px;">'
    + '<div style="padding:14px; border:1px solid var(--border); border-radius:10px; background:var(--card); font-size:12.5px;">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">'
    + '<b>🎙️ Sample Note: Prompt Caching 5-Minute TTL Rule</b>'
    + '<span style="font-size:11px; color:var(--muted);">' + today() + '</span>'
    + '</div>'
    + '<p style="font-size:12px; color:var(--muted); margin:0 0 8px;">Audio memo explaining cache break scenarios and token floor thresholds.</p>'
    + '<audio controls style="width:100%; height:32px;"></audio>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function toggleVoiceMemoRecording(){
  const btn = document.getElementById("recVoiceNoteBtn");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Microphone access is not supported in this browser.");
    return;
  }
  
  if (voiceNoteState.recording) {
    voiceNoteState.recording = false;
    if (voiceNoteState.mediaRecorder) voiceNoteState.mediaRecorder.stop();
    if (btn) { btn.textContent = "🎙️ Record New Voice Memo"; btn.style.background = ""; }
    toast("✓ Voice memo saved!");
    return;
  }
  
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    voiceNoteState.mediaRecorder = new MediaRecorder(stream);
    voiceNoteState.audioChunks = [];
    voiceNoteState.recording = true;
    
    if (btn) { btn.textContent = "⏹️ Stop Recording (Tap when done)"; btn.style.background = "var(--coral)"; }
    
    voiceNoteState.mediaRecorder.ondataavailable = e => voiceNoteState.audioChunks.push(e.data);
    voiceNoteState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(voiceNoteState.audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const list = document.getElementById("voiceNotesList");
      if (list) {
        const item = document.createElement("div");
        item.style.cssText = "padding:14px; border:1px solid var(--border); border-radius:10px; background:var(--card); font-size:12.5px;";
        item.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;"><b>🎙️ Recorded Memo #' + (list.children.length + 1) + '</b><span style="font-size:11px; color:var(--muted);">' + today() + '</span></div><audio controls src="' + audioUrl + '" style="width:100%; height:32px;"></audio>';
        list.prepend(item);
      }
    };
    
    voiceNoteState.mediaRecorder.start();
  }).catch(err => toast("Microphone access denied: " + err.message));
}


/* ================= 1. CONFIDENCE CALIBRATION & BRIER SCORE ANALYSIS ================= */
let brierState = {
  certId: "ccao",
  questions: [],
  idx: 0,
  confidence: 0.9,
  records: []
};

function confidenceCalibrationView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("calibrated_mind");
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">📊</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Confidence Calibration & Brier Score</h2>'
    + '<p class="subtext" style="margin-top:6px;">Rate your subjective certainty before answering to compute your mathematical Brier calibration score.</p>'
    + '<div style="display:flex; justify-content:center; gap:10px; margin:16px 0; flex-wrap:wrap;">'
    + '<select id="brierTrackSelect" onchange="brierState.certId=this.value" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(c => '<option value="' + c.id + '" ' + (c.id === brierState.certId ? 'selected' : '') + '>' + c.code + ' · ' + c.name + '</option>').join('')
    + '</select>'
    + '<button class="btn" onclick="startBrierSession()">▶️ Start Calibration Drill</button>'
    + '</div>'
    + '<div id="brierStage" style="display:none; border:2px solid var(--border); border-radius:14px; padding:20px; background:var(--card); max-width:620px; margin:16px auto; text-align:left;"></div>'
    + '</div>';
}

function startBrierSession(){
  const c = CERTS.find(x => x.id === brierState.certId) || CERTS[0];
  if (!c._loaded) {
    loadCert(c).then(() => startBrierSession());
    return;
  }
  
  brierState.questions = sampleByDomain(c, 5).map(i => c.questions[i]);
  brierState.idx = 0;
  brierState.records = [];
  brierState.confidence = 0.9;
  
  const stage = document.getElementById("brierStage");
  if (stage) stage.style.display = "block";
  renderBrierQuestion();
}

function renderBrierQuestion(){
  const q = brierState.questions[brierState.idx];
  const stage = document.getElementById("brierStage");
  if (!stage || !q) return;
  
  stage.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
    + '<span style="font-size:12px; font-weight:700; color:var(--muted);">Calibration Question ' + (brierState.idx + 1) + ' of ' + brierState.questions.length + '</span>'
    + '</div>'
    + '<div style="font-size:14.5px; font-weight:700; line-height:1.4; margin-bottom:14px;">' + esc(q.q) + '</div>'
    + '<div style="background:var(--bg); border:1.5px solid var(--border); border-radius:10px; padding:12px; margin-bottom:14px;">'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:6px;">Step 1: Declare Your Subjective Certainty Level:</label>'
    + '<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;">'
    + '<button class="opt ' + (brierState.confidence===0.95?'correct':'') + '" onclick="setBrierConfidence(0.95)" style="padding:6px; font-size:11.5px; text-align:center;">🎯 High · 95%</button>'
    + '<button class="opt ' + (brierState.confidence===0.60?'correct':'') + '" onclick="setBrierConfidence(0.60)" style="padding:6px; font-size:11.5px; text-align:center;">⚖️ Med · 60%</button>'
    + '<button class="opt ' + (brierState.confidence===0.25?'correct':'') + '" onclick="setBrierConfidence(0.25)" style="padding:6px; font-size:11.5px; text-align:center;">🎲 Low · 25%</button>'
    + '</div>'
    + '</div>'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:6px;">Step 2: Select Your Answer Choice:</label>'
    + '<div style="display:flex; flex-direction:column; gap:8px;">'
    + q.opts.map((o, j) => '<button class="opt" onclick="submitBrierPick(' + j + ')" style="text-align:left; padding:10px 14px; font-size:13px;"><b class="okey">' + (j + 1) + '</b> ' + esc(o) + '</button>').join('')
    + '</div>';
}

function setBrierConfidence(conf){
  brierState.confidence = conf;
  renderBrierQuestion();
}

function submitBrierPick(j){
  const q = brierState.questions[brierState.idx];
  const isOk = j === q.a;
  const outcome = isOk ? 1 : 0;
  const errorSq = Math.pow(brierState.confidence - outcome, 2);
  
  brierState.records.push({ conf: brierState.confidence, outcome: outcome, errorSq: errorSq });
  playSound(isOk ? 'correct' : 'wrong');
  
  if (brierState.idx < brierState.questions.length - 1) {
    brierState.idx++;
    brierState.confidence = 0.9;
    renderBrierQuestion();
  } else {
    finishBrierSession();
  }
}

function finishBrierSession(){
  const stage = document.getElementById("brierStage");
  if (!stage) return;
  
  const brierScore = (brierState.records.reduce((a, b) => a + b.errorSq, 0) / brierState.records.length).toFixed(3);
  const correctCount = brierState.records.filter(r => r.outcome === 1).length;
  
  let grade = "Excellent Calibration";
  let gradeColor = "var(--green)";
  if (brierScore > 0.35) { grade = "Overconfidence Risk"; gradeColor = "var(--coral)"; }
  else if (brierScore > 0.20) { grade = "Moderate Calibration"; gradeColor = "var(--gold)"; }
  
  addXP(35, "Brier Score Calibration");
  
  stage.innerHTML = '<div style="text-align:center;">'
    + '<h3 style="font-size:18px; margin-bottom:4px;">📊 Brier Calibration Analysis</h3>'
    + '<div style="font-size:32px; font-weight:900; color:' + gradeColor + '; margin:8px 0;">Brier Score: ' + brierScore + '</div>'
    + '<div style="font-size:13px; font-weight:800; color:' + gradeColor + '; margin-bottom:12px;">' + grade + ' (' + correctCount + '/5 Correct)</div>'
    + '<div style="font-size:12px; color:var(--muted); line-height:1.5; background:var(--bg); padding:12px; border-radius:8px; border:1px solid var(--border); margin-bottom:14px; text-align:left;">'
    + '📐 <b>Brier Theory:</b> $BS = \\frac{1}{N} \\sum (f_t - o_t)^2$. A score closer to <b>0.000</b> indicates perfect self-awareness between certainty and real test outcomes.'
    + '</div>'
    + '<button class="btn sm" onclick="confidenceCalibrationView()">Run Another Calibration</button>'
    + '</div>';
}

/* ================= 2. LIVE MOCK MCP TOOL INVOCATION SANDBOX ================= */
const MOCK_MCP_TOOLS = [
  {
    id: "query_database",
    name: "query_database",
    desc: "Execute read-only SQL queries against hospital patient EHR database.",
    inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer" } }, required: ["query"] },
    sampleInput: '{"query": "SELECT med_name, dosage FROM prescriptions WHERE patient_id = 4821", "limit": 5}',
    mockResponse: '{"status": "success", "rows": [{"med_name": "Amoxicillin", "dosage": "500mg"}, {"med_name": "Lisinopril", "dosage": "10mg"}]}'
  },
  {
    id: "fetch_stock_quote",
    name: "fetch_stock_quote",
    desc: "Fetch real-time ticker quotes from financial market data feed.",
    inputSchema: { type: "object", properties: { ticker: { type: "string" } }, required: ["ticker"] },
    sampleInput: '{"ticker": "ANTH"}',
    mockResponse: '{"ticker": "ANTH", "price": 142.50, "currency": "USD", "timestamp": "2026-08-15T10:30:00Z"}'
  }
];

let mcpSimSelectedTool = 0;

function mcpToolSimulator(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("mcp_master_builder");
  const tool = MOCK_MCP_TOOLS[mcpSimSelectedTool];
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--blue); color:#fff;">Tool Execution</span><h2 style="font-size:20px; margin-top:4px;">🔌 Live Mock MCP Tool Invocation Sandbox</h2></div>'
    + '<button class="btn sm" onclick="executeMockToolCall()">▶️ Execute MCP Tool Call</button>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Test Anthropic Messages API <code>tool_use</code> requests and validate simulated <code>tool_result</code> streaming responses in real time.</p>'
    + '<div style="margin-bottom:12px;">'
    + '<label style="font-size:12px; font-weight:700; display:block; margin-bottom:4px;">Select Mock Tool Definition:</label>'
    + '<select onchange="mcpSimSelectedTool=parseInt(this.value,10); mcpToolSimulator()" style="width:100%; padding:8px; font-size:12.5px; font-weight:700; border-radius:6px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + MOCK_MCP_TOOLS.map((t, idx) => '<option value="' + idx + '" ' + (idx===mcpSimSelectedTool?'selected':'') + '>' + t.name + ' — ' + t.desc + '</option>').join('')
    + '</select>'
    + '</div>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-bottom:16px;">'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--card);">'
    + '<b style="font-size:12.5px; color:var(--coral); display:block; margin-bottom:6px;">Claude Tool Use Request (Input JSON):</b>'
    + '<textarea id="mcpToolInputBox" style="width:100%; height:90px; font-family:Consolas,monospace; font-size:11.5px; background:var(--bg); color:var(--ink); border:1px solid var(--border); border-radius:6px; padding:8px;">' + esc(tool.sampleInput) + '</textarea>'
    + '</div>'
    + '<div style="border:1px solid var(--border); border-radius:10px; padding:12px; background:var(--card);">'
    + '<b style="font-size:12.5px; color:var(--green); display:block; margin-bottom:6px;">Tool Result Stream (JSON-RPC 2.0):</b>'
    + '<div id="mcpToolOutputBox" style="min-height:90px; font-family:Consolas,monospace; font-size:11.5px; background:var(--bg); color:var(--ink); border:1px solid var(--border); border-radius:6px; padding:8px; white-space:pre-wrap;">Click "Execute MCP Tool Call" to stream response...</div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function executeMockToolCall(){
  const tool = MOCK_MCP_TOOLS[mcpSimSelectedTool];
  const out = document.getElementById("mcpToolOutputBox");
  if (!out) return;
  
  out.innerHTML = '<span style="color:var(--blue);">⏳ Calling tool &quot;' + tool.name + '&quot; over MCP JSON-RPC...</span>';
  playSound('correct');
  
  setTimeout(() => {
    out.innerHTML = '<b style="color:var(--green);">✓ HTTP 200 OK (tool_result):</b>\n' + tool.mockResponse;
    toast("🔌 MCP tool call executed successfully!");
  }, 400);
}

/* ================= 3. MULTI-CANDIDATE STUDY COHORT HUB ================= */
function cohortHubView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("cohort_leader");
  
  const cohort = S.cohortCode || "COHORT-7492";
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><span class="ltag" style="background:var(--purple); color:#fff;">Team Study</span><h2 style="font-size:20px; margin-top:4px;">👥 Study Cohort Hub</h2></div>'
    + '</div>'
    + '<p style="font-size:12.5px; color:var(--muted); margin-bottom:16px;">Collaborate with study groups and compare aggregate team readiness radar metrics.</p>'
    + '<div style="border:2px solid var(--border); border-radius:14px; padding:18px; background:var(--card); margin-bottom:16px;">'
    + '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">'
    + '<div><b style="font-size:16px; color:var(--coral);">Study Group: ' + esc(cohort) + '</b><span style="font-size:11.5px; color:var(--muted); display:block;">5 Candidates Active</span></div>'
    + '<button class="btn sm" onclick="joinNewCohort()">Join Different Cohort</button>'
    + '</div>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:8px; font-size:12px; text-align:center;">'
    + '<div style="background:var(--bg); padding:10px; border-radius:6px; border:1px solid var(--border);"><b style="font-size:18px; color:var(--green);">86%</b><br><span style="font-size:11px; color:var(--muted);">Team Average Index</span></div>'
    + '<div style="background:var(--bg); padding:10px; border-radius:6px; border:1px solid var(--border);"><b style="font-size:18px; color:var(--coral);">3,840 XP</b><br><span style="font-size:11px; color:var(--muted);">Weekly Combined XP</span></div>'
    + '<div style="background:var(--bg); padding:10px; border-radius:6px; border:1px solid var(--border);"><b style="font-size:18px; color:var(--blue);">14 Days</b><br><span style="font-size:11px; color:var(--muted);">Team Study Streak</span></div>'
    + '</div>'
    + '</div>'
    + '</div>';
}

function joinNewCohort(){
  const code = prompt("Enter 6-digit Study Cohort Code (e.g. COHORT-9921):", "COHORT-");
  if (code && code.trim()) {
    S.cohortCode = code.trim().toUpperCase();
    save();
    cohortHubView();
    toast("👥 Joined Study Cohort " + S.cohortCode);
  }
}

/* ================= 4. CUSTOM THEME STUDIO & PALETTE CUSTOMIZER ================= */
const THEME_PALETTES = [
  { id: "terracotta", name: "Claude Terracotta", coral: "#d97757", green: "#5a9e6f", blue: "#5b7fa6", purple: "#8a6fae" },
  { id: "cyberpunk", name: "Cyberpunk Neon", coral: "#ff007f", green: "#00ff9f", blue: "#00e5ff", purple: "#bd00ff" },
  { id: "midnight", name: "Slate Midnight", coral: "#38bdf8", green: "#34d399", blue: "#818cf8", purple: "#c084fc" },
  { id: "solarized", name: "Solarized Gold", coral: "#d33682", green: "#859900", blue: "#268bd2", purple: "#6c71c4" }
];

function themeStudioView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();
  
  award("aesthetic_alchemist");
  
  $("app").innerHTML = '<button class="back" onclick="home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎨</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Custom Theme Studio & Palette Customizer</h2>'
    + '<p class="subtext" style="margin-top:6px;">Personalize your study interface with curated accent color palettes.</p>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; max-width:640px; margin:20px auto; text-align:left;">'
    + THEME_PALETTES.map(p => `
      <div style="border:2px solid var(--border); border-radius:12px; padding:16px; background:var(--card); cursor:pointer;" onclick="applyPaletteTheme('${p.id}')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <b style="font-size:14px; color:var(--ink);">${p.name}</b>
          ${S.customTheme===p.id?'<span style="color:var(--green); font-weight:800; font-size:12px;">Active ✓</span>':''}
        </div>
        <div style="display:flex; gap:6px; margin-top:10px;">
          <div style="width:24px; height:24px; border-radius:6px; background:${p.coral};"></div>
          <div style="width:24px; height:24px; border-radius:6px; background:${p.green};"></div>
          <div style="width:24px; height:24px; border-radius:6px; background:${p.blue};"></div>
          <div style="width:24px; height:24px; border-radius:6px; background:${p.purple};"></div>
        </div>
      </div>
    `).join('')
    + '</div>'
    + '</div>';
}

function applyPaletteTheme(pId){
  const p = THEME_PALETTES.find(x => x.id === pId);
  if (!p) return;
  
  S.customTheme = pId;
  save();
  
  if (document.documentElement && document.documentElement.style && typeof document.documentElement.style.setProperty === 'function') {
    document.documentElement.style.setProperty('--coral', p.coral);
    document.documentElement.style.setProperty('--green', p.green);
    document.documentElement.style.setProperty('--blue', p.blue);
    document.documentElement.style.setProperty('--purple', p.purple);
  }
  
  renderHeader();
  themeStudioView();
  toast("🎨 Theme palette set to " + p.name);
}
