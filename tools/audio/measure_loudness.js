// Measure loudness of all songs and calculate normalization factors
const { execSync } = require('child_process');
const P = require('../_paths');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));

const tmpDir = path.join(__dirname, 'tmp_audio');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const resultsFile = P.data('loudness.json');
const results = fs.existsSync(resultsFile) ? JSON.parse(fs.readFileSync(resultsFile, 'utf-8')) : {};
const errors = [];

function measureLoudness(videoId) {
  if (results[videoId] !== undefined) return results[videoId];

  const audioFile = path.join(tmpDir, videoId);

  try {
    execSync(
      `yt-dlp -f "bestaudio" --download-sections "*0-30" -o "${audioFile}.%(ext)s" --no-playlist --quiet "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
  } catch (e) {
    errors.push({ id: videoId, error: 'download' });
    return null;
  }

  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(videoId));
  if (!files.length) { errors.push({ id: videoId, error: 'no_file' }); return null; }
  const actual = path.join(tmpDir, files[0]);

  try {
    const output = execSync(
      `ffmpeg -i "${actual}" -af volumedetect -f null - 2>&1`,
      { timeout: 15000, encoding: 'utf-8' }
    );

    const meanMatch = output.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    const maxMatch = output.match(/max_volume:\s*([-\d.]+)\s*dB/);

    if (meanMatch) {
      return {
        mean: parseFloat(meanMatch[1]),
        max: maxMatch ? parseFloat(maxMatch[1]) : 0
      };
    }
    return null;
  } catch (e) {
    errors.push({ id: videoId, error: 'ffmpeg' });
    return null;
  } finally {
    files.forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch (e) {} });
  }
}

console.log(`Measuring loudness for ${SONGS.length} songs...\n`);

for (let i = 0; i < SONGS.length; i++) {
  const song = SONGS[i];
  if (results[song.id] !== undefined) {
    console.log(`[${i + 1}/${SONGS.length}] SKIP - ${song.title}`);
    continue;
  }

  const loudness = measureLoudness(song.id);
  results[song.id] = loudness;

  if (loudness) {
    console.log(`[${i + 1}/${SONGS.length}] ${loudness.mean}dB - ${song.title}`);
  } else {
    console.log(`[${i + 1}/${SONGS.length}] ERROR - ${song.title}`);
  }

  if ((i + 1) % 10 === 0) {
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');
  }
}

fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2), 'utf-8');

// Calculate normalization
const validMeans = Object.values(results).filter(v => v && v.mean).map(v => v.mean);
const avgMean = validMeans.reduce((a, b) => a + b, 0) / validMeans.length;

console.log(`\n=== Loudness Analysis ===`);
console.log(`Average mean volume: ${avgMean.toFixed(1)} dB`);
console.log(`Range: ${Math.min(...validMeans).toFixed(1)} to ${Math.max(...validMeans).toFixed(1)} dB`);

// Show outliers
const sorted = SONGS.filter(s => results[s.id] && results[s.id].mean)
  .map(s => ({ title: s.title, mean: results[s.id].mean, diff: results[s.id].mean - avgMean }))
  .sort((a, b) => a.mean - b.mean);

console.log(`\n🔇 Quietest songs:`);
sorted.slice(0, 10).forEach(s => console.log(`  ${s.mean.toFixed(1)}dB (${s.diff > 0 ? '+' : ''}${s.diff.toFixed(1)}) - ${s.title}`));

console.log(`\n🔊 Loudest songs:`);
sorted.slice(-10).forEach(s => console.log(`  ${s.mean.toFixed(1)}dB (${s.diff > 0 ? '+' : ''}${s.diff.toFixed(1)}) - ${s.title}`));

if (errors.length) {
  console.log(`\nErrors: ${errors.length}`);
  errors.forEach(e => console.log(`  ${e.id}: ${e.error}`));
}

try { fs.rmdirSync(tmpDir); } catch (e) {}
