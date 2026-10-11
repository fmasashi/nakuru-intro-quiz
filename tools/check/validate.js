const fs = require('fs');
const P = require('../_paths');
const html = fs.readFileSync(P.HTML, 'utf8');
const jsCode = fs.readFileSync(P.APP, 'utf8');

// IDs referenced in JS via getElementById
const jsIds = [...jsCode.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]);
// IDs in HTML
const htmlIds = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);

const missing = jsIds.filter(id => !htmlIds.includes(id));
if (missing.length) {
  console.log('JS refs missing in HTML:', missing);
} else {
  console.log('All JS ID references found in HTML');
}

// Check songs
const vm = require('vm');
const songsCode = fs.readFileSync(P.SONGS, 'utf8');
vm.runInThisContext(songsCode);
console.log('Total songs:', SONGS.length);
const noCat = SONGS.filter(s => !s.category);
if (noCat.length) console.log('Missing category:', noCat.map(s => s.title));
console.log('Test passed!');
