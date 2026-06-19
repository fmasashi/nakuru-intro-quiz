/**
 * Aitsuki Nakuru Intro Quiz - Main Application Logic
 * Full-featured version with time attack, categories, tracking, SE, keyboard, etc.
 */

// ===== Sound Effects (Web Audio API) =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSE(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.15, now);

  if (type === 'correct') {
    // Ascending two-tone
    [523, 659].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      osc.connect(gain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.12);
    });
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  } else if (type === 'wrong') {
    // Low buzz
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  } else if (type === 'streak') {
    // Fanfare arpeggio
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      osc.connect(gain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  } else if (type === 'finish') {
    // Completion chord
    [523, 659, 784].forEach(freq => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.5);
    });
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  }
}

// ===== State =====
const state = {
  introDuration: 3,
  score: 0,
  questionNum: 0,
  streak: 0,
  maxStreak: 0,
  correctCount: 0,
  currentSong: null,
  choices: [],
  answered: false,
  hasPlayed: false,
  usedSongIds: new Set(),
  playerReady: false,
  isPlaying: false,
  stopTimer: null,
  timerInterval: null,
  replayTimer: null,
  volume: 40,
  totalQuestions: 10,       // 0 = all
  choiceCount: 4,
  gameMode: 'normal',       // normal, timeattack, weakonly
  categoryFilter: new Set(['solo', 'endorfin', 'la_priere', 'itsukinkuru', 'collab']),
  answerHistory: [],         // [{song, correct, timeMs}]
  quizStartTime: 0,
  questionStartTime: 0,
  filteredSongs: [],
  bgmReady: false,
  preBuffered: false,
  introTimerStarted: false,
};

// ===== YouTube IFrame API =====
let player = null;
let bgmPlayer = null;
const BGM_VOLUME = 8;
const BGM_SONGS = [
  'cDfUxfV514g', // Spring for you
  'vSPgbN_QoYM', // Raindrop Caffé Latte
  'Vz10PdNRto0', // コトノハ
  'aPtVQ2Hdczg', // Spica
  'U5YMCw0kD2E', // 春風ファンタジア
  '_Xe70bzLPh4', // 純情ティータイム
  'sLHBK8pf90o', // 絵空
];

function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player('youtube-player', {
    height: '100%', width: '100%',
    playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, showinfo: 0, iv_load_policy: 3 },
    events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange, onError: onPlayerError },
  });
  // BGM player
  bgmPlayer = new YT.Player('bgm-player', {
    height: '1', width: '1',
    playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0, autoplay: 0, iv_load_policy: 3 },
    events: {
      onReady: function() {
        bgmPlayer.setVolume(BGM_VOLUME);
        state.bgmReady = true;
      },
      onStateChange: function(e) {
        if (e.data === YT.PlayerState.ENDED) {
          bgmPlayer.loadVideoById({ videoId: BGM_SONGS[Math.floor(Math.random() * BGM_SONGS.length)], startSeconds: 30 });
        }
        if (e.data === YT.PlayerState.PLAYING) {
          bgmPlayer.setVolume(BGM_VOLUME);
          // Show BGM song name
          try {
            const url = bgmPlayer.getVideoUrl();
            const m = url && url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            if (m) {
              const song = SONGS.find(s => s.id === m[1]);
              const nameEl = document.getElementById('bgm-song-name');
              const container = document.getElementById('bgm-now-playing');
              if (nameEl) nameEl.textContent = song ? song.title : 'BGM';
              if (container) container.classList.remove('hidden');
            }
          } catch(e) {}
        }
        if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
          const container = document.getElementById('bgm-now-playing');
          if (container) container.classList.add('hidden');
        }
      },
      onError: function() {
        bgmPlayer.loadVideoById({ videoId: BGM_SONGS[Math.floor(Math.random() * BGM_SONGS.length)], startSeconds: 30 });
      }
    },
  });
};

// Volume normalization: adjusts per-song volume based on measured loudness
function getNormalizedVolume() {
  const vol = state.currentSong ? state.volume * (state.currentSong.vol || 1) : state.volume;
  return Math.min(100, Math.max(0, Math.round(vol)));
}

function onPlayerReady() {
  state.playerReady = true;
  player.setVolume(state.volume);
}

