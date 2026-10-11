// Auto-detect music start time for all songs using yt-dlp + ffmpeg silencedetect
const { execSync } = require('child_process');
const P = require('../_paths');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

vm.runInThisContext(fs.readFileSync(P.SONGS, 'utf-8'));

const tmpDir = path.join(__dirname, 'tmp_audio');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const results = {};
const errors = [];

function detectStart(videoId, index) {
  const audioFile = path.join(tmpDir, `${videoId}.wav`);
  
  try {
    // Download first 15 seconds of audio only
    execSync(
      `yt-dlp -x --audio-format wav --postprocessor-args "-t 15" -o "${audioFile}" --no-playlist --quiet "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
  } catch (e) {
    // Try alternative approach
    try {
      execSync(
        `yt-dlp -f "bestaudio" --download-sections "*0-15" -o "${audioFile}" --no-playlist --quiet "https://www.youtube.com/watch?v=${videoId}"`,
        { timeout: 30000, stdio: 'pipe' }
      );
    } catch (e2) {
      errors.push({ id: videoId, error: 'download_failed' });
      return 0;
    }
  }

  // Find the actual downloaded file (yt-dlp may add extension)
  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(videoId));
  if (files.length === 0) {
    errors.push({ id: videoId, error: 'no_file' });
    return 0;
  }
  const actualFile = path.join(tmpDir, files[0]);

  try {
    // Use ffmpeg silencedetect to find when silence ends
    // noise=-35dB: threshold for "silence"
    // d=0.3: minimum silence duration of 0.3s
    const output = execSync(
      `ffmpeg -i "${actualFile}" -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1`,
      { timeout: 15000, encoding: 'utf-8', stdio: 'pipe' }
    );

    // Parse silence_end from output
    const matches = output.match(/silence_end:\s*([\d.]+)/g);
    if (matches && matches.length > 0) {
      // First silence_end = when music starts
      const firstEnd = parseFloat(matches[0].replace('silence_end: ', ''));
      // Round to 1 decimal
      return Math.round(firstEnd * 10) / 10;
    }
    
    // No silence detected = music starts at 0
    return 0;
  } catch (e) {
    errors.push({ id: videoId, error: 'ffmpeg_failed' });
    return 0;
  } finally {
    // Cleanup
    files.forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch(e) {} });
  }
}

async function main() {
  console.log(`Processing ${SONGS.length} songs...\n`);
  
  for (let i = 0; i < SONGS.length; i++) {
    const song = SONGS[i];
    const start = detectStart(song.id, i);
    results[song.id] = start;
    
    const status = start > 0 ? `⏩ ${start}s` : '▶ 0s';
    console.log(`[${i + 1}/${SONGS.length}] ${status} - ${song.title}`);
  }

  // Save results
  fs.writeFileSync(
    P.data('start_times.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  // Stats
  const nonZero = Object.values(results).filter(v => v > 0);
  console.log(`\n=== Results ===`);
  console.log(`Total: ${SONGS.length}`);
  console.log(`Songs with intro silence: ${nonZero.length}`);
  console.log(`Songs starting at 0: ${SONGS.length - nonZero.length}`);
  if (nonZero.length) {
    console.log(`Start times: ${nonZero.map(v => v + 's').join(', ')}`);
  }
  if (errors.length) {
    console.log(`\nErrors (${errors.length}):`);
    errors.forEach(e => console.log(`  ${e.id}: ${e.error}`));
  }

  // Cleanup tmp dir
  try { fs.rmdirSync(tmpDir); } catch(e) {}
}

main();
