const fs = require('fs');
const path = require('path');
const vm = require('vm');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const isCRLF = html.includes('\r\n');
if (isCRLF) html = html.replace(/\r\n/g, '\n');

// 1. Update labToolsModal to include all 9 interactive tools
const oldLabTools = `function labToolsModal(){
  renderHeader();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  $("app").innerHTML = '<button class="back" onclick="home()">← Back to Home</button>'
    + '<div class="panel"><h2 style="font-size:20px;">🛠️ Interactive Exam Lab Simulators</h2>'
    + '<p class="subtext">Interactive sandboxes and visualizers to master the mechanics tested on Developer and Architect exams.</p>'
    + '<div class="widget-box" data-widget="mcp-inspector"></div>'
    + '<div class="widget-box" data-widget="thinking-simulator"></div>'
    + '<div class="widget-box" data-widget="computer-use"></div>'
    + '<div class="widget-box" data-widget="token-cost"></div>'
    + '<div class="widget-box" data-widget="xml-prompt"></div>'
    + '<div class="widget-box" data-widget="stop-reason"></div>'
    + '</div>';
  initLessonWidgets();
}`;

const newLabTools = `function labToolsModal(){
  renderHeader();
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  $("app").innerHTML = '<button class="back" onclick="home()">← Back to Home</button>'
    + '<div class="panel"><h2 style="font-size:20px;">🛠️ Interactive Exam Lab Simulators & Decision Trees</h2>'
    + '<p class="subtext">Interactive sandboxes, diagnostic decision trees, and protocol visualizers to master the mechanics tested on Developer and Architect exams.</p>'
    + '<div class="widget-box" data-widget="model-decision-tree"></div>'
    + '<div class="widget-box" data-widget="arch-decision-tree"></div>'
    + '<div class="widget-box" data-widget="rag-visualizer"></div>'
    + '<div class="widget-box" data-widget="mcp-inspector"></div>'
    + '<div class="widget-box" data-widget="thinking-simulator"></div>'
    + '<div class="widget-box" data-widget="computer-use"></div>'
    + '<div class="widget-box" data-widget="token-cost"></div>'
    + '<div class="widget-box" data-widget="xml-prompt"></div>'
    + '<div class="widget-box" data-widget="stop-reason"></div>'
    + '</div>';
  initLessonWidgets();
}`;

if (html.includes(oldLabTools)) {
  html = html.replace(oldLabTools, newLabTools);
}

// 2. Update initLessonWidgets to support new widgets
const oldInitWidgets = `function initLessonWidgets(){
  const boxes = document.querySelectorAll('.widget-box');
  boxes.forEach(box => {
    const type = box.getAttribute('data-widget');
    if(type === 'token-cost') renderTokenCostCalculator(box);
    else if(type === 'mcp-inspector') renderMcpInspector(box);
    else if(type === 'thinking-simulator') renderThinkingSimulator(box);
    else if(type === 'computer-use') renderComputerUseSimulator(box);
    else if(type === 'xml-prompt') renderXmlPromptChecker(box);
    else if(type === 'stop-reason') renderStopReasonSimulator(box);
  });`;

const newInitWidgets = `function initLessonWidgets(){
  const boxes = document.querySelectorAll('.widget-box');
  boxes.forEach(box => {
    const type = box.getAttribute('data-widget');
    if(type === 'token-cost') renderTokenCostCalculator(box);
    else if(type === 'mcp-inspector') renderMcpInspector(box);
    else if(type === 'thinking-simulator') renderThinkingSimulator(box);
    else if(type === 'computer-use') renderComputerUseSimulator(box);
    else if(type === 'xml-prompt') renderXmlPromptChecker(box);
    else if(type === 'stop-reason') renderStopReasonSimulator(box);
    else if(type === 'model-decision-tree') { box.innerHTML = renderModelDecisionTree(); }
    else if(type === 'arch-decision-tree') { box.innerHTML = renderArchitectureDecisionTree(); }
    else if(type === 'rag-visualizer') { box.innerHTML = renderRagChunkingVisualizer(); updateRagChunks(); }
  });`;

if (html.includes(oldInitWidgets)) {
  html = html.replace(oldInitWidgets, newInitWidgets);
}

// Validate JS syntax with vm
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  new vm.Script(match[1]);
  console.log('Script block 0 verified valid JS syntax!');
}

if (isCRLF) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully enhanced labToolsModal and initLessonWidgets in index.html');