function onPlayerStateChange(event) {
  // Pre-buffer: pause as soon as video starts playing (while muted)
  if (event.data === YT.PlayerState.PLAYING && !state.preBuffered && !state.isPlaying) {
    state.preBuffered = true;
    player.pauseVideo();
    player.seekTo(state.currentSong.start || 0, true);
    dom.btnPlay.disabled = false;
    return;
  }
  // Actual playback started by user
  if (event.data === YT.PlayerState.PLAYING && state.isPlaying && !state.answered) {
    player.setVolume(getNormalizedVolume());
    if (!state.introTimerStarted) {
      state.introTimerStarted = true;
      startIntroTimer();
    }
  }
}

function onPlayerError(event) {
  console.warn('YouTube player error:', event.data);
  if (!state.answered) {
    state.hasPlayed = true;
    state.answered = true;
    dom.choiceBtns.forEach(btn => btn.disabled = true);
    dom.btnPlay.disabled = true;
    showResult(false, 'この動画は再生できませんでした');
    // Auto-skip after 2 seconds
    setTimeout(() => {
      if (state.answered) {
        loadQuestion();
      }
    }, 2000);
  }
}

// ===== DOM References =====
const dom = {
  btnStart: document.getElementById('btn-start'),
  totalSongs: document.getElementById('total-songs'),
  filteredCount: document.getElementById('filtered-count'),
  diffBtns: document.querySelectorAll('.diff-btn'),
  score: document.getElementById('score'),
  currentQ: document.getElementById('current-q'),
  totalQ: document.getElementById('total-q'),
  streak: document.getElementById('streak'),
  playOverlay: document.getElementById('play-overlay'),
  btnPlay: document.getElementById('btn-play'),
  timerFill: document.getElementById('timer-fill'),
  choicesArea: document.getElementById('choices-area'),
  choiceBtns: [],  // dynamically populated
  resultArea: document.getElementById('result-area'),
  resultIcon: document.getElementById('result-icon'),
  resultText: document.getElementById('result-text'),
  resultSong: document.getElementById('result-song'),
  resultThumbnail: document.getElementById('result-thumbnail'),
  resultInfo: document.getElementById('result-info'),
  resultLyrics: document.getElementById('result-lyrics'),
  resultYoutubeLink: document.getElementById('result-youtube-link'),
  btnReplay: document.getElementById('btn-replay'),
  btnFullListen: document.getElementById('btn-full-listen'),
  btnNext: document.getElementById('btn-next'),
  finalScore: document.getElementById('final-score'),
  finalCorrect: document.getElementById('final-correct'),
  finalStreak: document.getElementById('final-streak'),
  finalTime: document.getElementById('final-time'),
  rankValue: document.getElementById('rank-value'),
  newHighscore: document.getElementById('new-highscore'),
  btnRestart: document.getElementById('btn-restart'),
  btnBackTitle: document.getElementById('btn-back-title'),
  btnShowReview: document.getElementById('btn-show-review'),
  btnReviewBack: document.getElementById('btn-review-back'),
  reviewList: document.getElementById('review-list'),
  volumeSlider: document.getElementById('volume-slider'),
  volumeValue: document.getElementById('volume-value'),
  volumeIcon: document.getElementById('volume-icon'),
  inlineDiffBtns: document.querySelectorAll('.inline-diff-btn'),
  progressFill: document.getElementById('progress-fill'),
  btnQuit: document.getElementById('btn-quit'),
  taTimer: document.getElementById('ta-timer'),
  taValue: document.getElementById('ta-value'),
  hsDisplay: document.getElementById('highscore-display'),
  hsScore: document.getElementById('hs-score'),
  hsTime: document.getElementById('hs-time'),
  gameModeOptions: document.querySelectorAll('#game-mode-options .chip'),
  countOptions: document.querySelectorAll('#count-options .chip'),
  choiceCountOptions: document.querySelectorAll('#choice-count-options .chip'),
  categoryOptions: document.querySelectorAll('#category-options .chip'),
  keyboardHint: document.getElementById('keyboard-hint'),
};

