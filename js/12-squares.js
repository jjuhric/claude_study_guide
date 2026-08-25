/* ============================================================
   HOLLYWOOD SQUARES
   3x3 tic-tac-toe board where each square is a multiple-choice
   question from the existing question bank. Answer correctly to
   claim the square; answer wrong and the opponent gets a steal
   attempt on the same question. One shared pure engine (win/steal/
   turn logic), three adapters: vs-Computer AI, same-device
   pass-and-play, and real remote P2P over PeerJS.

   shuffleOptions() in js/13-boot.js reshuffles every question's
   option order independently per browser, so in the PeerJS adapter
   the host is the sole authority: it sends its own shuffled
   question+options verbatim to the joiner, and is the only side
   that ever judges correctness. (PeerJS mode lands in a later phase;
   this file currently implements vs-Computer and pass-and-play.)
   ============================================================ */
const SQ_WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const SQUARES_AI_PRIMARY_ACC = 0.70;
const SQUARES_AI_STEAL_ACC = 0.55;

/* Round state only -- not persisted, same rationale as hangState. */
let sqState = {
  active: false,
  certId: "ccao",
  mode: "computer", // computer | local
  human: "X",        // which mark the human plays in vs-computer mode
  board: [],          // 9 cells: null | 'X' | 'O'
  squareQ: [],         // 9 entries: the question currently assigned to that square
  spent: [],            // indices whose question both players already missed
  usedQIds: [],
  turn: "X",             // whose turn it is to PICK a square
  activeIdx: null,
  answeringSeat: null,    // 'X' | 'O' -- who is currently answering
  primaryMiss: false,
  phase: "idle",           // idle | picking | answering | over
  winner: null,             // 'X' | 'O' | 'tie' | null
  winLine: null
};

function sqOtherMark(m){ return m === "X" ? "O" : "X"; }

