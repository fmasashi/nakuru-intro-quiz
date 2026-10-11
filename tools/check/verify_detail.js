// Detailed title comparison: our title vs oEmbed title
const fs = require('fs');
const P = require('../_paths');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
const channels = JSON.parse(fs.readFileSync(P.data('channel_check.json'), 'utf-8'));

const channelMap = {};
channels.forEach(c => { if (c.status === 'ok') channelMap[c.id] = c; });

console.log('=== Title Comparison (our title vs YouTube oEmbed title) ===\n');

let mismatches = 0;
SONGS.forEach((s, i) => {
  const ch = channelMap[s.id];
  if (!ch) return;
  
  // Show all where titles differ significantly
  const ourClean = s.title.replace(/\s/g, '');
  const ytClean = ch.title.replace(/\s/g, '');
  
  if (!ytClean.includes(ourClean) && !ourClean.includes(ytClean.substring(0, Math.min(6, ytClean.length)))) {
    console.log(`#${i+1} DIFF:`);
    console.log(`  Ours:  ${s.title}`);
    console.log(`  YT:    ${ch.title}`);
    console.log(`  Info:  ${s.info}`);
    console.log();
    mismatches++;
  }
});

if (mismatches === 0) console.log('No significant title differences found!');
else console.log(`\n${mismatches} title differences found.`);

// Also list all info for sampling
console.log('\n\n=== Random Sample: 20 songs with info ===\n');
const shuffled = [...SONGS].sort(() => Math.random() - 0.5).slice(0, 20);
shuffled.forEach(s => {
  console.log(`[${s.category}] ${s.title}`);
  console.log(`  → ${s.info}`);
  console.log();
});
