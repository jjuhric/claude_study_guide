/* 01-state.js
   State, persistence, theme, backup
   Part of Claude Cert Quest. Loaded as a classic script: every file
   shares one global scope, in the order listed in index.html. */
"use strict";
/* ================= STATE ================= */
let mem = {};
const store = {
  get(){ try{ return JSON.parse(localStorage.getItem("certquest")||"null"); }catch(e){ return mem.d||null; } },
  set(d){ try{ localStorage.setItem("certquest", JSON.stringify(d)); }catch(e){ mem.d=d; } }
};
function getFreshState(){
  return {
    v: 1,
    xp: 0,
    badges: [],
    seenCerts: [],
    answered: {},
    cardsSeen: 0,
    days: [],
    mocks: {},
    domStats: {},
    lessonsRead: {},
    cardBox: {},
    theme: "auto",
    sound: false,
    customDecks: [],
    notes: {},
    bookmarks: [],
    customCards: {},
    studyPlan: null,
    speedRunScores: {},
    fontMode: "default",
    contrastMode: "default",
    blitzHighScore: 0,
    arcadeHighScore: 0,
    customTheme: "terracotta",
    cohortCode: "",
    examDate: "",
    voiceNotes: {},
    notifsEnabled: false,
    dailyBossHistory: {},
    lang: "en",
    gistToken: "",
    gistId: "",
    dailyTarget: { date: "", answered: 0, lessons: 0, cards: 0, claimed: false },
    profile: {
      handle: "Curious Scholar",
      avatar: "\u{1F9ED}",
      title: "Claude Apprentice",
      uid: "cq-" + Math.random().toString(36).slice(2,8)
    }
  };
}
/* Derived rather than duplicated. These two lists drifted apart once before: a
   second getFreshState was added without 21 of the keys and S_DEFAULTS matched
   the shorter one, so profile, dailyTarget, voiceNotes and others were never
   initialised - S.profile alone had 18 unguarded reads of undefined. */
const S_DEFAULTS = getFreshState();
/* Repair any saved field with a missing or wrong-shaped value, so older or partial
   saves can't throw (badges/answered) or silently go NaN (xp/cardsSeen). */
function migrate(raw){
  const s = Object.assign(getFreshState(), raw||{});
  for(const k of Object.keys(S_DEFAULTS)){
    const def = S_DEFAULTS[k];
    let ok;
    if(def === null){
      /* A null default means "absent is a real value" - studyPlan is null until
         one is created. Coercing it to {} made the !S.studyPlan guard pass and
         gave every new user a truthy empty plan. */
      ok = s[k] === null || (!!s[k] && typeof s[k] === "object" && !Array.isArray(s[k]));
      if(!ok) s[k] = null;
      continue;
    }
    if(Array.isArray(def)) ok = Array.isArray(s[k]);
    else if(typeof def === "object") ok = !!s[k] && typeof s[k] === "object" && !Array.isArray(s[k]);
    else if(typeof def === "number") ok = typeof s[k] === "number" && isFinite(s[k]);
    else ok = typeof s[k] === typeof def;
    if(!ok) s[k] = Array.isArray(def) ? [] : (typeof def === "object" ? {} : def);
  }
  s.v = 1;
  return s;
}
let S = migrate(store.get());


function save(){ store.set(S); }

/* ================= THEME ================= */
function applyTheme(){
  const r=document.documentElement;
  if(S.theme==="auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", S.theme);
}
function cycleTheme(){
  S.theme = S.theme==="auto" ? "light" : S.theme==="light" ? "dark" : "auto";
  save(); applyTheme(); renderHeader();
  toast("Theme: "+S.theme);
}