// ===== Initialization =====
function init() {
  dom.totalSongs.textContent = SONGS.length;
  updateFilteredCount();
  loadYouTubeAPI();
  bindEvents();
  generateChoiceButtons(state.choiceCount);
  updateHighScoreDisplay();
}

function generateChoiceButtons(count) {
  dom.choicesArea.innerHTML = '';
  dom.choiceBtns = [];
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.id = `choice-${i}`;
    const badge = document.createElement('span');
    badge.className = 'choice-num';
    badge.textContent = i + 1;
    const label = document.createElement('span');
    label.className = 'choice-label';
    btn.appendChild(badge);
    btn.appendChild(label);
    btn.addEventListener('click', () => selectAnswer(i));
    dom.choicesArea.appendChild(btn);
    dom.choiceBtns.push(btn);
  }
  // Update grid class
  dom.choicesArea.className = `choices-area choices-${count}`;
}

function bindEvents() {
  // Difficulty
  dom.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => setDifficulty(parseInt(btn.dataset.seconds)));
  });
  dom.inlineDiffBtns.forEach(btn => {
    btn.addEventListener('click', () => setDifficulty(parseInt(btn.dataset.seconds)));
  });

  // Game mode
  dom.gameModeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.gameModeOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.gameMode = btn.dataset.mode;
      updateHighScoreDisplay();
    });
  });

  // Question count
  dom.countOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.countOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.totalQuestions = parseInt(btn.dataset.count);
      updateHighScoreDisplay();
    });
  });

  // Choice count
  dom.choiceCountOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.choiceCountOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.choiceCount = parseInt(btn.dataset.choices);
      generateChoiceButtons(state.choiceCount);
    });
  });

  // Category filter
  dom.categoryOptions.forEach(btn => {
    btn.addEventListener('click', () => handleCategoryClick(btn));
  });

  // Main buttons
  dom.btnStart.addEventListener('click', startQuiz);

  // Start BGM on first interaction with start screen
  document.getElementById('screen-start').addEventListener('click', () => {
    if (!bgmStarted) bgmResume();
  }, { once: false });

  dom.btnPlay.addEventListener('click', playIntro);
  dom.btnNext.addEventListener('click', nextQuestion);
  dom.btnReplay.addEventListener('click', replayIntro);
  dom.btnFullListen.addEventListener('click', toggleFullListen);
  dom.btnQuit.addEventListener('click', quitQuiz);

  dom.btnRestart.addEventListener('click', () => {
    resetState();
    state.filteredSongs = getFilteredSongs();
    state.quizStartTime = Date.now();
    const total = state.totalQuestions > 0 ? Math.min(state.totalQuestions, state.filteredSongs.length) : state.filteredSongs.length;
    dom.totalQ.textContent = total;
    if (state.gameMode === 'timeattack') {
      dom.taTimer.classList.remove('hidden');
    } else {
      dom.taTimer.classList.add('hidden');
    }
    showScreen('quiz');
    loadQuestion();
  });
  dom.btnBackTitle.addEventListener('click', () => {
    resetState();
    stopPlayback();
    showScreen('start');
  });
  dom.btnShowReview.addEventListener('click', showReviewScreen);
  dom.btnReviewBack.addEventListener('click', () => showScreen('result'));

  // Volume
  dom.volumeSlider.addEventListener('input', (e) => {
    const vol = parseInt(e.target.value);
    state.volume = vol;
    dom.volumeValue.textContent = vol;
    if (player && state.playerReady) player.setVolume(vol);
    dom.volumeIcon.textContent = vol === 0 ? '\u2013' : '\u266A';
  });

  // Keyboard
  document.addEventListener('keydown', handleKeydown);
}

function handleCategoryClick(btn) {
  const cat = btn.dataset.cat;
  if (cat === 'all') {
    const allActive = btn.classList.contains('active');
    const cats = ['solo', 'endorfin', 'la_priere', 'itsukinkuru', 'collab'];
    if (allActive) {
      // Deselect all
      state.categoryFilter.clear();
      dom.categoryOptions.forEach(b => b.classList.remove('active'));
    } else {
      // Select all
      cats.forEach(c => state.categoryFilter.add(c));
      dom.categoryOptions.forEach(b => b.classList.add('active'));
    }
  } else {
    btn.classList.toggle('active');
    if (btn.classList.contains('active')) {
      state.categoryFilter.add(cat);
    } else {
      state.categoryFilter.delete(cat);
    }
    // Update "all" button
    const allBtn = document.querySelector('[data-cat="all"]');
    const cats = ['solo', 'endorfin', 'la_priere', 'itsukinkuru', 'collab'];
    if (cats.every(c => state.categoryFilter.has(c))) {
      allBtn.classList.add('active');
    } else {
      allBtn.classList.remove('active');
    }
  }
  updateFilteredCount();
}

