const login = document.getElementById('admin-login');
const tokenInput = document.getElementById('admin-token');
const message = document.getElementById('admin-message');
const content = document.getElementById('admin-content');
const tbody = document.getElementById('entries');
let entries = [];

tokenInput.value = sessionStorage.getItem('unibyteGiveawayAdminToken') || '';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

async function loadEntries() {
  const token = tokenInput.value.trim();
  if (!token) return;
  message.textContent = 'Loading…';
  const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
  const payload = await response.json();
  if (!response.ok) { content.hidden = true; message.textContent = payload.message || 'Could not open dashboard.'; return; }
  sessionStorage.setItem('unibyteGiveawayAdminToken', token);
  entries = payload.entries || [];
  message.textContent = '';
  content.hidden = false;
  document.getElementById('claimed').textContent = entries.length;
  document.getElementById('activated').textContent = entries.filter((entry) => entry.activated).length;
  document.getElementById('pending').textContent = entries.filter((entry) => !entry.activated).length;
  tbody.innerHTML = entries.map((entry) => `<tr><td>${entry.rank}</td><td><strong>${escapeHtml(entry.fullName)}</strong></td><td><a href="mailto:${encodeURIComponent(entry.email)}">${escapeHtml(entry.email)}</a></td><td>${escapeHtml(entry.studyYear)}</td><td>${entry.heardAboutUnibyte === 'yes' ? 'Yes' : 'No'}</td><td>${escapeHtml(entry.willAttend)}</td><td>${escapeHtml(entry.interest)}</td><td>${entry.score}/3</td><td><button class="activation ${entry.activated ? 'yes' : 'no'}" data-id="${entry.id}" data-active="${entry.activated}" type="button">${entry.activated ? 'Activated' : 'Mark activated'}</button></td></tr>`).join('');
  document.querySelectorAll('.activation').forEach((button) => button.addEventListener('click', () => updateActivation(button)));
}

async function updateActivation(button) {
  button.disabled = true;
  const response = await fetch('/api/admin', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenInput.value.trim()}` }, body: JSON.stringify({ id: button.dataset.id, activated: button.dataset.active !== 'true' }) });
  if (response.ok) await loadEntries(); else { button.disabled = false; message.textContent = 'Update failed.'; }
}

login.addEventListener('submit', (event) => { event.preventDefault(); loadEntries(); });
document.getElementById('refresh').addEventListener('click', loadEntries);
document.getElementById('export').addEventListener('click', () => {
  if (!entries.length) return;
  const rows = [['Rank', 'Name', 'Canva email', 'Year', 'Knows Unibyte', 'Attendance', 'Interest', 'Score', 'Activated'], ...entries.map((entry) => [entry.rank, entry.fullName, entry.email, entry.studyYear, entry.heardAboutUnibyte, entry.willAttend, entry.interest, `${entry.score}/3`, entry.activated ? 'Yes' : 'No'])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = 'unibyte-canva-giveaway.csv'; link.click(); URL.revokeObjectURL(url);
});

document.getElementById('reset-data').addEventListener('click', async () => {
  const token = tokenInput.value.trim();
  if (!token) {
    message.textContent = 'أدخل Admin token أولًا.';
    tokenInput.focus();
    return;
  }

  const confirmation = window.prompt('هذا يمسح كل المشاركات ويعيد العدد إلى 0. اكتب RESET للتأكيد:');
  if (confirmation !== 'RESET') {
    message.textContent = confirmation === null ? 'تم إلغاء المسح.' : 'كلمة التأكيد غير صحيحة.';
    return;
  }

  const button = document.getElementById('reset-data');
  button.disabled = true;
  message.textContent = 'جاري مسح بيانات التجارب…';
  try {
    const response = await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ confirmation: 'RESET-CANVA-GIVEAWAY' }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'تعذر مسح البيانات.');
    message.textContent = `تم مسح ${payload.deleted || 0} مشاركة وإعادة العدد إلى 0.`;
    await loadEntries();
  } catch (error) {
    message.textContent = error.message || 'تعذر مسح البيانات.';
  } finally {
    button.disabled = false;
  }
});

if (tokenInput.value) loadEntries();
