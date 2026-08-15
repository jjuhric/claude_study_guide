const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const certs = ['ccao', 'ccdv', 'ccaf', 'ccap'];

const prose = b => b.replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

for (const c of certs) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${c}.json`), 'utf8'));
  console.log(`\n=== ${c.toUpperCase()} (${data.lessons.length} lessons) ===`);
  data.lessons.forEach((l, i) => {
    const w = prose(l.b).split(" ").filter(Boolean).length;
    const ok = w >= (l.foundation ? 250 : 400);
    console.log(`[${i}] ${ok ? 'OK ' : 'LOW'} ${w}w - ${l.h}`);
  });
}
