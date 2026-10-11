// Apply start_times.json to songs.js
const fs = require('fs');
const P = require('../_paths');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
const starts = JSON.parse(fs.readFileSync(P.data('start_times.json'), 'utf-8'));

let updated = 0;
SONGS.forEach(s => {
  const t = starts[s.id];
  if (t !== undefined && t > 0) {
    s.start = t;
    updated++;
  }
  // Don't add start:0, it's the default
});

let out = '// Song database for Nakuru Intro Quiz - with discography info & start times\nconst SONGS = [\n';
SONGS.forEach((s, i) => {
  out += '  ' + JSON.stringify(s) + (i < SONGS.length - 1 ? ',' : '') + '\n';
});
out += '];\n';
fs.writeFileSync(P.SONGS, out, 'utf-8');

// Stats
const over1 = SONGS.filter(s => s.start && s.start >= 1).sort((a,b) => b.start - a.start);
console.log(`Updated: ${updated} songs with start times`);
console.log(`\nTop songs with long intros:`);
over1.forEach(s => console.log(`  ${s.start}s - ${s.title}`));
