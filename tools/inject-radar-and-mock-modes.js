const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const isCRLF = html.includes('\r\n');
if (isCRLF) html = html.replace(/\r\n/g, '\n');

// 1. Add renderReadinessRadarSvg before certViewRender
const radarFn = `
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
`;

if (!html.includes('function renderReadinessRadarSvg')) {
  html = html.replace('function certView(id){', radarFn + '\nfunction certView(id){');
}

// 2. Add Radar to certViewRender
const oldPrepPanel = `   +'<div class="panel"><div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">'
   +'<div class="prepring" style="--pv:'+(rp.score*3.6)+'deg; --pc:'+c.color+'"><span>'+rp.score+'<small>%</small></span></div>'
   +'<div style="flex:1; min-width:200px;"><h3 style="font-size:15px;">Prep progress</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin-top:3px; line-height:1.5;">Based on this app\\'s material only — not a prediction about the real exam.</p></div></div>'
   +'<div style="margin-top:14px;">'+meters+'</div>'`;

const newPrepPanel = `   +'<div class="panel"><div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">'
   +'<div class="prepring" style="--pv:'+(rp.score*3.6)+'deg; --pc:'+c.color+'"><span>'+rp.score+'<small>%</small></span></div>'
   +'<div style="flex:1; min-width:200px;"><h3 style="font-size:15px;">Candidate Prep Readiness</h3>'
   +'<p style="font-size:12px; color:var(--muted); margin-top:3px; line-height:1.5;">Based on this app\\'s material only — not a prediction about the real exam.</p></div></div>'
   +'<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-top:14px; align-items:center;">'
   +'<div>'+meters+'</div>'
   +renderReadinessRadarSvg(c, rp)
   +'</div>'`;

if (html.includes(oldPrepPanel)) {
  html = html.replace(oldPrepPanel, newPrepPanel);
}

// 3. Update startMock to support count parameter
const oldStartMock = `function startMock(id){
  const c=CERTS.find(x=>x.id===id);
  if(!c.questions.length) return noContent(c,"mock exam questions");
  const n=Math.min(20,c.questions.length);
  M={cert:c, idxs:sampleByDomain(c,n), i:0, picks:new Array(n).fill(null), flags:[], secs:40*60, timer:null};
  M.timer=setInterval(()=>{ M.secs--; const t=$("mt"); if(t){ t.textContent=fmtT(M.secs); if(M.secs<=300)t.classList.add("low"); } if(M.secs<=0)finishMock(); },1000);
  mockQ();
}`;

const newStartMock = `function startMock(id, count){
  const c=CERTS.find(x=>x.id===id);
  if(!c.questions.length) return noContent(c,"mock exam questions");
  const n=Math.min(count || 20, c.questions.length);
  const timeMins = (n >= 40) ? 60 : 40;
  M={cert:c, idxs:sampleByDomain(c,n), i:0, picks:new Array(n).fill(null), flags:[], secs:timeMins*60, timer:null};
  M.timer=setInterval(()=>{ M.secs--; const t=$("mt"); if(t){ t.textContent=fmtT(M.secs); if(M.secs<=300)t.classList.add("low"); } if(M.secs<=0)finishMock(); },1000);
  mockQ();
}`;

if (html.includes(oldStartMock)) {
  html = html.replace(oldStartMock, newStartMock);
}

// Validate JS with vm
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  new vm.Script(match[1]);
  console.log('Script block 0 verified valid JS!');
}

if (isCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html with Radar SVG and Mock Mode');
