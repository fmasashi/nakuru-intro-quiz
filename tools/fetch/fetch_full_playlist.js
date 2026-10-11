// Extract ALL video IDs from YouTube playlist using ytInitialData
const https = require('https');
const P = require('../_paths');
const fs = require('fs');
const vm = require('vm');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml'
      }
    }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchTitle(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve({ id: videoId, title: JSON.parse(data).title, status: 'ok' }); }
          catch (e) { resolve({ id: videoId, title: null, status: 'parse_error' }); }
        } else { resolve({ id: videoId, title: null, status: `http_${res.statusCode}` }); }
      });
    }).on('error', () => resolve({ id: videoId, title: null, status: 'error' }));
  });
}

async function main() {
  console.log('Fetching playlist page...');
  const html = await fetchPage('https://www.youtube.com/playlist?list=PLR-TVlABNl3M');
  
  // Try to extract ytInitialData
  const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s);
  if (!match) {
    console.log('Could not find ytInitialData, trying videoId pattern...');
  } else {
    console.log('Found ytInitialData, parsing...');
    try {
      const data = JSON.parse(match[1]);
      // Navigate to playlist contents
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      if (tabs) {
        const tab = tabs[0];
        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
          ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
        if (contents) {
          console.log(`Found ${contents.length} items in ytInitialData`);
        }
      }
    } catch (e) {
      console.log('Failed to parse ytInitialData:', e.message);
    }
  }
  
  // Extract ALL videoId patterns from the entire HTML
  const idRegex = /\"videoId\"\s*:\s*\"([a-zA-Z0-9_-]{11})\"/g;
  const allIds = new Set();
  let m;
  while ((m = idRegex.exec(html)) !== null) {
    allIds.add(m[1]);
  }
  console.log(`Total unique videoIds found in HTML: ${allIds.size}`);
  
  // Load existing
  vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
  const existingIds = new Set(SONGS.map(s => s.id));
  const newIds = [...allIds].filter(id => !existingIds.has(id));
  console.log(`Already have: ${existingIds.size}, New: ${newIds.length}`);
  
  if (newIds.length === 0) {
    console.log('No new songs to add!');
    return;
  }
  
  // Fetch titles for new IDs
  console.log(`\nFetching titles for ${newIds.length} new IDs...`);
  const results = [];
  for (let i = 0; i < newIds.length; i += 5) {
    const batch = newIds.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(fetchTitle));
    results.push(...batchResults);
    await new Promise(r => setTimeout(r, 300));
  }
  
  const ok = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status !== 'ok');
  console.log(`\nSuccess: ${ok.length}, Failed: ${failed.length}`);
  
  // Clean title
  function cleanTitle(raw) {
    return raw
      .replace(/^【MV】/, '').replace(/^藍月なくる\s*[-–]\s*/, '')
      .replace(/^Endorfin\.\s*[-–]\s*/, '')
      .replace(/\s*\/\s*La prière$/, '').replace(/\s*\/\s*藍月なくる$/, '')
      .replace(/\s*\(Official Video\)$/, '').replace(/\s*\(Music Video\)$/, '')
      .replace(/\s*\(Short Ver\.\)$/, '').replace(/\[オリジナルMV\]/, '')
      .replace(/^\[dai×nayuta\]\s*/, '')
      .replace(/\s*-\s*棗いつき × 藍月なくる$/, '')
      .replace(/\s*\/\s*棗いつき×藍月なくる$/, '')
      .trim();
  }
  
  function detectCategory(raw) {
    if (raw.includes('La prière') || raw.includes('La priere')) return 'la_priere';
    if (raw.includes('Endorfin')) return 'endorfin';
    if (raw.includes('棗いつき') || raw.includes('いつきんくる')) return 'itsukinkuru';
    return 'solo';
  }
  
  // Check for duplicate titles
  const existingTitles = new Set(SONGS.map(s => s.title));
  
  ok.forEach(r => {
    const title = cleanTitle(r.title);
    const cat = detectCategory(r.title);
    if (existingTitles.has(title)) {
      console.log(`SKIP (dupe title): ${title} (${r.id})`);
      return;
    }
    existingTitles.add(title);
    SONGS.push({ id: r.id, title, category: cat, info: '', lyrics: '' });
    console.log(`ADD: [${cat}] ${title} (${r.id})`);
  });
  
  failed.forEach(r => console.log(`FAILED: ${r.id} (${r.status})`));
  
  // Write
  let out = '// Song database for Nakuru Intro Quiz - rebuilt from YouTube oEmbed\nconst SONGS = [\n';
  SONGS.forEach((s, i) => {
    out += '  ' + JSON.stringify(s) + (i < SONGS.length - 1 ? ',' : '') + '\n';
  });
  out += '];\n';
  fs.writeFileSync(P.SONGS, out, 'utf-8');
  
  const cats = {};
  SONGS.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
  console.log('\nFinal:', SONGS.length, 'Categories:', JSON.stringify(cats));
}

main().catch(console.error);
