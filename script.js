const TEASER_VIDEO_URL = 'assets/Open_Day.mp4';

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

// ==============================
// CANVA GIVEAWAY
// ==============================

const quizDialog = document.getElementById('quiz-dialog');
const quizContent = document.getElementById('quiz-content');
const quizProgress = document.getElementById('quiz-progress-bar');
const quizClose = document.getElementById('quiz-close');
const openGiveaway = document.getElementById('open-giveaway');
const giveawayCard = document.getElementById('canva-giveaway');

function giveawayDeviceId() {
  const key = 'unibyteGiveawayDeviceId';
  let value = localStorage.getItem(key);
  if (!value) {
    value = globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, value);
  }
  return value;
}

const techBank = [
  { id: 'html', text: 'واش هي اللغة المستعملة لبناء هيكل صفحة الويب؟', options: ['HTML', 'Python', 'SQL', 'Photoshop'], correct: 'HTML' },
  { id: 'cpu', text: 'شنو هو الجزء اللي يسموه عقل الحاسوب؟', options: ['RAM', 'CPU', 'SSD', 'GPU'], correct: 'CPU' },
  { id: 'rgb', text: 'أي نظام ألوان نستعملوه غالبًا للشاشات؟', options: ['CMYK', 'RGB', 'PMS', 'HEX فقط'], correct: 'RGB' },
  { id: 'undo', text: 'الاختصار الشائع للتراجع عن آخر خطوة هو؟', options: ['Ctrl + S', 'Ctrl + Z', 'Ctrl + P', 'Ctrl + F'], correct: 'Ctrl + Z' },
  { id: 'git', text: 'Git يُستعمل أساسًا في؟', options: ['مونتاج الصوت', 'إدارة إصدارات الكود', 'الرسم فقط', 'إرسال الإيميل'], correct: 'إدارة إصدارات الكود' },
  { id: 'camera', text: 'شنو اللي يتحكم في كمية الضوء الداخلة للكاميرا؟', options: ['فتحة العدسة', 'البلوتوث', 'الميكروفون', 'بطاقة الذاكرة'], correct: 'فتحة العدسة' },
];

const selectSteps = [
  { key: 'studyYear', text: 'في أي سنة تقرا؟', options: [['1', 'السنة الأولى'], ['2', 'السنة الثانية'], ['3', 'السنة الثالثة'], ['4', 'السنة الرابعة'], ['5', 'السنة الخامسة']] },
  { key: 'heardAboutUnibyte', text: 'سمعت بنادي Unibyte من قبل؟', options: [['yes', 'نعم، نعرفه'], ['no', 'لا، أول مرة']] },
  { key: 'willAttend', text: 'تحضر للافتتاح يوم الثلاثاء 10 نوفمبر؟', hint: 'بمركز تطوير المقاولتية', options: [['yes', 'أكيد نحضر'], ['maybe', 'ممكن'], ['no', 'ما نقدرش']] },
  { key: 'discoverySource', text: 'كيفاش عرفت علينا؟', options: [['friends', 'الأصدقاء'], ['social', 'السوشيال ميديا'], ['university', 'في الجامعة'], ['poster', 'البوستر / QR'], ['other', 'طريقة أخرى']] },
  { key: 'interest', text: 'المجال اللي يجذبك أكثر؟', options: [['programming', 'البرمجة'], ['design', 'التصميم'], ['video', 'المونتاج'], ['photography', 'التصوير'], ['soft-skills', 'Soft Skills']] },
  { key: 'preferredActivity', text: 'وش حاب تلقى أكثر في Open Day؟', options: [['workshops', 'ورشات'], ['quiz', 'Quiz وتحديات'], ['projects', 'مشاريع وتجارب'], ['networking', 'تعارف وفريق'], ['all', 'كل شيء']] },
];

