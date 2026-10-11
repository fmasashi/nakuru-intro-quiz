// Shared file locations for the intro-quiz dev tools.
// Everything resolves from this file's position, so any script can be run from any directory.
const path = require('path');
const ROOT = path.join(__dirname, '..');   // イントロクイズ/ (game root)
const DATA = path.join(__dirname, 'data'); // intermediate JSON
module.exports = {
  ROOT,
  SONGS: path.join(ROOT, 'songs.js'),
  HTML: path.join(ROOT, 'index.html'),
  APP: path.join(ROOT, 'app.js'),
  DATA,
  data: (name) => path.join(DATA, name),
};
