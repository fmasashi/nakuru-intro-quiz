// Cross-verify songs.js info against oEmbed channel data and known discography
const fs = require('fs');
const P = require('../_paths');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));
const channels = JSON.parse(fs.readFileSync(P.data('channel_check.json'), 'utf-8'));

const channelMap = {};
channels.forEach(c => { if (c.status === 'ok') channelMap[c.id] = { author: c.author, title: c.title }; });

const issues = [];

// Intentional exceptions (id → why). Skipped by the category-vs-channel checks only.
const KNOWN_EXCEPTIONS = {
  'O9XuzOv6Y3A': 'ペンと林檎とわたし: カバー曲。Endorfin. - Topic 配信だが category=solo が正（2026-07 ファクトチェック済み）',
};

SONGS.forEach((s, i) => {
  const ch = channelMap[s.id];
  if (!ch) {
    issues.push(`[NO_OEMBED] #${i+1} ${s.title} (${s.id}) - oEmbedデータなし`);
    return;
  }
  
  // Category vs channel check
  const isEndorfinChannel = ch.author.includes('Endorfin');
  const isNakuruChannel = ch.author.includes('Aitsuki Nakuru');
  const isLaPriereChannel = ch.author.includes('La prière');
  const isItsukiChannel = ch.author.includes('棗いつき');

  // Category mismatch
  const catExempt = Boolean(KNOWN_EXCEPTIONS[s.id]);
  if (!catExempt && s.category === 'solo' && isEndorfinChannel && !s.info.includes('Transpain') && !s.info.includes('Feryquitous JazzRemix')) {
    issues.push(`[CAT_MISMATCH] #${i+1} "${s.title}" → category=solo but channel=${ch.author}. Should be endorfin?`);
  }
  if (!catExempt && s.category === 'endorfin' && isNakuruChannel && !isEndorfinChannel) {
    issues.push(`[CAT_MISMATCH] #${i+1} "${s.title}" → category=endorfin but channel=${ch.author}. Should be solo?`);
  }
  if (!catExempt && s.category === 'solo' && isLaPriereChannel) {
    issues.push(`[CAT_MISMATCH] #${i+1} "${s.title}" → category=solo but channel=${ch.author}. Should be la_priere?`);
  }
  
  // Title mismatch check (oEmbed title vs our title)
  const oTitle = ch.title;
  const ourTitle = s.title;
  // Normalize for comparison
  const normalize = t => t.replace(/\s+/g, '').replace(/[（）()【】\[\]]/g, '').toLowerCase();
  if (!normalize(oTitle).includes(normalize(ourTitle)) && !normalize(ourTitle).includes(normalize(oTitle).substring(0,8))) {
    // Only flag if titles are really different
    if (ourTitle.length > 3) {
      issues.push(`[TITLE_CHECK] #${i+1} Our: "${ourTitle}" vs oEmbed: "${oTitle}"`);
    }
  }
  
  // Info quality check
  if (s.info === '藍月なくる オリジナル曲' || s.info === 'Endorfin. (sky_delta × 藍月なくる) / 作曲: sky_delta') {
    // These are fallback info - not necessarily wrong but less specific
  }
});

console.log(`=== Verification Results (${SONGS.length} songs) ===\n`);
if (issues.length === 0) {
  console.log('All verified! No issues found.');
} else {
  console.log(`Found ${issues.length} potential issues:\n`);
  issues.forEach(i => console.log(i));
}

// Also check for duplicate IDs
const ids = SONGS.map(s => s.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.log(`\n[DUPLICATE IDS] ${dupes.join(', ')}`);
}

// Check for duplicate titles
const titles = SONGS.map(s => s.title);
const dupeTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dupeTitles.length) {
  console.log(`\n[DUPLICATE TITLES] ${dupeTitles.join(', ')}`);
}
