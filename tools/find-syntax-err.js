const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (match) {
  const code = match[1];
  const lines = code.split('\n');
  for (let i = 580; i < 620; i++) {
    console.log(`${i}: ${lines[i]}`);
  }
}
