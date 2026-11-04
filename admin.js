const login = document.getElementById('admin-login');
const tokenInput = document.getElementById('admin-token');
const loginMessage = document.getElementById('admin-login-message');
const message = document.getElementById('admin-message');
const gate = document.getElementById('admin-gate');
const dashboard = document.getElementById('admin-dashboard');
const content = document.getElementById('admin-content');
const tbody = document.getElementById('entries');
const limitInput = document.getElementById('participant-limit');
let entries = [];
let campaign = { claimed: 0, limit: 15, cycle: 1 };
let adminToken = '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function authHeaders(withJson = false, token = adminToken) {
  return {
    ...(withJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

function answerDetails(entry) {
  const answers = Array.isArray(entry.quizAnswers) ? entry.quizAnswers : [];
  const items = answers.map((answer) => `<li><strong>${escapeHtml(answer.questionId)}</strong>: ${escapeHtml(answer.answer)} ${answer.correct ? '✓' : '✗'}</li>`).join('');
  return `<details><summary>عرض كل الإجابات</summary><ul class="answer-list"><li>السنة: ${escapeHtml(entry.studyYear)}</li><li>سمع بالنادي: ${escapeHtml(entry.heardAboutUnibyte)}</li><li>الحضور: ${escapeHtml(entry.willAttend)}</li><li>عرفنا عبر: ${escapeHtml(entry.discoverySource)}</li><li>المجال: ${escapeHtml(entry.interest)}</li><li>النشاط: ${escapeHtml(entry.preferredActivity)}</li>${items}</ul></details>`;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'فشل الطلب.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function loadEntries(token = adminToken) {
  if (!token) return;
  const firstLogin = !adminToken;
  const statusBox = firstLogin ? loginMessage : message;
  statusBox.textContent = 'جاري التحقق…';
  try {
    const payload = await request('/api/admin', { headers: authHeaders(false, token) });
    adminToken = token;
    entries = payload.entries || [];
    campaign = payload.campaign || campaign;
    gate.hidden = true;
    dashboard.hidden = false;
    document.title = 'Unibyte · Canva Giveaway Admin';
    content.hidden = false;
    tokenInput.value = '';
    loginMessage.textContent = '';
    message.textContent = '';
    document.getElementById('claimed').textContent = campaign.claimed;
    document.getElementById('limit').textContent = campaign.limit;
    document.getElementById('cycle').textContent = campaign.cycle;
    document.getElementById('activated').textContent = entries.filter((entry) => entry.activated).length;
    document.getElementById('pending').textContent = entries.filter((entry) => !entry.activated).length;
    limitInput.value = campaign.limit;
    tbody.innerHTML = entries.map((entry) => `<tr><td>${escapeHtml(entry.cycle || 1)} / ${escapeHtml(entry.rank)}</td><td><strong>${escapeHtml(entry.fullName)}</strong></td><td><a href="mailto:${encodeURIComponent(entry.email)}">${escapeHtml(entry.email)}</a></td><td>${escapeHtml(entry.studyYear)}</td><td>${escapeHtml(entry.heardAboutUnibyte)}</td><td>${escapeHtml(entry.willAttend)}</td><td>${escapeHtml(entry.discoverySource)}</td><td>${escapeHtml(entry.interest)}</td><td>${escapeHtml(entry.preferredActivity)}</td><td>${answerDetails(entry)}</td><td>${escapeHtml(entry.score)}/3</td><td><button class="activation ${entry.activated ? 'yes' : 'no'}" data-id="${entry.id}" data-active="${entry.activated}" type="button">${entry.activated ? 'تم التفعيل' : 'علّم كمفعّل'}</button></td><td>${entry.submittedAt ? new Date(entry.submittedAt).toLocaleString('ar-DZ') : '—'}</td></tr>`).join('');
    document.querySelectorAll('.activation').forEach((button) => button.addEventListener('click', () => updateActivation(button)));
  } catch (error) {
    if (firstLogin) {
      adminToken = '';
      dashboard.hidden = true;
      gate.hidden = false;
      loginMessage.textContent = error.status === 401 ? 'رمز الإدارة غير صحيح.' : 'تعذر فتح لوحة الإدارة الآن.';
      tokenInput.select();
    } else {
      message.textContent = error.message || 'تعذر تحديث لوحة الإدارة.';
    }
  }
}

async function updateActivation(button) {
  button.disabled = true;
  try {
    await request('/api/admin', {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ id: button.dataset.id, activated: button.dataset.active !== 'true' }),
    });
    await loadEntries();
  } catch (error) {
    button.disabled = false;
    message.textContent = error.message;
  }
}

