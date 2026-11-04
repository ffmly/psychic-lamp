const { createHash } = require('crypto');
const { db } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');

const CAMPAIGN_ID = 'canva-open-day-2026';
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 5000;
const VALID = {
  studyYear: new Set(['1', '2', '3', '4', '5']),
  heardAboutUnibyte: new Set(['yes', 'no']),
  willAttend: new Set(['yes', 'maybe', 'no']),
  discoverySource: new Set(['friends', 'social', 'university', 'poster', 'other']),
  interest: new Set(['programming', 'design', 'video', 'photography', 'soft-skills']),
  preferredActivity: new Set(['workshops', 'quiz', 'projects', 'networking', 'all']),
};
const CORRECT = { html: 'HTML', cpu: 'CPU', rgb: 'RGB', undo: 'Ctrl + Z', git: 'إدارة إصدارات الكود', camera: 'فتحة العدسة' };

function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}

function hash(value) {
  return createHash('sha256').update(String(value)).digest('hex').slice(0, 40);
}

function guardHash(kind, value) {
  const salt = process.env.GIVEAWAY_FINGERPRINT_SALT || process.env.GIVEAWAY_ADMIN_TOKEN || CAMPAIGN_ID;
  return hash(`${salt}:${kind}:${String(value).trim().toLowerCase()}`);
}

function campaignLimit(data) {
  const value = Number(data?.limit);
  return Number.isInteger(value) && value >= 1 && value <= MAX_LIMIT ? value : DEFAULT_LIMIT;
}

function clientIp(req) {
  const raw = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
  return String(Array.isArray(raw) ? raw[0] : raw).split(',')[0].trim();
}

function validBody(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || '').trim();
  const deviceId = String(body.deviceId || '').trim();
  const answers = Array.isArray(body.quizAnswers) ? body.quizAnswers : [];
  return fullName.length >= 2 && fullName.length <= 80
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && /^[a-zA-Z0-9_-]{16,128}$/.test(deviceId)
    && Object.entries(VALID).every(([key, values]) => values.has(String(body[key] || '')))
    && answers.length === 3
    && answers.every((answer) => CORRECT[answer.questionId] && typeof answer.answer === 'string');
}

module.exports = async function handler(req, res) {
  try {
    const campaignRef = db.collection('campaigns').doc(CAMPAIGN_ID);
    if (req.method === 'GET') {
      const snapshot = await campaignRef.get();
      const data = snapshot.data() || {};
      const limit = campaignLimit(data);
      const claimed = Math.max(0, Number(data.claimed || 0));
      return send(res, 200, { soldOut: claimed >= limit || data.active === false });
    }

    if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed.' });
    if (req.body?.website) return send(res, 400, { message: 'Invalid submission.' });
    const startedAt = Number(req.body?.startedAt);
    const elapsed = Date.now() - startedAt;
    if (!Number.isFinite(startedAt) || elapsed < 8000 || elapsed > 60 * 60 * 1000) {
      return send(res, 429, { message: 'خذ وقتك في الإجابة ثم حاول مجددًا.' });
    }
    if (!validBody(req.body || {})) return send(res, 400, { message: 'راجع الإجابات والإيميل ثم حاول مجددًا.' });

    const email = String(req.body.email).trim().toLowerCase();
    const deviceId = String(req.body.deviceId).trim();
    const ip = clientIp(req);
    if (!ip) return send(res, 400, { message: 'تعذر التحقق من الاتصال. حاول مجددًا.' });

    const entryRef = db.collection('canvaGiveawayEntries').doc(hash(email));
    const deviceRef = db.collection('canvaGiveawayGuards').doc(`device_${guardHash('device', deviceId)}`);
    const ipRef = db.collection('canvaGiveawayGuards').doc(`ip_${guardHash('ip', ip)}`);

    const result = await db.runTransaction(async (transaction) => {
      const [campaign, existingEntry, deviceGuard, ipGuard] = await Promise.all([
        transaction.get(campaignRef),
        transaction.get(entryRef),
        transaction.get(deviceRef),
        transaction.get(ipRef),
      ]);

      if (existingEntry.exists || deviceGuard.exists || ipGuard.exists) return { ok: false, duplicate: true };

      const campaignData = campaign.data() || {};
      const limit = campaignLimit(campaignData);
      const claimed = Math.max(0, Number(campaignData.claimed || 0));
      const cycle = Math.max(1, Number(campaignData.cycle || 1));
      if (claimed >= limit || campaignData.active === false) return { ok: false, soldOut: true };

      const rank = claimed + 1;
      const answers = req.body.quizAnswers.map((answer) => ({
        questionId: answer.questionId,
        answer: answer.answer,
        correct: CORRECT[answer.questionId] === answer.answer,
      }));
      const entry = {
        campaignId: CAMPAIGN_ID,
        cycle,
        fullName: String(req.body.fullName).trim(),
        email,
        studyYear: req.body.studyYear,
        heardAboutUnibyte: req.body.heardAboutUnibyte,
        willAttend: req.body.willAttend,
        discoverySource: req.body.discoverySource,
        interest: req.body.interest,
        preferredActivity: req.body.preferredActivity,
        quizAnswers: answers,
        score: answers.filter((answer) => answer.correct).length,
        winner: true,
        rank,
        activated: false,
        deviceHash: guardHash('device', deviceId),
        ipHash: guardHash('ip', ip),
        submittedAt: FieldValue.serverTimestamp(),
      };

      transaction.create(entryRef, entry);
      transaction.create(deviceRef, { campaignId: CAMPAIGN_ID, entryId: entryRef.id, createdAt: FieldValue.serverTimestamp() });
      transaction.create(ipRef, { campaignId: CAMPAIGN_ID, entryId: entryRef.id, createdAt: FieldValue.serverTimestamp() });
      transaction.set(campaignRef, {
        claimed: rank,
        limit,
        cycle,
        active: rank < limit,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { ok: true, winner: true };
    });

    if (result.duplicate) return send(res, 409, { duplicate: true, message: 'هذا الإيميل أو الجهاز أو الاتصال شارك من قبل.' });
    return send(res, result.soldOut ? 409 : 200, result);
  } catch (error) {
    console.error('Giveaway API error:', error);
    return send(res, 500, { message: process.env.FIREBASE_SERVICE_ACCOUNT ? 'حدث خطأ. حاول مرة أخرى.' : 'ربط Firebase غير مكتمل بعد.' });
  }
};
