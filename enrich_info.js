// Update info fields for 41 songs with enriched descriptions + fix titles
const fs = require('fs');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync('songs.js', 'utf-8'));

const updates = {
  // Transpain
  'TJVPcRcW3Z8': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: m@sumi' }, // Drop Role
  'vSPgbN_QoYM': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: 高城みよ' }, // mirror - check ID
  'cDfUxfV514g': { info: '6thアルバム「Transpain」収録 (2021) / 作曲: Feryquitous' }, // Evil Bubble - check ID

  // Counterfeit
  'ZgH3RN-dg5A': { info: '7thアルバム「Counterfeit」収録 (2022) / 作曲: Tansa' }, // Defective
  '7XeWXV_9mOY': { info: '7thアルバム「Counterfeit」収録 (2022) / 作曲: Akki' }, // FAKE IDOL
  'T3lI7lh_3UA': { info: '7thアルバム「Counterfeit」収録 (2022) / 作曲: Feryquitous' }, // Dirt
  'sadX5FgzxyY': { info: '7thアルバム「Counterfeit」収録 (2022) / 作曲: samayuzame' }, // 唾と蜜
  'PeZzdoP-gKk': { info: '7thアルバム「Counterfeit」収録 (2022) / 作曲: K\'s' }, // Bad Drip

  // Indigrotto
  '63gXH5Rylf4': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 佐高陵平' }, // Killer neuron
  '7-i1DQVm5Ew': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 板倉孝徳' }, // Settlement
  'OuJRu0g61QM': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: 櫻澤ヒカル' }, // 夢の呼応
  'vO5DYcS72Xk': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: Feryquitous' }, // Codependence
  'j45s9xvJ4Mk': { info: 'アルバム「Indigrotto」収録 (2022) / 作曲: グシミヤギヒデユキ (Hifumi,inc.)' }, // Rest in Peace my Dear
  '4P1OdtYncNY': { info: 'アルバム「Indigrotto」タイトル曲 (2022) / 作曲: 北川勝利' }, // Indigrotto

  // ミシュメリア
  'E8eVpmmdMeY': { info: 'アルバム「ミシュメリア」収録 (2023) / 作曲: mami' }, // Fragile Utopia
  'KF0kZrffZBo': { info: 'アルバム「ミシュメリア」収録 (2023) / 作曲: 高城みよ' }, // Lucid Hallucination
  'DowXn2fHDWU': { info: 'アルバム「ミシュメリア」収録 (2023) / 作曲: かめりあ (Camellia)' }, // Tuliparfeit
  '1iYy09QIJqw': { info: 'アルバム「ミシュメリア」タイトル曲 (2023) / 作曲: bermei.inazawa' }, // ミシュメリア
  'wHThc6MPuPc': { info: 'アルバム「ミシュメリア」収録 (2023) / 作曲: グシミヤギヒデユキ' }, // オッドアイ・リリィ

  // わたしとキミの幸せな終末
  'PLkBTrdQiC0': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: kaztora（森羅万象）' }, // ヘイマルメネー
  'QxXC8g9K0-Q': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: 西憂花' }, // ミスリルドロップ
  'RPaZQQFwBzw': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: Feryquitous' }, // 軌跡
  'fAKfq6Ij-PU': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: wotaku' }, // Predatory
  'hI_CCMKiUII': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: sky_delta' }, // アンチテール
  'wuIUyGQb6qQ': { info: 'ストーリーアルバム「わたしとキミの幸せな終末」収録 (2025) / 作曲: 高城みよ' }, // Seed of Fate

  // 真相 (ベストアルバム)
  '3osyYQQXCx0': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: sky_delta / サークル名でもある「クラリムステラ」を冠した書き下ろし新曲' }, // クラリムステラ
  'Yq-ZqMh6vXQ': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: 一二三 / ファンミーティング「ご注文はえいえんに！〜深海喫茶なく茶屋へようこそ〜」テーマソング' }, // ご注文はえいえんに
  'KYtXc1vXnAo': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: グシミヤギヒデユキ / 書き下ろし新曲' }, // エモーション・キャプチャー
  'eRlzyMmdzXY': { info: 'ベストアルバム「真相」収録 (2025) / 原曲: Feryquitous / 2025アレンジ: にお / 原曲はコラボアルバム「soleil de minuit」(2017)初収録' }, // 乖離光
  'C7dRhYYNDIs': { info: 'ベストアルバム「真相」表題曲 (2025) / 作曲: にお / ワンマンライブで初披露' }, // 真相
  '1peOuXyMAIA': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: 日高勇輝 (Elements Garden) / 作詞: 織田あすか / 2ndライブ「鏡像崇拝」メインテーマ曲' }, // Mirroring Mirage
  'Ki-ah4cTK9Q': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: Giga & TeddyLoid / 作詞: 児玉雨子 / 書き下ろし新曲' }, // Bubble Bubble Boy
  'XHIKQGMBkJc': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: にお / 書き下ろし新曲' }, // 永劫不可逆

  // その他
  'bEuwswhL8Rk': { info: '初の全国流通ソロシングル (2024) / 作曲: Haniwa（アメリカ民謡研究会）' }, // 何も知らないまま。
  '-F3NV1ls41c': { info: 'ベストアルバム「真相」収録 (2025) / 作曲: 佐高陵平 / ゲーム「魔法少女ノ魔女裁判」挿入歌' }, // 愛の残滓
  'O9XuzOv6Y3A': { info: 'カバー / 原曲: Akki (幽谷きらら名義) / クトゥルフ神話TRPGシナリオ関連曲 / もこ田めめめとの「歌ってみた」', category: 'solo' }, // パラサイトブルー
  'SMpdghcsays': { info: 'いつきんくる シングル (2025) / 作曲: picco, Reno / 作詞: purini, Mi7s3' }, // snowloop*
  'UtOS1jb4tfg': { info: 'いつきんくる 1stコラボシングル (2023) / 作曲: 佐高陵平 (Hifumi,inc.) / 作詞: 藍月なくる, 棗いつき' }, // 追想のラグナロク
  'Ol1N6shDJ94': { info: 'La prière デジタルシングル (2026) / 作曲: satella / 作詞: Feryquitous / 3ヶ月連続リリース第2弾' }, // Ritus Inanis
  'OV238oKZj5U': { info: 'Endorfin. EP「Horizon Dream」収録 (2025) / 作曲: sky_delta / 活動10周年記念楽曲 / 1stワンマンライブテーマ曲' }, // Horizon Dream
  'SCu2-Dg03FI': { info: 'La prière デジタルシングル (2026) / 作曲: 夏山よつぎ', title: 'バッドビートベイビー' }, // バッドビートベイビー
  'k29Dog51qwE': { info: 'La prière 2ndアルバム「Galaxy Triangle」収録 (2020) / 作曲: lapix', title: 'Galactic Love' }, // Galactic Love
};

let updated = 0;
let titleFixed = 0;
SONGS.forEach(s => {
  const u = updates[s.id];
  if (u) {
    if (u.info) { s.info = u.info; updated++; }
    if (u.title) { console.log(`TITLE FIX: "${s.title}" → "${u.title}"`); s.title = u.title; titleFixed++; }
    if (u.category) s.category = u.category;
  }
});

let out = '// Song database for Nakuru Intro Quiz - with discography info, start times & volume normalization\nconst SONGS = [\n';
SONGS.forEach((s, i) => {
  out += '  ' + JSON.stringify(s) + (i < SONGS.length - 1 ? ',' : '') + '\n';
});
out += '];\n';
fs.writeFileSync('songs.js', out, 'utf-8');

console.log(`Updated info: ${updated} songs`);
console.log(`Fixed titles: ${titleFixed} songs`);
console.log(`Total: ${SONGS.length} songs`);
