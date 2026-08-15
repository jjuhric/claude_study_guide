const fs = require('fs');
const path = require('path');

const certs = ['ccao', 'ccdv', 'ccaf', 'ccap'];
const dataDir = path.join(__dirname, '..', 'data');

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

certs.forEach(cert => {
  const filePath = path.join(dataDir, `${cert}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = false;

  if (data.lessons) {
    data.lessons.forEach((lesson, index) => {
      if (!lesson.id) {
        const slug = slugify(lesson.h.replace(/^start-here-/, ''));
        lesson.id = `${cert}l-${slug || index}`;
        updated = true;
      }
    });
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated lesson IDs in ${cert}.json`);
  } else {
    console.log(`No changes needed for ${cert}.json`);
  }
});