function updateFilteredCount() {
  state.filteredSongs = getFilteredSongs();
  dom.filteredCount.textContent = state.filteredSongs.length;
}

function getFilteredSongs() {
  let songs = SONGS.filter(s => {
    const cat = s.category || 'solo';
    return state.categoryFilter.has(cat);
  });
  if (state.gameMode === 'weakonly') {
    const tracking = loadTracking();
    songs = songs.filter(s => {
      const t = tracking[s.id];
      return t && t.wrong > 0;
    });
  }
  return songs;
}

// ===== Keyboard Shortcuts =====
function handleKeydown(e) {
  const activeScreen = document.querySelector('.screen.active');
  if (!activeScreen) return;
  const screenId = activeScreen.id;

  if (screenId === 'screen-quiz') {
    // Number keys for choices
    const num = parseInt(e.key);
    if (num >= 1 && num <= state.choiceCount && !state.answered && state.hasPlayed) {
      e.preventDefault();
      selectAnswer(num - 1);
      return;
    }
    if (e.code === 'Space' && !state.isPlaying && !state.answered) {
      e.preventDefault();
      playIntro();
      return;
    }
    if (e.code === 'Space' && state.answered) {
      e.preventDefault();
      replayIntro();
      return;
    }
    if (e.code === 'Enter' && state.answered) {
      e.preventDefault();
      nextQuestion();
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      quitQuiz();
      return;
    }
  } else if (screenId === 'screen-start') {
    if (e.code === 'Enter') {
      e.preventDefault();
      startQuiz();
    }
  } else if (screenId === 'screen-result') {
    if (e.code === 'Enter') {
      e.preventDefault();
      dom.btnRestart.click();
    }
  }
}

// ===== Screen Management =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(`screen-${name}`);
  void screen.offsetWidth;
  screen.classList.add('active');
  // Show keyboard hint only in quiz
  if (dom.keyboardHint) {
    dom.keyboardHint.classList.toggle('visible', name === 'quiz');
  }
  // BGM control: pause during quiz, resume on menu/result
  if (name === 'quiz') {
    bgmPause();
  } else {
    bgmResume();
  }
}

// ===== Difficulty Sync =====
function setDifficulty(seconds) {
  state.introDuration = seconds;
  dom.diffBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.seconds) === seconds));
  dom.inlineDiffBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.seconds) === seconds));
}

// ===== Quiz Logic =====
function startQuiz() {
  initAudio();
  resetState();
  state.filteredSongs = getFilteredSongs();

  if (state.filteredSongs.length < state.choiceCount) {
    alert(`対象曲が${state.filteredSongs.length}曲しかありません。${state.choiceCount}択には最低${state.choiceCount}曲必要です。`);
    return;
  }

  state.quizStartTime = Date.now();
  // Set total for display
  const total = state.totalQuestions > 0 ? Math.min(state.totalQuestions, state.filteredSongs.length) : state.filteredSongs.length;
  dom.totalQ.textContent = total;

  // Time attack UI
  if (state.gameMode === 'timeattack') {
    dom.taTimer.classList.remove('hidden');
  } else {
    dom.taTimer.classList.add('hidden');
  }

  showScreen('quiz');
  loadQuestion();
}

function resetState() {
  state.score = 0;
  state.questionNum = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.correctCount = 0;
  state.currentSong = null;
  state.choices = [];
  state.answered = false;
  state.hasPlayed = false;
  state.usedSongIds.clear();
  state.isPlaying = false;
  state.answerHistory = [];
  clearTimers();
}

