// Add the teaser file to assets/ and set this path when the video is ready.
const TEASER_VIDEO_URL = '';

// ==============================
// VIDEO PLAYER
// ==============================

const player = document.getElementById('teaser-player');
const video = document.getElementById('teaser-video');
const centerButton = document.getElementById('play-button');
const controlPlay = document.getElementById('control-play');
const progress = document.getElementById('progress');
const currentTime = document.getElementById('current-time');
const duration = document.getElementById('duration');
const muteButton = document.getElementById('mute-button');
const fullscreenButton = document.getElementById('fullscreen-button');
const message = document.getElementById('player-message');

// ==============================
// COUNTDOWN TIMER — 24 HOURS
// ==============================

const COUNTDOWN_STORAGE_KEY = 'unibyteTeaserCountdownDeadline';
const COUNTDOWN_DURATION = 24 * 60 * 60 * 1000;

const countdownHours = document.getElementById('countdown-hours');
const countdownMinutes = document.getElementById('countdown-minutes');
const countdownSeconds = document.getElementById('countdown-seconds');
const countdownStatus = document.getElementById('countdown-status');
const countdownContainer = document.getElementById('teaser-countdown');

let countdownInterval = null;

function startCountdown() {
  // Skip the countdown if its HTML elements aren't present.
  if (
    !countdownHours ||
    !countdownMinutes ||
    !countdownSeconds ||
    !countdownStatus
  ) {
    return;
  }

  let deadline;

  try {
    deadline = Number(localStorage.getItem(COUNTDOWN_STORAGE_KEY));

    // Start a new countdown if one doesn't exist or has expired.
    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      deadline = Date.now() + COUNTDOWN_DURATION;
      localStorage.setItem(
        COUNTDOWN_STORAGE_KEY,
        String(deadline)
      );
    }
  } catch (error) {
    // Use a temporary countdown if browser storage is unavailable.
    deadline = Date.now() + COUNTDOWN_DURATION;
  }

  function updateCountdown() {
    const remaining = Math.max(0, deadline - Date.now());

    const hours = Math.floor(
      remaining / (60 * 60 * 1000)
    );

    const minutes = Math.floor(
      (remaining % (60 * 60 * 1000)) / (60 * 1000)
    );

    const seconds = Math.floor(
      (remaining % (60 * 1000)) / 1000
    );

    countdownHours.textContent = String(hours).padStart(2, '0');
    countdownMinutes.textContent = String(minutes).padStart(2, '0');
    countdownSeconds.textContent = String(seconds).padStart(2, '0');

    if (remaining <= 0) {
      countdownStatus.textContent = 'The wait is over. Stay tuned!';

      if (countdownContainer) {
        countdownContainer.setAttribute(
          'aria-label',
          'The countdown has ended'
        );
      }

      if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
      }
    }
  }

  updateCountdown();

  if (countdownInterval === null) {
    countdownInterval = setInterval(updateCountdown, 1000);
  }
}

startCountdown();

// ==============================
// VIDEO PLAYER FUNCTIONS
// ==============================

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--';

  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function togglePlayback() {
  if (!TEASER_VIDEO_URL) {
    message.textContent = 'Teaser coming soon';
    return;
  }

  if (video.paused) {
    video.play().catch(() => {
      message.textContent = 'Unable to play the teaser';
    });
  } else {
    video.pause();
  }
}

centerButton.addEventListener('click', togglePlayback);
controlPlay.addEventListener('click', togglePlayback);
video.addEventListener('click', togglePlayback);

// ==============================
// LOAD VIDEO WHEN IT IS READY
// ==============================

if (TEASER_VIDEO_URL) {
  video.src = TEASER_VIDEO_URL;
  video.removeAttribute('aria-hidden');
  video.load();

  centerButton.setAttribute('aria-label', 'Play teaser');

  for (const control of [
    controlPlay,
    progress,
    muteButton,
    fullscreenButton
  ]) {
    control.disabled = false;
  }

  player.dataset.state = 'ready';

  document.querySelector('.teaser-note').textContent =
    'Turn up the sound and take a first look.';
}

// ==============================
// VIDEO EVENT LISTENERS
// ==============================

video.addEventListener('loadedmetadata', () => {
  duration.textContent = formatTime(video.duration);
});

video.addEventListener('timeupdate', () => {
  currentTime.textContent = formatTime(video.currentTime);

  progress.value = video.duration
    ? String(Math.round((video.currentTime / video.duration) * 1000))
    : '0';
});

video.addEventListener('play', () => {
  player.dataset.state = 'playing';

  centerButton.setAttribute('aria-label', 'Pause teaser');
  controlPlay.setAttribute('aria-label', 'Pause teaser');
});

video.addEventListener('pause', () => {
  player.dataset.state = 'paused';

  centerButton.setAttribute('aria-label', 'Play teaser');
  controlPlay.setAttribute('aria-label', 'Play teaser');
});

video.addEventListener('ended', () => {
  player.dataset.state = 'paused';
});

video.addEventListener('error', () => {
  player.dataset.state = 'placeholder';
  message.textContent = 'Teaser unavailable right now';
});

// ==============================
// VIDEO CONTROLS
// ==============================

progress.addEventListener('input', () => {
  if (video.duration) {
    video.currentTime =
      (Number(progress.value) / 1000) * video.duration;
  }
});

muteButton.addEventListener('click', () => {
  video.muted = !video.muted;

  muteButton.setAttribute(
    'aria-label',
    video.muted ? 'Unmute video' : 'Mute video'
  );

  muteButton.style.opacity = video.muted ? '.5' : '1';
});

fullscreenButton.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    player.requestFullscreen?.();
  }
});