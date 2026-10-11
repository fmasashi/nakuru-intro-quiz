// ブラウザのコンソールでこのスクリプトを実行してください
// 1. YouTubeのプレイリストページを開く: https://www.youtube.com/playlist?list=PLR-TVlABNl3M
// 2. 一番下までスクロールして全曲を表示させる
// 3. F12でDevToolsを開き、Consoleタブに以下を貼り付けてEnter

const videos = document.querySelectorAll('a#video-title');
const ids = [];
videos.forEach(v => {
  const href = v.getAttribute('href');
  const match = href && href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (match) ids.push(match[1]);
});
console.log(`Found ${ids.length} videos`);
console.log(JSON.stringify(ids));
// ↑ この出力をコピーしてください