function loadQuestion() {
  state.questionNum++;
  state.answered = false;
  state.hasPlayed = false;
  state.isPlaying = false;

  dom.score.textContent = state.score;
  dom.currentQ.textContent = state.questionNum;
  dom.streak.textContent = state.streak;
  dom.resultArea.classList.add('hidden');
  dom.playOverlay.classList.remove('hidden');
  dom.btnPlay.disabled = false;
  dom.timerFill.style.width = '0%';

  // Reset choices
  dom.choiceBtns.forEach(btn => {
    btn.classList.remove('correct', 'wrong', 'correct-answer');
    btn.disabled = true;
    const label = btn.querySelector('.choice-label');
    if (label) label.textContent = '';
  });

  // Check question limit
  const available = state.filteredSongs.filter(s => !state.usedSongIds.has(s.id));
  const reachedLimit = state.totalQuestions > 0 && state.questionNum > state.totalQuestions;
  if (available.length < state.choiceCount || reachedLimit) {
    state.questionNum--;
    showFinalResult();
    return;
  }

  // Pick current song
  state.currentSong = pickRandom(available);
  state.usedSongIds.add(state.currentSong.id);

  // Generate choices
  const wrongPool = state.filteredSongs.filter(s =>
    s.id !== state.currentSong.id && s.title !== state.currentSong.title
  );
  const wrongChoices = shuffle(wrongPool).slice(0, state.choiceCount - 1);
  state.choices = shuffle([state.currentSong, ...wrongChoices]);

  state.choices.forEach((song, i) => {
    if (dom.choiceBtns[i]) {
      const label = dom.choiceBtns[i].querySelector('.choice-label');
      if (label) label.textContent = song.title;
    }
  });

  // Update progress
  updateProgress();

  // Time attack: reset question timer
  state.questionStartTime = 0;
  if (state.gameMode === 'timeattack') {
    dom.taValue.textContent = '0.0s';
  }

  // Pre-buffer video (muted) for instant playback
  if (state.playerReady && player) {
    state.preBuffered = false;
    player.mute();
    player.loadVideoById({ videoId: state.currentSong.id, startSeconds: state.currentSong.start || 0 });
  }
}

function updateProgress() {
  const total = state.totalQuestions > 0
    ? Math.min(state.totalQuestions, state.filteredSongs.length)
    : state.filteredSongs.length;
  const pct = ((state.questionNum - 1) / total) * 100;
  dom.progressFill.style.width = `${Math.min(pct, 100)}%`;
}

function enableChoices() {
  if (!state.answered) {
    dom.choiceBtns.forEach(btn => { btn.disabled = false; });
  }
}

// ===== Playback =====
function playIntro() {
  if (!state.playerReady || !player || state.isPlaying) return;
  dom.btnPlay.disabled = true;
  state.isPlaying = true;
  state.introTimerStarted = false;
  player.unMute();
  player.setVolume(getNormalizedVolume());
  player.seekTo(state.currentSong.start || 0, true);
  player.playVideo();
  // Start answer timer for all modes
  if (state.questionStartTime === 0) {
    state.questionStartTime = Date.now();
  }
  // Time attack display
  if (state.gameMode === 'timeattack') {
    updateTATimer();
  }
}

function updateTATimer() {
  if (state.gameMode !== 'timeattack' || state.answered) return;
  const elapsed = ((Date.now() - state.questionStartTime) / 1000).toFixed(1);
  dom.taValue.textContent = `${elapsed}s`;
  requestAnimationFrame(updateTATimer);
}

function replayIntro() {
  if (!state.playerReady || !player) return;
  dom.btnFullListen.classList.remove('playing');
  dom.btnFullListen.textContent = 'フルで聴く';
  player.setVolume(getNormalizedVolume());
  player.seekTo(state.currentSong.start || 0, true);
  player.playVideo();
  clearTimeout(state.replayTimer);
  state.replayTimer = setTimeout(() => {
    if (player && state.answered) player.pauseVideo();
  }, state.introDuration * 1000);
}

function toggleFullListen() {
  if (!state.playerReady || !player) return;
  clearTimeout(state.replayTimer);
  const isPlaying = dom.btnFullListen.classList.toggle('playing');
  if (isPlaying) {
    dom.btnFullListen.textContent = '停止';
    player.setVolume(getNormalizedVolume());
    player.seekTo(0, true);
    player.playVideo();
  } else {
    dom.btnFullListen.textContent = 'フルで聴く';
    player.pauseVideo();
  }
}

