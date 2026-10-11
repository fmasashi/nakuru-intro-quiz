// Full audit: verify all songs exist, titles match, channels are Nakuru-related
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
          try { const j = JSON.parse(data); resolve({ id: videoId, title: j.title, author: j.author_name, status: 'ok' }); }
          catch (e) { resolve({ id: videoId, status: 'parse_error' }); }
        } else { resolve({ id: videoId, status: `http_${res.statusCode}` }); }
      });
    }).on('error', () => resolve({ id: videoId, status: 'error' }));
  });
}

const nakuruChannels = [
  'Aitsuki Nakuru', '藍月なくる', 'Endorfin.', 'La prière', 'lapix',
  'Itsuki Natsume', '棗いつき', 'nayuta', 'Topic', 'アニプレックス',
];

function isNakuru(author) {
  return nakuruChannels.some(c => author.includes(c));
}

async function main() {
  console.log(`Auditing ${SONGS.length} songs...\n`);
  
  const results = [];
  for (let i = 0; i < SONGS.length; i += 5) {
    const batch = SONGS.slice(i, i + 5);
    const r = await Promise.all(batch.map(s => fetchOembed(s.id)));
    results.push(...r);
    if ((i + 5) % 50 === 0) console.log(`Progress: ${Math.min(i + 5, SONGS.length)}/${SONGS.length}`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  const issues = [];
  const toRemove = [];
  
  SONGS.forEach((s, i) => {
    const r = results.find(x => x.id === s.id);
    if (!r || r.status !== 'ok') {
      issues.push(`❌ DEAD: #${i+1} "${s.title}" (${s.id}) - ${r?.status || 'no result'}`);
      toRemove.push(s.id);
      return;
    }
    
    // Channel check
    if (!isNakuru(r.author)) {
      issues.push(`⚠️ CHANNEL: #${i+1} "${s.title}" (${s.id}) → ${r.author} | YT title: "${r.title}"`);
      toRemove.push(s.id);
      return;
    }
    
    // Title sanity check - our title should appear somewhere in the YT title or vice versa
    const ourClean = s.title.replace(/[\s\-()（）【】\[\]\/]/g, '').toLowerCase();
    const ytClean = r.title.replace(/[\s\-()（）【】\[\]\/]/g, '').toLowerCase();
    
    // Check if our quiz title is reasonable
    if (ourClean.length > 4 && !ytClean.includes(ourClean.substring(0, Math.min(6, ourClean.length))) 
        && !ourClean.includes(ytClean.substring(0, Math.min(6, ytClean.length)))) {
      issues.push(`📝 TITLE_DIFF: #${i+1} Ours: "${s.title}" → YT: "${r.title}" (${r.author})`);
    }
  });
  
  // Duplicate check
  const idSet = new Set();
  SONGS.forEach(s => {
    if (idSet.has(s.id)) issues.push(`🔁 DUPE_ID: ${s.id} "${s.title}"`);
    idSet.add(s.id);
  });
  const titleSet = new Set();
  SONGS.forEach(s => {
    if (titleSet.has(s.title)) issues.push(`🔁 DUPE_TITLE: "${s.title}" (${s.id})`);
    titleSet.add(s.title);
  });
  
  console.log(`\n=== AUDIT RESULTS ===`);
  console.log(`Total songs: ${SONGS.length}`);
  console.log(`Issues found: ${issues.length}`);
  console.log(`Songs to remove: ${toRemove.length}\n`);
  
  if (issues.length) {
    issues.forEach(i => console.log(i));
  } else {
    console.log('✅ All songs verified!');
  }
  
  // Auto-fix: remove dead/non-Nakuru songs
  if (toRemove.length > 0) {
    const removeSet = new Set(toRemove);
    const clean = SONGS.filter(s => !removeSet.has(s.id));
    let out = '// Song database for Nakuru Intro Quiz - with discography info\nconst SONGS = [\n';
    clean.forEach((s, i) => {
      out += '  ' + JSON.stringify(s) + (i < clean.length - 1 ? ',' : '') + '\n';
    });
    out += '];\n';
    fs.writeFileSync(P.SONGS, out, 'utf-8');
    console.log(`\n✅ Removed ${toRemove.length} songs. New total: ${clean.length}`);
  }
  
  // Category stats
  const cats = {};
  const finalSongs = SONGS.filter(s => !new Set(toRemove).has(s.id));
  finalSongs.forEach(s => { cats[s.category] = (cats[s.category] || 0) + 1; });
  console.log('\nCategories:', JSON.stringify(cats));
}

main().catch(console.error);
