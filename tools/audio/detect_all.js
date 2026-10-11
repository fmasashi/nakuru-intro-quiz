// Full batch: detect music start time for all 162 songs
const { execSync } = require('child_process');
const P = require('../_paths');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));

const tmpDir = path.join(__dirname, 'tmp_audio');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// Load existing results if resuming
const resultsFile = P.data('start_times.json');
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf-8')) : {};
const errors = [];

function detectStart(videoId) {
  // Skip if already processed
  if (results[videoId] !== undefined) return results[videoId];

  const audioFile = path.join(tmpDir, videoId);

  try {
    execSync(
      `yt-dlp -f "bestaudio" --download-sections "*0-15" -o "${audioFile}.%(ext)s" --no-playlist --quiet "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
  } catch (e) {
    errors.push({ id: videoId, error: 'download' });
    return 0;
  }

  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(videoId));
  if (!files.length) { errors.push({ id: videoId, error: 'no_file' }); return 0; }
  const actual = path.join(tmpDir, files[0]);

  try {
    const output = execSync(
      `ffmpeg -i "${actual}" -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1`,
      { timeout: 15000, encoding: 'utf-8' }
    );

    const matches = [...output.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));

    // Only count leading silence (first silence_end that's > 0.1s)
    if (matches.length > 0 && matches[0] > 0.1) {
      return Math.round(matches[0] * 10) / 10;
    }
    return 0;
  } catch (e) {
    errors.push({ id: videoId, error: 'ffmpeg' });
    return 0;
  } finally {
    files.forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch (e) {} });
  }
}

console.log(`Processing ${SONGS.length} songs...\n`);

for (let i = 0; i < SONGS.length; i++) {
  const song = SONGS[i];
  if (results[song.id] !== undefined) {
    const v = results[song.id];
    console.log(`[${i + 1}/${SONGS.length}] SKIP ${v > 0 ? v + 's' : '0s'} - ${song.title}`);
    continue;
  }

  const start = detectStart(song.id);
  results[song.id] = start;

  const status = start > 0 ? `⏩ ${start}s` : '▶ 0s';
  console.log(`[${i + 1}/${SONGS.length}] ${status} - ${song.title}`);

  // Save progress every 10 songs
  if ((i + 1) % 10 === 0) {
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');
  }
}

// Final save
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');

// Stats
const nonZero = Object.entries(results).filter(([k, v]) => v > 0);
console.log(`\n=== Complete ===`);
console.log(`Total: ${SONGS.length}`);
console.log(`With intro silence (>0s): ${nonZero.length}`);
console.log(`Starting at 0s: ${SONGS.length - nonZero.length}`);
if (errors.length) {
  console.log(`Errors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.id}: ${e.error}`));
}

// Cleanup
try { fs.rmdirSync(tmpDir); } catch (e) {}