let quizStep = 0;
let selectedTech = [];
let quizStartedAt = 0;
let giveawaySoldOut = false;
const giveawayForm = { fullName: '', studyYear: '', heardAboutUnibyte: '', willAttend: '', discoverySource: '', interest: '', preferredActivity: '', email: '', techAnswers: {} };

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function goToOpenDay() {
  quizDialog.close();
  document.querySelector('.intro').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderResult({ soldOut = false } = {}) {
  quizProgress.style.width = '100%';
  quizContent.innerHTML = `<section class="quiz-step quiz-result"><div class="quiz-result-mark">${soldOut ? '!' : '✓'}</div><h2>${soldOut ? 'تم نفاد الكمية' : 'مبروك! سجلنا اشتراكك'}</h2><p>${soldOut ? 'اشتراكات الموقع خلصت، بصح كاين المزيد من اشتراكات Canva وهدايا في Open Day.' : 'تم تسجيل مشاركتك. راح نفعّل Canva على الإيميل اللي عطيتنا.'}</p><button class="quiz-open-day" id="quiz-open-day" type="button">روح لصفحة Open Day</button></section>`;
  document.getElementById('quiz-open-day').addEventListener('click', goToOpenDay);
}

function renderQuiz() {
  const total = 10;
  quizProgress.style.width = `${Math.min(quizStep, total) * 10}%`;
  if (giveawaySoldOut) return renderResult({ soldOut: true });

  if (quizStep === 0) {
    quizContent.innerHTML = '<section class="quiz-step"><img class="quiz-canva-logo" src="assets/canva-pro-badge.png" alt="Canva Pro"><span class="quiz-overline">CANVA GIVEAWAY · عدد محدود</span><h2 id="quiz-title">10 أسئلة خفيفة<br>وفرصتك تربح Canva</h2><p>الإيميل نطلبوه منك غير في آخر خطوة، وهو نفسه اللي حاب تفعّل فيه Canva.</p><div class="quiz-actions"><button class="quiz-next" id="quiz-next" type="button">ابدأ الآن</button></div></section>';
  } else if (quizStep === 1) {
    quizContent.innerHTML = `<section class="quiz-step"><span class="quiz-overline">السؤال 1 من 10</span><h2 id="quiz-title">بداية، واش هو اسمك الكامل؟</h2><input class="quiz-input" id="quiz-input" value="${escapeHtml(giveawayForm.fullName)}" placeholder="الاسم واللقب" autocomplete="name" /><div class="quiz-actions"><button class="quiz-back" id="quiz-back" type="button">→</button><button class="quiz-next" id="quiz-next" type="button" ${giveawayForm.fullName.trim().length < 2 ? 'disabled' : ''}>التالي</button></div></section>`;
  } else if (quizStep <= 7) {
    const config = selectSteps[quizStep - 2];
    quizContent.innerHTML = `<section class="quiz-step"><span class="quiz-overline">السؤال ${quizStep} من 10</span><h2 id="quiz-title">${config.text}</h2>${config.hint ? `<p>${config.hint}</p>` : ''}<div class="quiz-options">${config.options.map(([value, label]) => `<button class="quiz-option ${giveawayForm[config.key] === value ? 'is-selected' : ''}" data-value="${value}" type="button">${label}</button>`).join('')}</div><div class="quiz-actions"><button class="quiz-back" id="quiz-back" type="button">→</button><button class="quiz-next" id="quiz-next" type="button" ${giveawayForm[config.key] ? '' : 'disabled'}>التالي</button></div></section>`;
  } else if (quizStep <= 10) {
    const question = selectedTech[quizStep - 8];
    quizContent.innerHTML = `<section class="quiz-step"><span class="quiz-overline">السؤال ${quizStep} من 10</span><h2 id="quiz-title">${question.text}</h2><div class="quiz-options">${question.options.map((value) => `<button class="quiz-option ${giveawayForm.techAnswers[question.id] === value ? 'is-selected' : ''}" data-value="${escapeHtml(value)}" type="button">${escapeHtml(value)}</button>`).join('')}</div><div class="quiz-actions"><button class="quiz-back" id="quiz-back" type="button">→</button><button class="quiz-next" id="quiz-next" type="button" ${giveawayForm.techAnswers[question.id] ? '' : 'disabled'}>${quizStep === 10 ? 'إدخال بريد Canva' : 'التالي'}</button></div></section>`;
  } else {
    quizContent.innerHTML = `<section class="quiz-step"><span class="quiz-overline">الخطوة الأخيرة</span><h2 id="quiz-title">أدخل الإيميل لي حاب تدير فيه Canva</h2><p>تأكد منه مليح، لأنه هو البريد اللي راح نستعملوه للتفعيل.</p><input class="quiz-input" id="quiz-email" value="${escapeHtml(giveawayForm.email)}" placeholder="name@example.com" type="email" inputmode="email" autocomplete="email" dir="ltr" /><p class="quiz-email-note">ما نستعملوش بريدك إلا لتفعيل الاشتراك والتواصل حول الجائزة.</p><div id="quiz-error"></div><div class="quiz-actions"><button class="quiz-back" id="quiz-back" type="button">→</button><button class="quiz-next" id="quiz-submit" type="button" disabled>ثبّت مشاركتي</button></div></section>`;
  }

  bindQuizControls();
}

function bindQuizControls() {
  const next = document.getElementById('quiz-next');
  const back = document.getElementById('quiz-back');
  const input = document.getElementById('quiz-input');
  const email = document.getElementById('quiz-email');
  if (next) next.addEventListener('click', () => { quizStep += 1; renderQuiz(); });
  if (back) back.addEventListener('click', () => { quizStep = Math.max(0, quizStep - 1); renderQuiz(); });
  if (input) input.addEventListener('input', (event) => { giveawayForm.fullName = event.target.value; document.getElementById('quiz-next').disabled = giveawayForm.fullName.trim().length < 2; });
  document.querySelectorAll('.quiz-option').forEach((button) => button.addEventListener('click', () => {
    const value = button.dataset.value;
    if (quizStep <= 7) giveawayForm[selectSteps[quizStep - 2].key] = value;
    else giveawayForm.techAnswers[selectedTech[quizStep - 8].id] = value;
    renderQuiz();
  }));
  if (email) email.addEventListener('input', (event) => { giveawayForm.email = event.target.value.trim(); document.getElementById('quiz-submit').disabled = !/^\S+@\S+\.\S+$/.test(giveawayForm.email); });
  const submit = document.getElementById('quiz-submit');
  if (submit) submit.addEventListener('click', submitGiveaway);
}

async function submitGiveaway() {
  const submit = document.getElementById('quiz-submit');
  const errorBox = document.getElementById('quiz-error');
  submit.disabled = true;
  submit.textContent = 'جاري التسجيل...';
  try {
    const quizAnswers = selectedTech.map((question) => ({ questionId: question.id, answer: giveawayForm.techAnswers[question.id] }));
    const response = await fetch('/api/giveaway', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...giveawayForm, quizAnswers, deviceId: giveawayDeviceId(), startedAt: quizStartedAt, website: '' }) });
    const payload = await response.json();
    if (payload.soldOut) { giveawaySoldOut = true; renderResult({ soldOut: true }); return; }
    if (!response.ok) throw new Error(payload.message || 'تعذر تسجيل المشاركة.');
    renderResult();
  } catch (error) {
    errorBox.innerHTML = `<p class="quiz-error">${escapeHtml(error.message || 'حدث خطأ. حاول مرة أخرى.')}</p>`;
    submit.disabled = false;
    submit.textContent = 'ثبّت مشاركتي';
  }
}

openGiveaway.addEventListener('click', () => {
  if (giveawaySoldOut) {
    document.querySelector('.intro').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  quizStep = 0;
  selectedTech = shuffled(techBank).slice(0, 3);
  quizStartedAt = Date.now();
  renderQuiz();
  quizDialog.showModal();
});

quizClose.addEventListener('click', () => quizDialog.close());
quizDialog.addEventListener('click', (event) => { if (event.target === quizDialog) quizDialog.close(); });

fetch('/api/giveaway')
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((status) => {
    giveawaySoldOut = status.soldOut;
    const label = giveawayCard.querySelector('.giveaway-label');
    if (status.soldOut) {
      label.textContent = 'تم نفاد الكمية';
      giveawayCard.querySelector('h2').textContent = 'نشوفوك في Unibyte Open Day';
      giveawayCard.querySelector('p').textContent = 'كاين المزيد من اشتراكات Canva وهدايا للتوزيع في الفعالية.';
      openGiveaway.textContent = 'شوف Open Day';
    } else label.textContent = 'عدد محدود';
  })
  .catch(() => {});
