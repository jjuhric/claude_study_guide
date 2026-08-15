const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

const domainsCount = {
  ccao: 7,
  ccdv: 7,
  ccaf: 5,
  ccap: 5
};

for (const [id, count] of Object.entries(domainsCount)) {
  const cert = JSON.parse(fs.readFileSync(path.join(dataDir, `${id}.json`), 'utf8'));
  cert.questions.forEach((q, i) => {
    if (q.d === undefined || q.d < 0 || q.d >= count) {
      console.error(`Invalid domain in ${id} question ${i} (${q.id}): d=${q.d}, expected < ${count}`);
    }
  });
}
console.log('Domain index check complete.');
