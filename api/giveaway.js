const { createHash } = require('crypto');
const { admin, db } = require('./_firebase');

const CAMPAIGN_ID = 'canva-open-day-2026';
const LIMIT = 15;
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
  res.status(status).setHeader('Cache-Control', 'no-store').json(data);
}

function emailId(email) {
  return createHash('sha256').update(email).digest('hex').slice(0, 40);
}

function validBody(body) {
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || '').trim();
  const answers = Array.isArray(body.quizAnswers) ? body.quizAnswers : [];
  return fullName.length >= 2 && fullName.length <= 80
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && Object.entries(VALID).every(([key, values]) => values.has(String(body[key] || '')))
    && answers.length === 3
    && answers.every((answer) => CORRECT[answer.questionId] && typeof answer.answer === 'string');
}

module.exports = async function handler(req, res) {
  try {
    const campaignRef = db.collection('campaigns').doc(CAMPAIGN_ID);
    if (req.method === 'GET') {
      const snapshot = await campaignRef.get();
      const claimed = Math.min(Number(snapshot.data()?.claimed || 0), LIMIT);
      return send(res, 200, { limit: LIMIT, claimed, remaining: Math.max(0, LIMIT - claimed), soldOut: claimed >= LIMIT });
    }

    if (req.method !== 'POST') return send(res, 405, { message: 'Method not allowed.' });
    if (req.body?.website) return send(res, 400, { message: 'Invalid submission.' });
    if (Number(req.body?.startedAt) && Date.now() - Number(req.body.startedAt) < 8000) return send(res, 429, { message: 'خذ وقتك في الإجابة ثم حاول مجددًا.' });
    if (!validBody(req.body || {})) return send(res, 400, { message: 'راجع الإجابات والإيميل ثم حاول مجددًا.' });

    const email = String(req.body.email).trim().toLowerCase();
    const entryRef = db.collection('canvaGiveawayEntries').doc(emailId(email));
    const result = await db.runTransaction(async (transaction) => {
      const campaign = await transaction.get(campaignRef);
      const existing = await transaction.get(entryRef);
      if (existing.exists) return { ok: true, alreadySubmitted: true, winner: true, rank: existing.data().rank };
      const claimed = Number(campaign.data()?.claimed || 0);
      if (claimed >= LIMIT) return { ok: false, soldOut: true };
      const rank = claimed + 1;
      const answers = req.body.quizAnswers.map((answer) => ({ questionId: answer.questionId, answer: answer.answer, correct: CORRECT[answer.questionId] === answer.answer }));
      transaction.set(entryRef, {
        campaignId: CAMPAIGN_ID,
        fullName: String(req.body.fullName).trim(), email,
        studyYear: req.body.studyYear,
        heardAboutUnibyte: req.body.heardAboutUnibyte,
        willAttend: req.body.willAttend,
        discoverySource: req.body.discoverySource,
        interest: req.body.interest,
        preferredActivity: req.body.preferredActivity,
        quizAnswers: answers,
        score: answers.filter((answer) => answer.correct).length,
        winner: true, rank, activated: false,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(campaignRef, { claimed: rank, limit: LIMIT, active: rank < LIMIT, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      return { ok: true, winner: true, rank };
    });
    return send(res, result.soldOut ? 409 : 200, result);
  } catch (error) {
    console.error(error);
    return send(res, 500, { message: process.env.FIREBASE_SERVICE_ACCOUNT ? 'حدث خطأ. حاول مرة أخرى.' : 'ربط Firebase غير مكتمل بعد.' });
  }
};
