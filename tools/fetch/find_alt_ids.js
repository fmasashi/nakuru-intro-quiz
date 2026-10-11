// Search for missing songs by trying common YouTube ID patterns
const https = require('https');

// Songs to search for via web/oEmbed approach
const searchTerms = [
  'Not a Hero いつきんくる',
  '約束のリンカネーション いつきんくる',
  'Hookah whoo 藍月なくる',
  '初恋日記 藍月なくる',
  'フォニイ 藍月なくる',
  'INTERNET YAMERO 藍月なくる',
  '深海のリトルクライ 藍月なくる',
  'Infinity Rage La priere',
  '恋のイリュージョニスタ La priere',
  'それは世界を越えて La priere',
  'Poisson Poison 藍月なくる',
  'Cirsium 藍月なくる',
];

// Try fetching known IDs from search results
const extraIds = [
  // Try alternative IDs found in various sources
  'Nq27j-BTAQ0', // Not a Hero - GREE channel
  'B6oAPPPBcR8', // Not a Hero possible alt
  'UKJdLZ5C6HE', // 約束のリンカネーション possible  
  'GCwEzG8n4G0', // それは世界を越えて possible
];

function fetchOembed(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { const j = JSON.parse(data); resolve({ id: videoId, title: j.title, author: j.author_name, status: 'ok' }); }
          catch (e) { resolve({ id: videoId, status: 'parse_error' }); }
        } else { resolve({ id: videoId, status: `http_${res.statusCode}` }); }
      });
    }).on('error', () => resolve({ id: videoId, status: 'error' }));
  });
}

async function main() {
  const results = await Promise.all(extraIds.map(fetchOembed));
  results.forEach(r => {
    if (r.status === 'ok') {
      console.log(`✅ ${r.id} → "${r.title}" by ${r.author}`);
    } else {
      console.log(`❌ ${r.id} → ${r.status}`);
    }
  });
}

main();
