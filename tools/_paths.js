// Shared file locations for the intro-quiz dev tools.
// Everything resolves from this file's position, so any script can be run from any directory.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');   // イントロクイズ/ (game root)
const DATA = path.join(__dirname, 'data'); // intermediate JSON
const SONGS_FILE = path.join(ROOT, 'songs.js');

// Single source of truth for the songs.js file format: header line, then one JSON object per line.
const SONGS_HEADER = '// Song database for Nakuru Intro Quiz - with discography info, start times & volume normalization\n';
function writeSongs(songs) {
  let out = SONGS_HEADER + 'const SONGS = [\n';
  songs.forEach((s, i) => { out += '  ' + JSON.stringify(s) + (i < songs.length - 1 ? ',' : '') + '\n'; });
  out += '];\n';
  fs.writeFileSync(SONGS_FILE, out, 'utf-8');
}

module.exports = {
  ROOT,
  SONGS: SONGS_FILE,
  HTML: path.join(ROOT, 'index.html'),
  APP: path.join(ROOT, 'app.js'),
  DATA,
  data: (name) => path.join(DATA, name),
  writeSongs,
};
