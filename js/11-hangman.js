/* ============================================================
   GLOSSARY HANGMAN
   Classic 6-miss hangman. Word pool is a per-domain glossary
   (data/<cert>.json → glossary: [{id, term, hint, d}]), curated from
   this app's own already-verified lesson/flashcard content — the
   question bank's correct-answer text is unusable as hangman words
   (95% of it is full sentences). See docs/HANGMAN_GLOSSARY_PLAN.md
   for the content-authoring checklist.
   ============================================================ */
const HANGMAN_MAX_MISSES = 6;

/* Round state only — not persisted. A single word is short enough that
   losing an in-progress round on reload (same as the quiz/mock state) is
   fine; only the anti-repeat queue and aggregate stats survive into S. */
let hangState = {
  active: false,
  certId: "ccao",
  d: 0,
  entry: null,
  guessed: [],
  misses: 0,
  phase: "idle" // idle | playing | won | lost
};

function hangGlossaryPool(c, d){
  return (c.glossary || []).filter(g => g.d === d);
}

/* Picks uniformly from the domain's pool, excluding a rolling anti-repeat
   queue kept in S.hangmanRecent. Falls back to the full pool once every
   entry has recently been seen, since a domain's pool is small (~10-15
   terms) and would otherwise exhaust in one sitting. */
function hangPickTerm(certId, d){
  const c = CERTS.find(x => x.id === certId);
  const pool = hangGlossaryPool(c, d);
  if (!pool.length) return null;
  const key = certId + ':' + d;
  const recent = S.hangmanRecent[key] || [];
  let candidates = pool.filter(g => !recent.includes(g.id));
  if (!candidates.length) candidates = pool;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  const n = Math.max(1, Math.min(6, Math.floor(pool.length / 2)));
  S.hangmanRecent[key] = [...recent, picked.id].slice(-n);
  save();
  return picked;
}

function hangmanView(){
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  renderHeader();

  const c = CERTS.find(x => x.id === hangState.certId) || CERTS[0];
  hangState.certId = c.id;
  if (hangState.d >= c.domains.length) hangState.d = 0;
  const stats = S.hangmanStats;

  $("app").innerHTML = '<button class="back" onclick="stopHangmanRound(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<div style="font-size:38px;">🎪</div>'
    + '<h2 style="font-size:20px; margin-top:6px;">Glossary Hangman</h2>'
    + '<p class="subtext" style="margin-top:6px;">Guess the term letter by letter. Six wrong guesses and it’s hangman.</p>'
    + '<div style="font-size:12px; color:var(--muted); margin-bottom:10px;">Wins: ' + stats.wins + ' · Losses: ' + stats.losses + ' · Flawless: ' + stats.perfect + '</div>'
    + '<div style="display:flex; justify-content:center; gap:10px; margin:10px 0 16px; flex-wrap:wrap;">'
    + '<select id="hgCertSelect" onchange="hangState.certId=this.value; hangState.d=0; hangState.active=false; hangmanView()" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(x => '<option value="' + x.id + '" ' + (x.id === c.id ? 'selected' : '') + '>' + x.code + ' · ' + x.name + '</option>').join('')
    + '</select>'
    + '<select id="hgDomSelect" onchange="hangState.d=+this.value; hangState.active=false; hangmanView()" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + c.domains.map((name, i) => '<option value="' + i + '" ' + (i === hangState.d ? 'selected' : '') + '>' + esc(name) + '</option>').join('')
    + '</select>'
    + '</div>'
    + '<div id="hgStage" style="max-width:480px; margin:0 auto;"></div>'
    + '</div>';

  if (!c._loaded) {
    document.getElementById("hgStage").innerHTML = '<div class="subtext">Loading…</div>';
    loadCert(c).then(() => { if (hangState.certId === c.id) renderHangmanStage(); });
    return;
  }
  renderHangmanStage();
}

function renderHangmanStage(){
  const stage = document.getElementById("hgStage");
  if (!stage) return;
  const c = CERTS.find(x => x.id === hangState.certId);
  const pool = hangGlossaryPool(c, hangState.d);

  if (!pool.length) {
    stage.innerHTML = '<div class="subtext">No glossary terms for this domain yet — pick another domain.</div>';
    return;
  }
  if (hangState.active && hangState.phase === "playing") {
    renderHangmanRound();
  } else {
    stage.innerHTML = '<button class="btn" onclick="startHangmanRound()">▶️ Start Round (' + pool.length + ' terms)</button>';
  }
}

function startHangmanRound(){
  const entry = hangPickTerm(hangState.certId, hangState.d);
  if (!entry) { renderHangmanStage(); return; }
  hangState.active = true;
  hangState.entry = entry;
  hangState.guessed = [];
  hangState.misses = 0;
  hangState.phase = "playing";
  renderHangmanRound();
}

function stopHangmanRound(){
  hangState.active = false;
  hangState.phase = "idle";
}

function hangMaskedWord(){
  const term = hangState.entry.term;
  return term.split('').map(ch => {
    if (ch === ' ') return ' ';
    return hangState.guessed.includes(ch.toLowerCase()) ? ch : '_';
  }).join('');
}

function hangGuessLetter(ch){
  if (hangState.phase !== "playing" || !hangState.entry) return;
  ch = (ch || '').toLowerCase();
  if (!/^[a-z]$/.test(ch) || hangState.guessed.includes(ch)) return;

  hangState.guessed.push(ch);
  const term = hangState.entry.term.toLowerCase();
  if (term.includes(ch)) {
    playSound('correct');
  } else {
    hangState.misses++;
    playSound('wrong');
  }

  const solved = term.split('').every(c => c === ' ' || hangState.guessed.includes(c));
  if (solved) { hangState.phase = "won"; finishHangmanRound(); return; }
  if (hangState.misses >= HANGMAN_MAX_MISSES) { hangState.phase = "lost"; finishHangmanRound(); return; }
  renderHangmanRound();
}

