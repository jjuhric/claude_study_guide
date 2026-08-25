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
   that ever judges correctness.
   ============================================================ */
