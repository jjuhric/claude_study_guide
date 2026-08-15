const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const isCRLF = html.includes('\r\n');
if (isCRLF) html = html.replace(/\r\n/g, '\n');

// Replace the audio narrator implementation
const oldTtsSection = `/* ================= WEB SPEECH AUDIO LESSON NARRATOR ================= */
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
}`;

const newTtsSection = `/* ================= SMART HUMAN-LIKE AUDIO LESSON NARRATOR ================= */
let ttsSpeed = 1.0;
let ttsMode = 'brief'; // 'brief' (high-yield) or 'full'
let ttsIsPlaying = false;
let ttsQueue = [];
let ttsQueueIdx = 0;
let ttsCurrentVoice = null;
let ttsActiveCert = null;
let ttsActiveIdx = null;

function getAvailableVoices(){
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  const all = window.speechSynthesis.getVoices() || [];
  // Filter for English and rank natural/neural voices higher
  const scored = all.filter(v => (v.lang || '').startsWith('en')).map(v => {
    let score = 0;
    const name = v.name || '';
    if (name.includes('Natural') || name.includes('Neural') || name.includes('Online')) score += 15;
    if (name.includes('Google')) score += 10;
    if (name.includes('Premium') || name.includes('Enhanced')) score += 8;
    if (name.includes('Samantha') || name.includes('Daniel') || name.includes('Jenny') || name.includes('Guy') || name.includes('Aria')) score += 6;
    if (v.default) score += 2;
    return { voice: v, score, name: v.name, lang: v.lang };
  }).sort((a, b) => b.score - a.score);
  return scored.map(x => x.voice);
}

function getBestVoice(){
  const voices = getAvailableVoices();
  const savedName = localStorage.getItem('cq_tts_voice');
  if (savedName) {
    const match = voices.find(v => v.name === savedName);
    if (match) return match;
  }
  return voices[0] || null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    ttsCurrentVoice = getBestVoice();
    populateVoiceDropdown();
  };
}

function populateVoiceDropdown(){
  const sel = document.getElementById('ttsVoiceSelect');
  if (!sel) return;
  const voices = getAvailableVoices();
  if (!voices.length) return;
  const cur = ttsCurrentVoice || getBestVoice();
  sel.innerHTML = voices.map(v => {
    const isSel = cur && cur.name === v.name;
    const label = v.name.replace(/Microsoft /g, '').replace(/Google /g, '').replace(/English/g, 'EN');
    return '<option value="' + esc(v.name) + '"' + (isSel ? ' selected' : '') + '>' + esc(label) + '</option>';
  }).join('');
}

function setTtsVoice(voiceName){
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices() || [];
  const found = voices.find(v => v.name === voiceName);
  if (found) {
    ttsCurrentVoice = found;
    try { localStorage.setItem('cq_tts_voice', found.name); } catch(e){}
    toast('Voice: ' + found.name.split(' ')[0]);
    if (ttsIsPlaying) {
      const id = ttsActiveCert;
      const idx = ttsActiveIdx;
      ttsStop();
      ttsPlayLesson(id, idx);
    }
  }
}

function setTtsMode(mode){
  ttsMode = mode;
  toast(mode === 'brief' ? '🎙️ Mode: High-Yield Brief' : '📖 Mode: Full Lesson');
  if (ttsIsPlaying) {
    const id = ttsActiveCert;
    const idx = ttsActiveIdx;
    ttsStop();
    ttsPlayLesson(id, idx);
  }
}

/* Builds a structured, conversational, high-yield audio brief */
function buildHighYieldAudioScript(les, mode){
  if (typeof document === 'undefined') return les.h;
  const div = document.createElement('div');
  div.innerHTML = les.b;

  if (mode === 'full') {
    div.querySelectorAll('pre, code, script, style, .widget-box, .sim-terminal, .code-copy-btn').forEach(el => el.remove());
    return les.h + '. ' + (div.innerText || div.textContent || '');
  }

  // --- High-Yield Executive Summary Mode ---
  let script = 'Lesson briefing: ' + les.h + '. ';

  // 1. Core Overview (Key opening insights)
  const paragraphs = Array.from(div.querySelectorAll('p')).slice(0, 3);
  paragraphs.forEach(p => {
    const text = (p.innerText || '').trim();
    if (text && !text.startsWith('Click') && !text.startsWith('Adjust') && text.length > 20) {
      script += text + ' ';
    }
  });

  // 2. High-Yield Callouts
  const callouts = div.querySelectorAll('.callout');
  if (callouts.length > 0) {
    script += ' Here is the core architecture principle: ';
    callouts.forEach(c => {
      const clone = c.cloneNode(true);
      clone.querySelectorAll('.lbl, button').forEach(el => el.remove());
      script += (clone.innerText || '').trim() + '. ';
    });
  }

  // 3. Exam Traps & Gotchas
  const traps = div.querySelectorAll('.warn, .exambox, .scenario-box');
  if (traps.length > 0) {
    script += ' Watch out for these high-yield exam traps: ';
    traps.forEach((t, idx) => {
      const clone = t.cloneNode(true);
      clone.querySelectorAll('.lbl, button').forEach(el => el.remove());
      const cleanTrap = (clone.innerText || '').trim();
      if (cleanTrap) {
        script += 'Trap ' + (idx + 1) + ': ' + cleanTrap + '. ';
      }
    });
  }

  // 4. Key Takeaways
  const takeaways = div.querySelector('.takeaways');
  if (takeaways) {
    script += ' Finally, your key takeaways for test day: ';
    const items = takeaways.querySelectorAll('li');
    items.forEach((item, idx) => {
      script += 'Rule ' + (idx + 1) + ': ' + (item.innerText || '').trim() + '. ';
    });
  }

  script += ' That concludes your high-yield audio brief. Head to Quiz Battle to test your recall.';
  return script;
}

/* Splits script into natural conversational sentences */
function splitIntoSentences(text){
  const clean = text.replace(/\\s+/g, ' ').trim();
  const raw = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
  return raw.map(s => s.trim()).filter(s => s.length > 0);
}

function ttsPlayLesson(id, i){
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    toast('Speech synthesis not supported in this browser');
    return;
  }
  const c = CERTS.find(x => x.id === id);
  if (!c || !c.lessons || !c.lessons[i]) return;
  const les = c.lessons[i];
  ttsActiveCert = id;
  ttsActiveIdx = i;

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    ttsIsPlaying = true;
    updateAudioControlsUI(true);
    return;
  }

  window.speechSynthesis.cancel();
  const script = buildHighYieldAudioScript(les, ttsMode);
  ttsQueue = splitIntoSentences(script);
  ttsQueueIdx = 0;
  ttsIsPlaying = true;
  updateAudioControlsUI(true);
  toast(ttsMode === 'brief' ? '🎙️ Playing High-Yield Audio Brief' : '📖 Reading Full Lesson');
  ttsSpeakNextSentence();
}

function ttsSpeakNextSentence(){
  if (!ttsIsPlaying || ttsQueueIdx >= ttsQueue.length) {
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
    return;
  }

  const sentence = ttsQueue[ttsQueueIdx];
  const utt = new SpeechSynthesisUtterance(sentence);
  utt.rate = ttsSpeed;
  
  if (!ttsCurrentVoice) ttsCurrentVoice = getBestVoice();
  if (ttsCurrentVoice) utt.voice = ttsCurrentVoice;

  utt.onend = () => {
    ttsQueueIdx++;
    // short natural pause between sentences
    setTimeout(() => {
      if (ttsIsPlaying) ttsSpeakNextSentence();
    }, 40);
  };

  utt.onerror = () => {
    ttsQueueIdx++;
    if (ttsIsPlaying) ttsSpeakNextSentence();
  };

  window.speechSynthesis.speak(utt);
}

function ttsPause(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    ttsIsPlaying = false;
    updateAudioControlsUI(false);
    toast('Audio paused');
  }
}

function ttsStop(){
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    ttsIsPlaying = false;
    ttsQueue = [];
    ttsQueueIdx = 0;
    updateAudioControlsUI(false);
  }
}

function ttsSetSpeed(speed){
  ttsSpeed = parseFloat(speed) || 1.0;
  toast('Speed: ' + ttsSpeed + 'x');
}

function updateAudioControlsUI(playing){
  const playBtn = document.getElementById('ttsPlayBtn');
  const statusEl = document.getElementById('ttsStatusLabel');
  if (playBtn) {
    if (playing) {
      playBtn.classList.add('playing');
      playBtn.innerHTML = '⏸️ Pause';
      playBtn.onclick = () => ttsPause();
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--green); font-size:11px; font-weight:700;">● Narrating (' + (ttsMode === 'brief' ? 'High-Yield' : 'Full') + ')...</span>';
    } else {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = '▶️ Listen';
      playBtn.onclick = () => {
        const id = playBtn.getAttribute('data-cert');
        const idx = parseInt(playBtn.getAttribute('data-idx'), 10);
        ttsPlayLesson(id, idx);
      };
      if (statusEl) statusEl.innerHTML = '';
    }
  }
}`;