function renderHangmanRound(){
  const stage = document.getElementById("hgStage");
  if (!stage || !hangState.entry) return;
  const masked = hangMaskedWord();
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split('');
  const term = hangState.entry.term.toLowerCase();

  stage.innerHTML = renderHangmanSvg(hangState.misses)
    + '<div style="text-align:center; font-size:24px; font-weight:800; letter-spacing:4px; font-family:monospace; margin:12px 0; word-break:break-word;">'
    + masked.split('').map(ch => ch === ' '
        ? '<span style="display:inline-block; width:14px;"></span>'
        : '<span style="display:inline-block; min-width:18px;">' + esc(ch) + '</span>').join('')
    + '</div>'
    + '<div style="text-align:center; font-size:12.5px; color:var(--muted); margin-bottom:12px;">Misses: ' + hangState.misses + ' / ' + HANGMAN_MAX_MISSES + '</div>'
    + '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(32px,1fr)); gap:6px; max-width:400px; margin:0 auto;">'
    + alphabet.map(ch => {
        const used = hangState.guessed.includes(ch);
        const correct = used && term.includes(ch);
        const cls = 'hgkey' + (used ? (correct ? ' correct' : ' wrong') : '');
        return '<button class="' + cls + '" ' + (used ? 'disabled' : '') + ' onclick="hangGuessLetter(\'' + ch + '\')">' + ch.toUpperCase() + '</button>';
      }).join('')
    + '</div>';
}

/* Pure, theme-token-driven SVG (no hardcoded hex), following the same
   convention as renderReadinessRadarSvg in 03-home.js. The gallows is
   always fully drawn; figure parts appear one per miss. */
function renderHangmanSvg(misses){
  const m = Math.max(0, Math.min(HANGMAN_MAX_MISSES, misses | 0));
  let parts = ''
    + '<line x1="10" y1="170" x2="110" y2="170" stroke="var(--border)" stroke-width="4" stroke-linecap="round"/>'
    + '<line x1="30" y1="170" x2="30" y2="20" stroke="var(--border)" stroke-width="4" stroke-linecap="round"/>'
    + '<line x1="30" y1="20" x2="90" y2="20" stroke="var(--border)" stroke-width="4" stroke-linecap="round"/>'
    + '<line x1="90" y1="20" x2="90" y2="35" stroke="var(--border)" stroke-width="3"/>';
  if (m >= 1) parts += '<circle cx="90" cy="45" r="10" fill="none" stroke="var(--coral)" stroke-width="3"/>';
  if (m >= 2) parts += '<line x1="90" y1="55" x2="90" y2="95" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>';
  if (m >= 3) parts += '<line x1="90" y1="65" x2="75" y2="80" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>';
  if (m >= 4) parts += '<line x1="90" y1="65" x2="105" y2="80" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>';
  if (m >= 5) parts += '<line x1="90" y1="95" x2="75" y2="115" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>';
  if (m >= 6) parts += '<line x1="90" y1="95" x2="105" y2="115" stroke="var(--coral)" stroke-width="3" stroke-linecap="round"/>';
  return '<div style="display:flex; justify-content:center;"><svg viewBox="0 0 160 180" width="160" height="180">' + parts + '</svg></div>';
}

function finishHangmanRound(){
  const stage = document.getElementById("hgStage");
  if (!stage || !hangState.entry) return;

  const won = hangState.phase === "won";
  const flawless = won && hangState.misses === 0;

  S.hangmanStats.played++;
  if (won) { S.hangmanStats.wins++; if (flawless) S.hangmanStats.perfect++; }
  else S.hangmanStats.losses++;
  save();

  let xpMsg = '';
  if (won) {
    const xp = 15 + (flawless ? 5 : 0);
    addXP(xp, "Hangman win");
    award("hangman_survivor");
    if (flawless) award("hangman_flawless");
    xpMsg = 'Earned <b>+' + xp + ' XP</b>' + (flawless ? ' (flawless bonus!)' : '') + '.';
  }

  const entry = hangState.entry;
  stage.innerHTML = renderHangmanSvg(hangState.misses)
    + '<div style="text-align:center; margin-top:8px;">'
    + '<div style="font-size:34px;">' + (won ? '🎉' : '💀') + '</div>'
    + '<h3 style="font-size:17px; margin:4px 0;">' + (won ? 'Solved it!' : 'Out of guesses') + '</h3>'
    + '<div style="font-size:20px; font-weight:800; letter-spacing:1px; margin:8px 0;">' + esc(entry.term) + '</div>'
    + '<div style="font-size:13px; color:var(--muted); max-width:420px; margin:0 auto 12px;">' + esc(entry.hint) + '</div>'
    + (xpMsg ? '<div style="font-size:13px; margin-bottom:12px;">' + xpMsg + '</div>' : '')
    + '<div class="rowbtns" style="justify-content:center;">'
    + '<button class="btn sm" onclick="startHangmanRound()">Play Again</button>'
    + '<button class="btn ghost sm" onclick="hangmanView()">Change Domain</button>'
    + '</div>'
    + '</div>';

  hangState.active = false;
}

/* Scoped by hangState.active/phase, so this coexists safely with the
   digit-only quiz keydown handler in 10-quiz.js (which never intercepts
   plain letters) and with any input/textarea field elsewhere in the app. */
if (typeof document !== 'undefined') {
  document.addEventListener("keydown", e => {
    if (!hangState.active || hangState.phase !== "playing") return;
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const ch = (e.key || '').toLowerCase();
    if (/^[a-z]$/.test(ch)) { e.preventDefault(); hangGuessLetter(ch); }
  });
}
