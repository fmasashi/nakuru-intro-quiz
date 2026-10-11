// Apply loudness normalization to songs.js
const fs = require('fs');
const P = require('../_paths');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
const loudness = JSON.parse(fs.readFileSync(P.data('loudness.json'), 'utf-8'));

// Calculate average (excluding nulls/errors)
const validMeans = Object.values(loudness).filter(v => v && v.mean).map(v => v.mean);
const avgMean = validMeans.reduce((a, b) => a + b, 0) / validMeans.length;

console.log(`Average loudness: ${avgMean.toFixed(1)} dB`);
console.log(`Range: ${Math.min(...validMeans).toFixed(1)} to ${Math.max(...validMeans).toFixed(1)} dB\n`);

let updated = 0;
SONGS.forEach(s => {
  const data = loudness[s.id];
  if (!data || !data.mean) return;

  // dB difference from average (positive = song is quieter than avg)
  const diff = avgMean - data.mean;
  // Convert to amplitude ratio: 10^(diff/20)
  let multiplier = Math.pow(10, diff / 20);
  // Clamp to reasonable range (0.4x to 2.5x)
  multiplier = Math.max(0.4, Math.min(2.5, multiplier));
  // Round to 2 decimals
  multiplier = Math.round(multiplier * 100) / 100;

  // Only store if significantly different from 1.0
  if (Math.abs(multiplier - 1.0) > 0.05) {
    s.vol = multiplier;
    updated++;
  }
});

let out = '// Song database for Nakuru Intro Quiz - with discography info, start times & volume normalization\nconst SONGS = [\n';
SONGS.forEach((s, i) => {
  out += '  ' + JSON.stringify(s) + (i < SONGS.length - 1 ? ',' : '') + '\n';
});
out += '];\n';
fs.writeFileSync(P.SONGS, out, 'utf-8');

// Show adjustments
const adjusted = SONGS.filter(s => s.vol).sort((a, b) => (a.vol || 1) - (b.vol || 1));
console.log(`Songs with volume adjustment: ${updated}\n`);

console.log('🔉 Volume reduced (loud songs):');
adjusted.filter(s => s.vol < 1).slice(0, 10).forEach(s =>
  console.log(`  ${s.vol}x - ${s.title}`)
);

console.log('\n🔊 Volume boosted (quiet songs):');
adjusted.filter(s => s.vol > 1).slice(-10).forEach(s =>
  console.log(`  ${s.vol}x - ${s.title}`)
);