/* ---- pure engine ---- */
function sqCheckWin(board){
  for (const line of SQ_WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return null;
}
function sqIsFull(board){ return board.every(c => c !== null); }

/* Minimax-lite: win-if-possible, block-if-needed, center, corner, edge --
   genuinely non-dumb strategic play without expectimax over the answering
   uncertainty a real square adds, which is overkill for v1. */
function sqPickAiSquare(board, mark){
  const other = sqOtherMark(mark);
  for (const line of SQ_WIN_LINES) {
    const marks = line.filter(i => board[i] === mark).length;
    const empties = line.filter(i => board[i] === null);
    if (marks === 2 && empties.length === 1) return empties[0];
  }
  for (const line of SQ_WIN_LINES) {
    const marks = line.filter(i => board[i] === other).length;
    const empties = line.filter(i => board[i] === null);
    if (marks === 2 && empties.length === 1) return empties[0];
  }
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  const edges = [1, 3, 5, 7].filter(i => board[i] === null);
  if (edges.length) return edges[Math.floor(Math.random() * edges.length)];
  return null;
}
function sqAiAnswerCorrect(isSteal){
  return Math.random() < (isSteal ? SQUARES_AI_STEAL_ACC : SQUARES_AI_PRIMARY_ACC);
}

function sqFreshQuestion(certId, excludeIds){
  const c = CERTS.find(x => x.id === certId);
  const pool = c.questions.filter(q => !excludeIds.includes(q.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function sqIsHumanSeat(seat){
  return sqState.mode === "local" || seat === sqState.human;
}

/* ---- game flow ---- */
function sqNewBoard(certId, mode){
  const c = CERTS.find(x => x.id === certId);
  const picks = sampleByDomain(c, 9).map(i => c.questions[i]);
  sqState.certId = certId;
  sqState.mode = mode;
  sqState.human = "X";
  sqState.board = Array(9).fill(null);
  sqState.squareQ = picks;
  sqState.spent = [];
  sqState.usedQIds = picks.map(q => q.id);
  sqState.turn = "X";
  sqState.activeIdx = null;
  sqState.answeringSeat = null;
  sqState.primaryMiss = false;
  sqState.phase = "picking";
  sqState.winner = null;
  sqState.winLine = null;
  sqState.active = true;
  renderSquaresRound();
}

function stopSquaresGame(){
  sqState.active = false;
  sqState.phase = "idle";
}

function sqPickSquare(idx){
  if (sqState.phase !== "picking" || sqState.board[idx] !== null) return;
  if (sqState.spent.includes(idx)) {
    const fresh = sqFreshQuestion(sqState.certId, sqState.usedQIds);
    if (fresh) {
      sqState.squareQ[idx] = fresh;
      sqState.usedQIds.push(fresh.id);
      sqState.spent = sqState.spent.filter(i => i !== idx);
    }
  }
  sqState.activeIdx = idx;
  sqState.answeringSeat = sqState.turn; // the picker answers first
  sqState.primaryMiss = false;
  sqState.phase = "answering";
  renderSquaresRound();
  if (sqState.mode === "computer" && sqState.answeringSeat !== sqState.human) sqAiAnswerTimer();
}

function sqResolveAnswer(pickIdx){
  if (sqState.phase !== "answering") return;
  const q = sqState.squareQ[sqState.activeIdx];
  const correct = pickIdx === q.a;
  playSound(correct ? "correct" : "wrong");

  if (!sqState.primaryMiss) {
    if (correct) {
      sqClaimSquare(sqState.activeIdx, sqState.answeringSeat, 8);
      return;
    }
    sqState.primaryMiss = true;
    sqState.answeringSeat = sqOtherMark(sqState.answeringSeat); // steal goes to the other seat, same question
    renderSquaresRound(true); // shake the board -- a miss just put the steal live
    if (sqState.mode === "computer" && sqState.answeringSeat !== sqState.human) sqAiAnswerTimer();
    return;
  }

  if (correct) {
    sqClaimSquare(sqState.activeIdx, sqState.answeringSeat, 12);
  } else {
    sqState.spent.push(sqState.activeIdx); // both missed -- square empty, question spent
    sqAfterTurn();
  }
}

function sqClaimSquare(idx, seat, xp){
  sqState.board[idx] = seat;
  if (sqIsHumanSeat(seat)) addXP(xp, "Hollywood Squares");
  const win = sqCheckWin(sqState.board);
  if (win) { sqEndGame(win.winner, win.line); return; }
  if (sqIsFull(sqState.board)) { sqEndGame("tie", null); return; }
  sqAfterTurn();
}

/* Pick-turn alternates strictly regardless of who claimed the square (or
   whether anyone did) -- the detail a naive tic-tac-toe port gets wrong. */
function sqAfterTurn(){
  sqState.turn = sqOtherMark(sqState.turn);
  sqState.activeIdx = null;
  sqState.answeringSeat = null;
  sqState.primaryMiss = false;
  sqState.phase = "picking";
  renderSquaresRound();
  if (sqState.mode === "computer" && sqState.turn !== sqState.human) sqAiPickTimer();
}

function sqEndGame(winner, line){
  sqState.phase = "over";
  sqState.winner = winner;
  sqState.winLine = line;
  sqState.active = false;
  const bucket = sqState.mode === "computer" ? "vsComputer" : "vsLocal";
  const stats = S.squaresStats[bucket];
  if (winner === "tie") {
    stats.t++;
    addXP(10, "Hollywood Squares tie");
  } else if (sqState.mode === "computer") {
    if (winner === sqState.human) { stats.w++; addXP(20, "Hollywood Squares win"); award("squares_ai_victor"); confetti(); }
    else stats.l++;
  } else {
    stats.w++;
    addXP(20, "Hollywood Squares win");
    confetti(); // pass-and-play: either human winning is worth celebrating
  }
  save();
  renderSquaresRound();
}

/* ---- vs-computer adapter: timers, so a real setTimeout only ever fires in
   the browser. The VM test harness's setTimeout is a permanent no-op, so
   tests call sqResolveAiPick/sqResolveAiTurn directly instead. ---- */
function sqResolveAiPick(){
  if (sqState.phase !== "picking" || sqState.mode !== "computer" || sqState.turn === sqState.human) return;
  const idx = sqPickAiSquare(sqState.board, sqState.turn);
  if (idx !== null) sqPickSquare(idx);
}
function sqAiPickTimer(){ setTimeout(sqResolveAiPick, 500); }

function sqResolveAiTurn(){
  if (sqState.phase !== "answering" || sqState.mode !== "computer" || sqState.answeringSeat === sqState.human) return;
  const q = sqState.squareQ[sqState.activeIdx];
  const correct = sqAiAnswerCorrect(sqState.primaryMiss);
  const pick = correct ? q.a : (q.a + 1) % q.opts.length;
  sqResolveAnswer(pick);
}
function sqAiAnswerTimer(){ setTimeout(sqResolveAiTurn, 650); }

/* ---- views ---- */
function squaresView(){
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") window.scrollTo(0, 0);
  renderHeader();

  const c = CERTS.find(x => x.id === sqState.certId) || CERTS[0];
  sqState.certId = c.id;
  const st = S.squaresStats;

  $("app").innerHTML = '<button class="back" onclick="stopSquaresGame(); home()">← Back</button>'
    + '<div class="panel center">'
    + '<img src="images/games/movie-clapperboard.svg" alt="" width="56" height="56" style="display:block; margin:0 auto; filter:drop-shadow(0 2px 3px var(--shadow));">'
    + '<h2 style="font-size:20px; margin-top:6px;">🎬 Hollywood Squares</h2>'
    + '<p class="subtext" style="margin-top:6px;">Answer correctly to claim a square. Miss it and your opponent can steal.</p>'
    + '<div style="font-size:12px; color:var(--muted); margin-bottom:10px;">vs Computer: ' + st.vsComputer.w + 'W-' + st.vsComputer.l + 'L-' + st.vsComputer.t + 'T · Pass &amp; Play: ' + st.vsLocal.w + 'W-' + st.vsLocal.t + 'T</div>'
    + '<div style="margin:10px 0 16px;">'
    + '<select id="sqCertSelect" onchange="sqState.certId=this.value; stopSquaresGame(); squaresView()" style="padding:8px 12px; font-size:13px; font-weight:700; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--ink);">'
    + CERTS.map(x => '<option value="' + x.id + '" ' + (x.id === c.id ? "selected" : "") + '>' + x.code + " · " + x.name + "</option>").join("")
    + "</select>"
    + "</div>"
    + '<div id="sqStage" style="max-width:340px; margin:0 auto;"></div>'
    + "</div>";

  if (!c._loaded) {
    document.getElementById("sqStage").innerHTML = '<div class="subtext">Loading…</div>';
    loadCert(c).then(() => { if (sqState.certId === c.id) renderSquaresStage(); });
    return;
  }
  renderSquaresStage();
}

function renderSquaresStage(){
  const stage = document.getElementById("sqStage");
  if (!stage) return;
  if (sqState.active) { renderSquaresRound(); return; }
  stage.innerHTML = '<div class="rowbtns" style="justify-content:center;">'
    + "<button class=\"btn\" onclick=\"sqNewBoard(sqState.certId, 'computer')\">🤖 Play vs Computer</button>"
    + "<button class=\"btn ghost\" onclick=\"sqNewBoard(sqState.certId, 'local')\">👥 Pass &amp; Play (2 Players)</button>"
    + "</div>";
}

function renderSquaresRound(shake){
  const stage = document.getElementById("sqStage");
  if (!stage) return;

  const winSet = sqState.phase === "over" && sqState.winLine ? sqState.winLine : [];
  const boardHtml = '<div class="sqboard' + (shake ? " shake" : "") + '" style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; max-width:270px; margin:0 auto 14px;">'
    + sqState.board.map((cell, i) => {
        const cls = "sqcell" + (cell ? " " + (cell === "X" ? "sqx" : "sqo") : "") + (sqState.activeIdx === i ? " active" : "") + (winSet.includes(i) ? " winline" : "");
        const disabled = sqState.phase !== "picking" || cell !== null;
        return '<button class="' + cls + '" ' + (disabled ? "disabled" : "") + ' onclick="sqPickSquare(' + i + ')">' + (cell || "") + "</button>";
      }).join("")
    + "</div>";

  let statusHtml = "";
  if (sqState.phase === "picking") {
    const who = sqState.mode === "computer"
      ? (sqState.turn === sqState.human ? "Your" : "Computer's")
      : ("Player " + sqState.turn + "'s");
    statusHtml = '<div class="subtext"><span class="sqturn">' + who + "</span> turn to pick a square.</div>";
  }

  let questionHtml = "";
  if (sqState.phase === "answering" && sqState.activeIdx !== null) {
    const q = sqState.squareQ[sqState.activeIdx];
    const isAiTurn = sqState.mode === "computer" && sqState.answeringSeat !== sqState.human;
    const label = sqState.primaryMiss ? "🔁 Steal attempt" : "Answer to claim the square";
    questionHtml = '<div style="border:2px solid var(--border); border-radius:14px; padding:16px; background:var(--card); text-align:left; margin-top:6px;">'
      + '<div style="font-size:11px; font-weight:800; color:var(--coral); margin-bottom:6px;">' + label + (sqState.mode === "local" ? " — Player " + sqState.answeringSeat : "") + "</div>"
      + '<div style="font-size:14px; font-weight:700; margin-bottom:12px;">' + esc(q.q) + "</div>"
      + (isAiTurn
          ? '<div class="subtext">🤖 Computer is answering…</div>'
          : q.opts.map((o, j) => '<button class="opt" onclick="sqResolveAnswer(' + j + ')">' + esc(o) + "</button>").join(""))
      + "</div>";
  }

  let overHtml = "";
  if (sqState.phase === "over") {
    const winnerText = sqState.winner === "tie" ? "It's a tie!"
      : sqState.mode === "computer"
        ? (sqState.winner === sqState.human ? "You win! 🎉" : "Computer wins.")
        : ("Player " + sqState.winner + " wins! 🎉");
    overHtml = '<div style="text-align:center; margin-top:14px;">'
      + '<h3 style="font-size:18px;">' + winnerText + "</h3>"
      + '<div class="rowbtns" style="justify-content:center; margin-top:10px;">'
      + "<button class=\"btn sm\" onclick=\"sqNewBoard(sqState.certId, '" + sqState.mode + "')\">Play Again</button>"
      + '<button class="btn ghost sm" onclick="squaresView()">Change Mode</button>'
      + "</div></div>";
  }

  stage.innerHTML = boardHtml + statusHtml + questionHtml + overHtml;
}
