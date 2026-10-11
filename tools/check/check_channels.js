// List songs whose YouTube channel is not a known Nakuru-related channel (read-only: writes data/channel_check.json, never songs.js)
const https = require('https');
const P = require('../_paths');
const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));

function fetchOembed(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { const j = JSON.parse(data); resolve({ id: videoId, author: j.author_name, title: j.title, status: 'ok' }); }
          catch (e) { resolve({ id: videoId, author: null, status: 'error' }); }
        } else { resolve({ id: videoId, author: null, status: `http_${res.statusCode}` }); }
      });
    }).on('error', () => resolve({ id: videoId, author: null, status: 'error' }));
  });
}

async function main() {
  console.log(`Checking ${SONGS.length} songs for channel info...`);
  const results = [];
  for (let i = 0; i < SONGS.length; i += 5) {
    const batch = SONGS.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(s => fetchOembed(s.id)));
    results.push(...batchResults);
    await new Promise(r => setTimeout(r, 300));
  }
  
  // Collect all unique authors
  const authors = {};
  results.forEach(r => {
    if (r.status === 'ok') {
      authors[r.author] = (authors[r.author] || 0) + 1;
    }
  });
  
  console.log('\n=== Channels ===');
  Object.entries(authors).sort((a,b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`${count}x ${name}`);
  });
  
  // Known Nakuru-related channels
  const allowedChannels = new Set([
    '藍月なくる / Aitsuki Nakuru',
    'Aitsuki Nakuru',
    'Aitsuki Nakuru - Topic',
    'Nakuru Aitsuki - Topic',
    '藍月なくる',
    'Endorfin.',
    'Endorfin. - Topic',
    'La prière',
    'lapix',
    'lapix - Topic',
    'sky_delta',
    'Feryquitous',
    'MEGAREX',
    'JelLaboratory',
    'Osanzi',
    'dai',
  ]);
  
  // Songs legitimately hosted on someone else's channel (id → why). Listed separately, never flagged.
  const KNOWN_EXTERNAL = {
    'U6q9Y5PWfkI': '棗いつき×藍月なくる「追想のラグナロク」— 棗いつきさんのチャンネル',
    'ZgbQcvtndI4': '藍月なくる×DECO*27×tepe「Hookah, whoo!」— アニプレックス公式MV',
  };
  const known = results.filter(r => KNOWN_EXTERNAL[r.id]);
  console.log('\n=== Known external-channel songs (expected) ===');
  known.forEach(r => console.log(`${r.author} | ${r.title} | ${r.id} … ${KNOWN_EXTERNAL[r.id]}`));

  // Anything else not on a known Nakuru-related channel needs a manual look
  const suspicious = results.filter(r => r.status === 'ok' && !allowedChannels.has(r.author) && !KNOWN_EXTERNAL[r.id]);
  console.log('\n=== Possibly non-Nakuru songs ===');
  if (suspicious.length === 0) console.log('(none)');
  suspicious.forEach(r => console.log(`${r.author} | ${r.title} | ${r.id}`));
  
  fs.writeFileSync(P.data('channel_check.json'), JSON.stringify(results, null, 2), 'utf-8');
  console.log('\nSaved to channel_check.json');
}

main();
