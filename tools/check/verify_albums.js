// Verify album assignments match the researched tracklists
const fs = require('fs');
const P = require('../_paths');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));

// Known album tracklists from research
const albums = {
  'JelLaboratory': { year: 2018, tracks: ['JelLaboratory', 'わがままモザイク', 'Satellite Connect', 'エーテル', 'Cadeau de Dieu'] },
  'Nacollection!! 2': { year: 2017, tracks: ['星空のアナグラム', 'ふたりのラクエン', 'その名はRendezvous', 'ジョーカー・パレード', 'ガラスアゲハ'] },
  'Nacollection -3-': { year: 2020, tracks: ['Azura Luno', 'わたしがわたしに至った10の理由', 'Lilith', 'フェイク', 'Folded Wings', 'whisper'] },
  'Transpain': { year: 2021, tracks: ['Oxydlate', 'mirror', 'ガラスアゲハ (Feryquitous JazzRemix)', 'Othello syndrome', 'Drop Role', 'Evil Bubble', 'Transpain'] },
  'Counterfeit': { year: 2022, tracks: ['FAKE IDOL', 'Domination', 'Bad Drip', 'Defective', '唾と蜜', 'Dirt'] },
  'Indigrotto': { year: 2022, tracks: ['Indigrotto', '夢の呼応', 'Settlement', 'Killer neuron', 'Codependence', 'Rest in Peace my Dear'] },
  'ミシュメリア': { year: 2023, tracks: ['ミシュメリア', 'Fragile Utopia', 'オッドアイ・リリィ', 'Tuliparfeit', '逆沙華', 'Lucid Hallucination'] },
  'Nacollection4': { year: 2023, tracks: ['Cosmodiver', 'ルナティッククレイジー', 'ヘヴンリィ', '閃耀', 'Monodrate', 'トワイライト'] },
  'わたしとキミの幸せな終末': { year: 2025, tracks: ['ヘイマルメネー', 'アンチテール', 'ミスリルドロップ', 'Predatory', 'Seed of Fate', '軌跡'] },
  '真相': { year: 2025, tracks: ['真相', 'ご注文はえいえんに', 'Bubble Bubble Boy', 'エモーション・キャプチャー', '愛の残滓', 'Mirroring Mirage', '乖離光', '永劫不可逆', 'クラリムステラ'] },
  'ILLUAMOR': { year: 2026, tracks: ['ILLUAMOR', 'ロマネスクミラージュ', '幻想ラチェット', 'なくなっちゃった。', 'Dear The Night I Loved', '煌命残滓'] },
  // Endorfin.
  'Horizon Note': { year: 2016, tracks: ['Horizon Note', '桜色プリズム', 'Luminous Rage', 'Spica', 'コトノハ', '海月'] },
  'Alt.Strato': { year: 2018, tracks: ['Cornus Florida', 'リフレクション', '泡沫の灯', 'Alt.Strato'] },
  'LOST-IDEA': { year: 2019, tracks: ['絵空', 'カラフルモーメント', 'Kaleidoscope', 'ユリシス', 'LØST-IDEA', '薄明が告げる明日に'] },
  'Horizon Claire': { year: 2020, tracks: ['残光', 'floating outsider', 'Fatalism', '彗星のパラソル', 'Horizon Claire'] },
  'モノローグ・オフ': { year: 2021, tracks: ['アンダーマリン', 'Round & Round', '惑星トリップ', "Alice's Suitcase", 'モノローグ・オフ'] },
  'Dream Blue': { year: 2025, tracks: ['空白少女', 'Focus on', 'ゴースト・マキアート', 'Draw World!', 'タイニーソング', 'ドリームブルー'] },
  'Cirro.Strato': { year: 2026, tracks: ['太陽のない夏みたいな僕を', 'ハルラ', '八月と青とラムネ', 'サマーエンディング', 'ある夏のエピローグ'] },
};

console.log('=== Album Assignment Verification ===\n');
let totalIssues = 0;

Object.entries(albums).forEach(([albumName, data]) => {
  const songsInAlbum = SONGS.filter(s => s.info && s.info.includes(albumName));
  
  // Check if all expected tracks are found
  const missing = data.tracks.filter(t => {
    return !songsInAlbum.some(s => s.title.includes(t) || t.includes(s.title.substring(0, 6)));
  });
  
  // Check if year matches
  const wrongYear = songsInAlbum.filter(s => s.info.includes(albumName) && !s.info.includes(String(data.year)));
  
  if (missing.length > 0 || wrongYear.length > 0) {
    console.log(`❌ ${albumName} (${data.year})`);
    if (missing.length) console.log(`  Missing tracks: ${missing.join(', ')}`);
    if (wrongYear.length) console.log(`  Wrong year: ${wrongYear.map(s => s.title).join(', ')}`);
    totalIssues++;
  } else {
    console.log(`✅ ${albumName} (${data.year}) - ${songsInAlbum.length} tracks verified`);
  }
});

console.log(`\n=== Summary ===`);
console.log(`Albums checked: ${Object.keys(albums).length}`);
console.log(`Issues: ${totalIssues}`);

// Check La prière 12-month series
console.log('\n=== La prière 12ヶ月連続リリース Verification ===');
const months = [
  { month: '2021年4月', title: 'Flyby Anomaly' },
  { month: '2021年5月', title: 'Dead Scream' },
  { month: '2021年6月', title: 'GHOST' },
  { month: '2021年7月', title: 'Instant Love' },
  { month: '2021年8月', title: '來人具惨' },
  { month: '2021年9月', title: '点心爛漫' },
  { month: '2021年10月', title: '禁断の愛と魔剣' },
  { month: '2021年11月', title: 'アルビレオ' },
  { month: '2021年12月', title: 'Time Lapse Lights' },
  { month: '2022年1月', title: '無法地点' },
  { month: '2022年2月', title: '純情アンビバレンス' },
  { month: '2022年3月', title: 'Chronologue' },
];

months.forEach(m => {
  const song = SONGS.find(s => s.title.includes(m.title));
  if (song && song.info.includes(m.month)) {
    console.log(`✅ ${m.month}: ${song.title}`);
  } else if (song) {
    console.log(`❌ ${m.month}: ${song.title} → info="${song.info}"`);
    totalIssues++;
  } else {
    console.log(`⚠️ ${m.month}: ${m.title} not found in songs`);
  }
});

console.log(`\nTotal issues: ${totalIssues}`);
