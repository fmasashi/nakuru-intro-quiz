// Simulate the quiz flow to verify it completes correctly
// Run with: node test_flow.js

// Load songs data
const vm = require('vm');
const P = require('../_paths');
const songsCode = require('fs').readFileSync(P.SONGS, 'utf-8');
vm.runInThisContext(songsCode);

console.log(`Total songs: ${SONGS.length}`);

// Check for duplicate IDs
const idSet = new Set();
const dupIds = [];
SONGS.forEach(s => {
  if (idSet.has(s.id)) dupIds.push(s.id);
  idSet.add(s.id);
});
console.log(`Duplicate IDs: ${dupIds.length === 0 ? 'None ✅' : dupIds.join(', ') + ' ❌'}`);

// Check for duplicate titles (exact match)
const titleSet = new Set();
const dupTitles = [];
SONGS.forEach(s => {
  if (titleSet.has(s.title)) dupTitles.push(s.title);
  titleSet.add(s.title);
});
console.log(`Duplicate titles: ${dupTitles.length === 0 ? 'None ✅' : dupTitles.join(', ') + ' ⚠️'}`);

// Simulate game flow
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const usedIds = new Set();
let questionNum = 0;
let errors = [];

while (true) {
  questionNum++;
  const available = SONGS.filter(s => !usedIds.has(s.id));

  if (available.length === 0) {
    console.log(`\nAll songs exhausted after ${questionNum - 1} questions ✅`);
    break;
  }

  const currentSong = pickRandom(available);
  usedIds.add(currentSong.id);

  // Generate wrong choices
  const wrongPool = SONGS.filter(s =>
    s.id !== currentSong.id && s.title !== currentSong.title
  );

  if (wrongPool.length < 3) {
    errors.push(`Q${questionNum}: Not enough wrong choices for "${currentSong.title}" (only ${wrongPool.length} available)`);
  }

  const wrongChoices = shuffle(wrongPool).slice(0, 3);
  const choices = shuffle([currentSong, ...wrongChoices]);

  // Verify correct answer is in choices
  const correctInChoices = choices.some(c => c.id === currentSong.id);
  if (!correctInChoices) {
    errors.push(`Q${questionNum}: Correct answer "${currentSong.title}" NOT in choices! ❌`);
  }

  // Verify no duplicate titles in choices
  const choiceTitles = choices.map(c => c.title);
  const uniqueTitles = new Set(choiceTitles);
  if (uniqueTitles.size !== choiceTitles.length) {
    errors.push(`Q${questionNum}: Duplicate title in choices: ${choiceTitles.join(', ')} ⚠️`);
  }
}

// Final result calculation test
const correctCount = 50; // simulate
const totalAnswered = questionNum - 1;
const ratio = correctCount / Math.max(totalAnswered, 1);
console.log(`\nFinal result test: ${correctCount}/${totalAnswered} = ${(ratio * 100).toFixed(1)}%`);

if (errors.length > 0) {
  console.log(`\n❌ ERRORS FOUND:`);
  errors.forEach(e => console.log(`  ${e}`));
} else {
  console.log(`\n✅ All ${totalAnswered} questions can be generated without issues`);
}

// Check if questionNum - 1 matches SONGS.length
if (totalAnswered === SONGS.length) {
  console.log(`✅ Total questions (${totalAnswered}) matches song count (${SONGS.length})`);
} else {
  console.log(`❌ Mismatch: questions=${totalAnswered}, songs=${SONGS.length}`);
}
