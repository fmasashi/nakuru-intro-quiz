const fs = require('fs');
const vm = require('vm');
vm.runInThisContext(fs.readFileSync('songs.js', 'utf-8'));

const fixes = {
  'Cb5v-I5BLFo': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: m@sumi' },
  '3KZOQJ_1xgw': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: 高城みよ' },
  'Xjfm-ylgq9E': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: Feryquitous' },
  'cSueFHyhyVE': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 佐高陵平' },
  '74hLJEHF-AE': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 板倉孝徳' },
  'XZPDODSgdoo': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 櫻澤ヒカル' },
  'oNBXsTA7qXc': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: Feryquitous' },
  'FPL1Z_w7k4g': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: グシミヤギヒデユキ (Hifumi,inc.)' },
  '48mx0ODWwEY': { info: 'La prière デジタルシングル (2026) / 作曲: satella / 作詞: Feryquitous / 3ヶ月連続リリース第2弾' },
  'efNl6gpXyJY': { info: 'いつきんくる シングル (2025) / 作曲: picco, Reno / 作詞: purini, Mi7s3' },
  'qDhwSD0cQUE': { info: 'カバー / 原曲: Akki (幽谷きらら名義) / クトゥルフ神話TRPGシナリオ関連曲 / もこ田めめめとの「歌ってみた」' },
  '7v81QOVx4WE': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: kaztora（森羅万象）' },
  'Q0iw9_rvqeo': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: Feryquitous' },
  'QJOXcl_TpXU': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: wotaku' },
  'eIoxs9in7VI': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: sky_delta' },
  'z5Z2lXGXXMA': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: 高城みよ' },
  '8Zh9zsbuhBM': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: sky_delta / サークル名「クラリムステラ」を冠した書き下ろし新曲' },
  'E0SEBm6dUSE': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: 一二三 / ファンミ「ご注文はえいえんに！〜深海喫茶なく茶屋へようこそ〜」テーマソング' },
  '3RuCaE5ciNU': { info: 'Endorfin. EP「Horizon Dream」収録 (2025) / 作曲: sky_delta / 活動10周年記念 & 1stワンマンライブテーマ曲' },
};

let count = 0;
SONGS.forEach(s => {
  const f = fixes[s.id];
  if (f) { s.info = f.info; count++; console.log(`✅ ${s.title} → ${f.info}`); }
});

// Also find 追想のラグナロク (might have different exact title)
SONGS.forEach(s => {
  if (s.title.includes('追想') || s.title.includes('ラグナロク')) {
    s.info = 'いつきんくる 1stコラボシングル (2023) / 作曲: 佐高陵平 (Hifumi,inc.) / 作詞: 藍月なくる, 棗いつき';
    count++;
    console.log(`✅ ${s.title} (${s.id}) → ${s.info}`);
  }
});

let out = '// Song database for Nakuru Intro Quiz - with discography info, start times & volume normalization\nconst SONGS = [\n';
SONGS.forEach((s, i) => { out += '  ' + JSON.stringify(s) + (i < SONGS.length - 1 ? ',' : '') + '\n'; });
out += '];\n';
fs.writeFileSync('songs.js', out, 'utf-8');
console.log(`\nFixed: ${count} songs`);