if (html.includes(oldTtsSection)) {
  html = html.replace(oldTtsSection, newTtsSection);
}

// Update the lesson tools bar in index.html to include mode selector & voice dropdown
const oldToolsBar = `<div class="audio-player">
   +'<button id="ttsPlayBtn" class="audio-btn" data-cert="'+id+'" data-idx="'+i+'" onclick="ttsPlayLesson(\\''+id+'\\','+i+')">▶️ Listen</button>'
   +'<select class="audio-btn" onchange="ttsSetSpeed(this.value)" style="padding:4px 6px;" aria-label="Audio Speed">'
   +'<option value="1.0">1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option>'
   +'</select>'
   +'</div>'`;

const newToolsBar = `<div class="audio-player" style="flex-wrap:wrap; gap:6px;">'
   +'<button id="ttsPlayBtn" class="audio-btn" data-cert="'+id+'" data-idx="'+i+'" onclick="ttsPlayLesson(\\''+id+'\\','+i+')">▶️ Listen</button>'
   +'<select class="audio-btn" onchange="setTtsMode(this.value)" style="padding:4px 6px; font-weight:600;" aria-label="Narration Depth">'
   +'<option value="brief"'+(ttsMode==='brief'?' selected':'')+'>🎙️ High-Yield Summary</option>'
   +'<option value="full"'+(ttsMode==='full'?' selected':'')+'>📖 Full Lesson</option>'
   +'</select>'
   +'<select id="ttsVoiceSelect" class="audio-btn" onchange="setTtsVoice(this.value)" style="padding:4px 6px; max-width:140px;" aria-label="Voice Selection">'
   +'<option value="">🗣️ Natural Voice</option>'
   +'</select>'
   +'<select class="audio-btn" onchange="ttsSetSpeed(this.value)" style="padding:4px 6px;" aria-label="Audio Speed">'
   +'<option value="0.9">0.9x</option><option value="1.0" selected>1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option>'
   +'</select>'
   +'<span id="ttsStatusLabel"></span>'
   +'</div>'`;

if (html.includes(oldToolsBar)) {
  html = html.replace(oldToolsBar, newToolsBar);
}

// In lessonView, call populateVoiceDropdown()
const oldLessonViewInit = `initLessonWidgets();`;
const newLessonViewInit = `initLessonWidgets(); populateVoiceDropdown();`;
if (html.includes(oldLessonViewInit) && !html.includes('populateVoiceDropdown()')) {
  html = html.replace(oldLessonViewInit, newLessonViewInit);
}

// Validate JS syntax with vm
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  new vm.Script(match[1]);
  console.log('Script block 0 verified valid JS syntax!');
}

if (isCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully enhanced Audio Lesson Narrator with High-Yield Brief and Natural Human Voice support');
