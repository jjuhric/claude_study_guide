const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

['ccao', 'ccdv', 'ccaf', 'ccap'].forEach(certId => {
  const filePath = path.join(dataDir, `${certId}.json`);
  const cert = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  cert.questions.forEach((q, i) => {
    if (!q.exp || typeof q.exp !== 'string') {
      if (Array.isArray(q.why) && q.why[q.a]) {
        q.exp = q.why[q.a];
      } else {
        q.exp = `Correct answer is: ${q.opts[q.a]}`;
      }
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(cert, null, 2), 'utf8');
  console.log(`Verified exp for all ${cert.questions.length} questions in ${certId}.json`);
});
