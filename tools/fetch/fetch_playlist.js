// Fetch all video IDs from YouTube playlist
const https = require('https');
const P = require('../_paths');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'ja' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const url = 'https://www.youtube.com/playlist?list=PLR-TVlABNl3M';
  console.log('Fetching playlist page...');
  const html = await fetchPage(url);
  
  // Extract video IDs from the HTML
  const idRegex = /\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g;
  const ids = new Set();
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  
  console.log(`Found ${ids.size} unique video IDs from playlist HTML`);
  
  if (ids.size < 50) {
    // Try alternative pattern
    const altRegex = /watch\?v=([a-zA-Z0-9_-]{11})/g;
    while ((match = altRegex.exec(html)) !== null) {
      ids.add(match[1]);
    }
    console.log(`After alt pattern: ${ids.size} unique IDs`);
  }
  
  // Load existing songs
  const fs = require('fs');
  const vm = require('vm');
  vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
  const existingIds = new Set(SONGS.map(s => s.id));
  
  // Find new IDs
  const newIds = [...ids].filter(id => !existingIds.has(id));
  console.log(`Existing: ${existingIds.size}, New from playlist: ${newIds.length}`);
  
  if (newIds.length > 0) {
    console.log('\nNew IDs to add:');
    newIds.forEach(id => console.log(id));
  }
  
  // Save all IDs
  fs.writeFileSync(P.data('playlist_ids.json'), JSON.stringify([...ids], null, 2), 'utf-8');
  console.log('\nAll playlist IDs saved to playlist_ids.json');
}

main().catch(console.error);
