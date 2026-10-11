// Test with 3 songs first
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, 'tmp_audio');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const testIds = [
  { id: 'Nymzuz3u7RE', title: 'Cadeau de Dieu' },
  { id: 'y_y154nynLQ', title: 'ガラスアゲハ' },
  { id: 'ZgH3RN-dg5A', title: 'Defective' },
];

testIds.forEach((song, i) => {
  console.log(`\n[${i+1}/3] Testing: ${song.title} (${song.id})`);
  const audioFile = path.join(tmpDir, `${song.id}`);
  
  // Download first 15 seconds
  try {
    console.log('  Downloading...');
    execSync(
      `yt-dlp -f "bestaudio" --download-sections "*0-15" -o "${audioFile}.%(ext)s" --no-playlist --quiet "https://www.youtube.com/watch?v=${song.id}"`,
      { timeout: 30000, stdio: 'pipe' }
    );
  } catch(e) {
    console.log('  Download failed, trying alt method...');
    try {
      execSync(
        `yt-dlp -x --audio-format wav -o "${audioFile}.%(ext)s" --no-playlist --quiet "https://www.youtube.com/watch?v=${song.id}"`,
        { timeout: 30000, stdio: 'pipe' }
      );
    } catch(e2) {
      console.log('  FAILED:', e2.message.substring(0, 100));
      return;
    }
  }
  
  // Find downloaded file
  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(song.id));
  if (!files.length) { console.log('  No file found'); return; }
  const actual = path.join(tmpDir, files[0]);
  console.log('  File:', files[0]);
  
  // Detect silence
  try {
    console.log('  Analyzing...');
    const output = execSync(
      `ffmpeg -i "${actual}" -af silencedetect=noise=-35dB:d=0.3 -f null - 2>&1`,
      { timeout: 15000, encoding: 'utf-8' }
    );
    
    const silenceEnds = [...output.matchAll(/silence_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    const silenceStarts = [...output.matchAll(/silence_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
    
    if (silenceEnds.length > 0 && silenceEnds[0] > 0.1) {
      console.log(`  ⏩ Music starts at: ${Math.round(silenceEnds[0] * 10) / 10}s`);
    } else {
      console.log(`  ▶ Music starts at: 0s (no leading silence)`);
    }
    console.log(`  Silence ends: [${silenceEnds.join(', ')}]`);
    console.log(`  Silence starts: [${silenceStarts.join(', ')}]`);
  } catch(e) {
    console.log('  FFmpeg analysis failed');
  }
  
  // Cleanup
  files.forEach(f => { try { fs.unlinkSync(path.join(tmpDir, f)); } catch(e) {} });
});

try { fs.rmdirSync(tmpDir); } catch(e) {}
