const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Normalize to LF for matching
const isCRLF = content.includes('\r\n');
if (isCRLF) {
  content = content.replace(/\r\n/g, '\n');
}

const beforeCut = content.indexOf("if(res) res.innerHTML = html;\n}");
const afterCut = content.indexOf("function noContent(c,kind){");

if (beforeCut === -1 || afterCut === -1) {
  console.error("Markers not found", { beforeCut, afterCut });
  process.exit(1);
}

const middle = `if(res) res.innerHTML = html;
}
function renderStopReasonSimulator(container){
  container.innerHTML = \`
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
  \`;
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
    code = 'result = execute_tool(response.content.tool_use)\\nmessages.append({"role": "user", "content": [tool_result]})';
    explanation = 'This is normal tool-calling control flow (not an error!). Execute the requested function in your application and pass back a <code>tool_result</code> in the same message history.';
  } else if(val === 'refusal'){
    title = '🛑 Safety Refusal (refusal)';
    code = 'surface_refusal_to_user(response)\\n# DO NOT RETRY THE IDENTICAL REQUEST';
    explanation = 'The request was refused on safety or policy grounds. Retrying the identical request will fail again. Surface the refusal or prompt the user to reframe.';
  } else if(val === 'pause_turn'){
    title = '⏸️ Pause Turn (pause_turn)';
    code = 'resume_server_tool_loop(response)';
    explanation = 'A server-side long-running tool execution paused. Resend the conversation state to resume generation.';
  }

  const res = document.getElementById('wStopResult');
  if(res){
    res.innerHTML = \`
      <b style="color:var(--coral-dark);">\${title}</b>
      <p style="margin:6px 0 8px;">\${explanation}</p>
      <pre style="background:var(--card); padding:8px 10px; border-radius:6px; border:1px solid var(--border); font-size:12px; font-family:'SF Mono',Consolas,monospace;">\${code}</pre>
    \`;
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
     +'<div class="subtext" style="margin-top:8px;">You\\'ve read '+lp.done+'/'+lp.total+' '+c.code+' lessons. Ready to test yourself?</div>'
     +'<div class="rowbtns" style="justify-content:center;"><button class="btn" onclick="startQuiz(\\''+c.id+'\\')">⚔️ Quiz Battle</button>'
     +'<button class="btn ghost" onclick="learnList(\\''+c.id+'\\')">Back to lessons</button></div></div>';
  }
}

/* ================= QUIZ ================= */
let Q={};
/* Content arrives from data/*.json at runtime, so a missing or truncated file
   can leave a mode with nothing to show. Explain it rather than throwing. */
`;

content = content.substring(0, beforeCut) + middle + content.substring(afterCut);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Successfully patched index.html cleanly');