login.addEventListener('submit', (event) => { event.preventDefault(); loadEntries(tokenInput.value.trim()); });
document.getElementById('refresh').addEventListener('click', loadEntries);
document.getElementById('logout').addEventListener('click', () => {
  adminToken = '';
  entries = [];
  tbody.innerHTML = '';
  dashboard.hidden = true;
  gate.hidden = false;
  document.title = 'Unibyte · Admin Access';
  message.textContent = '';
  loginMessage.textContent = '';
  tokenInput.value = '';
  tokenInput.focus();
});

document.getElementById('limit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const limit = Number(limitInput.value);
  message.textContent = 'جاري حفظ العدد…';
  try {
    await request('/api/admin', { method: 'PATCH', headers: authHeaders(true), body: JSON.stringify({ action: 'setLimit', limit }) });
    await loadEntries();
    message.textContent = 'تم تحديث العدد بنجاح.';
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById('reset-counter').addEventListener('click', async () => {
  const confirmation = window.prompt('سيعود العداد إلى 0 وتبقى كل المشاركات والمعلومات. اكتب COUNTER للتأكيد:');
  if (confirmation !== 'COUNTER') return;
  try {
    await request('/api/admin', { method: 'POST', headers: authHeaders(true), body: JSON.stringify({ action: 'resetCounter', confirmation: 'RESET-COUNTER' }) });
    await loadEntries();
    message.textContent = 'تم تصفير العداد وبدأت دورة جديدة مع إبقاء المشاركات.';
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById('export').addEventListener('click', () => {
  if (!entries.length) return;
  const rows = [['Cycle', 'Rank', 'Name', 'Canva email', 'Year', 'Knows Unibyte', 'Attendance', 'Discovery source', 'Interest', 'Preferred activity', 'Quiz answers', 'Score', 'Activated', 'Submitted at'], ...entries.map((entry) => [entry.cycle || 1, entry.rank, entry.fullName, entry.email, entry.studyYear, entry.heardAboutUnibyte, entry.willAttend, entry.discoverySource, entry.interest, entry.preferredActivity, (entry.quizAnswers || []).map((answer) => `${answer.questionId}: ${answer.answer} (${answer.correct ? 'correct' : 'wrong'})`).join(' | '), `${entry.score}/3`, entry.activated ? 'Yes' : 'No', entry.submittedAt || ''])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'unibyte-canva-giveaway.csv';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('reset-data').addEventListener('click', async () => {
  if (!adminToken) return;
  const confirmation = window.prompt('هذا يمسح المشاركات ويعيد الإعدادات. اكتب DELETE للتأكيد:');
  if (confirmation !== 'DELETE') { message.textContent = confirmation === null ? 'تم إلغاء المسح.' : 'كلمة التأكيد غير صحيحة.'; return; }
  const button = document.getElementById('reset-data');
  button.disabled = true;
  message.textContent = 'جاري مسح بيانات التجارب…';
  try {
    const payload = await request('/api/admin', { method: 'DELETE', headers: authHeaders(true), body: JSON.stringify({ confirmation: 'DELETE-ALL-GIVEAWAY-DATA' }) });
    await loadEntries();
    message.textContent = `تم مسح ${payload.deletedEntries || 0} مشاركة وإعادة النظام إلى البداية.`;
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