function startIntroTimer() {
  const duration = state.introDuration * 1000;
  const startTime = Date.now();
  clearTimers();

  state.timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration * 100, 100);
    dom.timerFill.style.width = `${progress}%`;
    if (elapsed >= duration) {
      clearInterval(state.timerInterval);
    }
  }, 16);

  state.stopTimer = setTimeout(() => {
    if (player && state.playerReady) player.pauseVideo();
    clearInterval(state.timerInterval);
    state.isPlaying = false;
    state.hasPlayed = true;
    state.stopTimer = null;
    dom.timerFill.style.width = '100%';
    enableChoices();
    dom.btnPlay.disabled = false;
  }, duration);
}

function stopPlayback() {
  clearTimers();
  if (player && state.playerReady) {
    try { player.pauseVideo(); } catch (e) {}
  }
  state.isPlaying = false;
}

function clearTimers() {
  if (state.stopTimer) { clearTimeout(state.stopTimer); state.stopTimer = null; }
  if (state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
}

// ===== Answer Logic =====
function selectAnswer(index) {
  if (state.answered || !state.hasPlayed) return;
  if (index >= state.choices.length) return;
  state.answered = true;
  stopPlayback();

  const selected = state.choices[index];
  const isCorrect = selected.id === state.currentSong.id;
  const answerTimeMs = state.questionStartTime > 0 ? Date.now() - state.questionStartTime : 0;

  dom.choiceBtns.forEach(btn => btn.disabled = true);
  dom.btnPlay.disabled = true;

  if (isCorrect) {
    state.correctCount++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;

    // Score calculation - base points by intro duration
    let basePoints = 100;
    if (state.introDuration === 2) basePoints = 150;
    if (state.introDuration === 1) basePoints = 200;

    // Choice count bonus
    if (state.choiceCount === 6) basePoints = Math.round(basePoints * 1.3);
    if (state.choiceCount === 8) basePoints = Math.round(basePoints * 1.6);

    // Streak bonus: +30 per consecutive correct (2nd=+30, 3rd=+60, 4th=+90...)
    const streakBonus = (state.streak - 1) * 30;

    // Speed bonus: based on answer time (all modes)
    let speedBonus = 0;
    if (answerTimeMs > 0) {
      const sec = answerTimeMs / 1000;
      if (sec <= 1) speedBonus = 100;
      else if (sec <= 2) speedBonus = 70;
      else if (sec <= 3) speedBonus = 40;
      else if (sec <= 4) speedBonus = 20;
    }

    const points = basePoints + streakBonus + speedBonus;
    state.score += points;

    dom.choiceBtns[index].classList.add('correct');
    // Show breakdown in popup
    let popupText = `+${points}`;
    const extras = [];
    if (speedBonus > 0) extras.push(`⚡${(answerTimeMs/1000).toFixed(1)}s`);
    if (streakBonus > 0) extras.push(`🔥${state.streak}連続`);
    if (extras.length) popupText += ` (${extras.join(' ')})`;
    showScorePopup(popupText, false);
    if (state.streak >= 3) {
      playSE('streak');
    } else {
      playSE('correct');
    }
  } else {
    state.streak = 0;
    dom.choiceBtns[index].classList.add('wrong');
    // Highlight correct answer
    state.choices.forEach((song, i) => {
      if (song.id === state.currentSong.id) {
        dom.choiceBtns[i].classList.add('correct-answer');
      }
    });
    playSE('wrong');
  }

  // Save tracking
  saveTrackingResult(state.currentSong.id, isCorrect);

  // Add to history
  state.answerHistory.push({
    song: state.currentSong,
    correct: isCorrect,
    timeMs: answerTimeMs,
  });

  showResult(isCorrect);
  dom.score.textContent = state.score;
  dom.streak.textContent = state.streak;
}

function showResult(correct, customMsg) {
  dom.resultArea.classList.remove('hidden');

  // Song info & lyrics
  const songInfo = state.currentSong.info || '';
  const songLyrics = state.currentSong.lyrics || '';
  dom.resultInfo.textContent = songInfo;
  dom.resultLyrics.textContent = songLyrics;
  dom.resultYoutubeLink.href = `https://www.youtube.com/watch?v=${state.currentSong.id}`;
  dom.resultThumbnail.src = `https://img.youtube.com/vi/${state.currentSong.id}/mqdefault.jpg`;
  dom.resultThumbnail.alt = state.currentSong.title;

  if (customMsg) {
    dom.resultIcon.innerHTML = '<span class="icon-warning">!</span>';
    dom.resultText.textContent = customMsg;
    dom.resultText.className = 'result-text';
    dom.resultSong.textContent = `正解: ${state.currentSong.title}`;
  } else if (correct) {
    if (state.streak >= 3) {
      dom.resultIcon.innerHTML = '<span class="icon-streak">' + state.streak + '</span>';
    } else {
      dom.resultIcon.innerHTML = '<span class="icon-correct">&#10003;</span>';
    }
    const messages = ['正解！', 'すごい！', 'さすが！', 'パーフェクト！', '完璧！'];
    dom.resultText.textContent = state.streak >= 5
      ? `${state.streak}連続正解！`
      : pickRandom(messages);
    dom.resultText.className = 'result-text correct';
    dom.resultSong.textContent = state.currentSong.title;
  } else {
    dom.resultIcon.innerHTML = '<span class="icon-wrong">&times;</span>';
    const messages = ['残念...', 'おしい！', 'ドンマイ！'];
    dom.resultText.textContent = pickRandom(messages);
    dom.resultText.className = 'result-text wrong';
    dom.resultSong.textContent = `正解: ${state.currentSong.title}`;
  }

  // Time attack display
  if (state.gameMode === 'timeattack' && state.questionStartTime > 0) {
    const elapsed = ((Date.now() - state.questionStartTime) / 1000).toFixed(1);
    dom.taValue.textContent = `${elapsed}s`;
  }

  // Re-trigger animation
  dom.resultIcon.style.animation = 'none';
  void dom.resultIcon.offsetWidth;
  dom.resultIcon.style.animation = '';
}

function showScorePopup(text, isBonus) {
  const popup = document.createElement('div');
  popup.className = `score-popup${isBonus ? ' bonus' : ''}`;
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

function nextQuestion() {
  clearTimeout(state.replayTimer);
  if (dom.btnFullListen) {
    dom.btnFullListen.classList.remove('playing');
    dom.btnFullListen.textContent = 'フルで聴く';
  }
  stopPlayback();
  loadQuestion();
}

function quitQuiz() {
  stopPlayback();
  clearTimeout(state.replayTimer);
  resetState();
  showScreen('start');
}

// ===== Final Result =====
function showFinalResult() {
  stopPlayback();
  playSE('finish');
  showScreen('result');

  const totalAnswered = state.answerHistory.length;
  const totalTime = Date.now() - state.quizStartTime;

  dom.finalScore.textContent = state.score;
  dom.finalCorrect.textContent = `${state.correctCount} / ${totalAnswered}`;
  dom.finalStreak.textContent = state.maxStreak;
  dom.finalTime.textContent = formatTime(totalTime);

  // Rank
  const pct = totalAnswered > 0 ? state.correctCount / totalAnswered : 0;
  let rank, rankClass;
  if (pct >= 0.95 && state.introDuration <= 1) { rank = 'S+'; rankClass = 'rank-splus'; }
  else if (pct >= 0.9) { rank = 'S'; rankClass = 'rank-s'; }
  else if (pct >= 0.75) { rank = 'A'; rankClass = 'rank-a'; }
  else if (pct >= 0.5) { rank = 'B'; rankClass = 'rank-b'; }
  else { rank = 'C'; rankClass = 'rank-c'; }

  dom.rankValue.textContent = rank;
  dom.rankValue.className = `rank-value ${rankClass}`;

  // High score
  const isNew = saveHighScore(state.score, totalTime);
  dom.newHighscore.classList.toggle('hidden', !isNew);

  // Update progress to 100%
  dom.progressFill.style.width = '100%';
}

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ===== Review Screen =====
function showReviewScreen() {
  showScreen('review');
  dom.reviewList.innerHTML = '';

  state.answerHistory.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = `review-item ${entry.correct ? 'correct' : 'wrong'}`;

    const num = document.createElement('span');
    num.className = 'review-num';
    num.textContent = `${i + 1}`;

    const mark = document.createElement('span');
    mark.className = 'review-mark';
    mark.textContent = entry.correct ? 'O' : 'X';

    const title = document.createElement('span');
    title.className = 'review-title';
    title.textContent = entry.song.title;

    const info = document.createElement('span');
    info.className = 'review-item-info';
    info.textContent = entry.song.info || '';

    const link = document.createElement('a');
    link.className = 'review-link';
    link.href = `https://www.youtube.com/watch?v=${entry.song.id}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'YouTube';

    const details = document.createElement('div');
    details.className = 'review-details';
    details.appendChild(title);
    details.appendChild(info);

    item.appendChild(num);
    item.appendChild(mark);
    item.appendChild(details);
    item.appendChild(link);
    dom.reviewList.appendChild(item);
  });
}

// ===== localStorage: High Scores =====
function getHSKey() {
  return `nakuru_hs_${state.gameMode}_${state.totalQuestions}_${state.introDuration}_${state.choiceCount}`;
}

function saveHighScore(score, timeMs) {
  const key = getHSKey();
  const existing = JSON.parse(localStorage.getItem(key) || 'null');
  if (!existing || score > existing.score || (score === existing.score && timeMs < existing.time)) {
    localStorage.setItem(key, JSON.stringify({ score, time: timeMs }));
    return true;
  }
  return false;
}

function loadHighScore() {
  const key = getHSKey();
  return JSON.parse(localStorage.getItem(key) || 'null');
}

function updateHighScoreDisplay() {
  const hs = loadHighScore();
  if (hs) {
    dom.hsDisplay.style.display = '';
    dom.hsScore.textContent = hs.score;
    dom.hsTime.textContent = formatTime(hs.time);
  } else {
    dom.hsDisplay.style.display = 'none';
  }
}

// ===== localStorage: Per-Song Tracking =====
function loadTracking() {
  return JSON.parse(localStorage.getItem('nakuru_tracking') || '{}');
}

function saveTrackingResult(songId, correct) {
  const tracking = loadTracking();
  if (!tracking[songId]) tracking[songId] = { correct: 0, wrong: 0 };
  if (correct) tracking[songId].correct++;
  else tracking[songId].wrong++;
  localStorage.setItem('nakuru_tracking', JSON.stringify(tracking));
}

// ===== Utilities =====
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== BGM Control =====
let bgmStarted = false;
let bgmMuted = false;

function bgmPause() {
  if (bgmPlayer && typeof bgmPlayer.pauseVideo === 'function') {
    try { bgmPlayer.pauseVideo(); } catch(e) {}
  }
}

function bgmResume() {
  if (!bgmPlayer || !state.bgmReady || bgmMuted) return;
  try {
    const vol = parseInt(document.getElementById('bgm-volume')?.value || BGM_VOLUME);
    if (!bgmStarted) {
      bgmStarted = true;
      bgmPlayer.loadVideoById({ videoId: BGM_SONGS[Math.floor(Math.random() * BGM_SONGS.length)], startSeconds: 30 });
      bgmPlayer.setVolume(vol);
    } else {
      bgmPlayer.setVolume(vol);
      bgmPlayer.playVideo();
    }
  } catch(e) {}
}

function initBgmControls() {
  const toggleBtn = document.getElementById('bgm-toggle');
  const volumeSlider = document.getElementById('bgm-volume');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      bgmMuted = !bgmMuted;
      toggleBtn.classList.toggle('muted', bgmMuted);
      toggleBtn.textContent = bgmMuted ? '♪' : '♪';
      toggleBtn.title = bgmMuted ? 'BGM OFF (クリックで再開)' : 'BGM ON (クリックで停止)';
      if (bgmMuted) {
        bgmPause();
      } else {
        bgmResume();
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value);
      if (bgmPlayer && typeof bgmPlayer.setVolume === 'function') {
        try { bgmPlayer.setVolume(vol); } catch(e) {}
      }
    });
  }
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', () => {
  init();
  initBgmControls();
});
