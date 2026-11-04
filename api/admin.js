const { admin, db } = require('./_firebase');
const { timingSafeEqual } = require('crypto');

const CAMPAIGN_ID = 'canva-open-day-2026';

function authorized(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const expected = String(process.env.GIVEAWAY_ADMIN_TOKEN || '');
  if (!token || !expected) return false;
  const suppliedBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ message: 'Unauthorized.' });
  try {
    if (req.method === 'GET') {
      const snapshot = await db.collection('canvaGiveawayEntries').orderBy('rank', 'asc').limit(15).get();
      return res.status(200).json({ entries: snapshot.docs.map((doc) => { const data = doc.data(); return { id: doc.id, ...data, submittedAt: data.submittedAt?.toDate?.().toISOString() || null }; }) });
    }
    if (req.method === 'PATCH') {
      const id = String(req.body?.id || '');
      if (!/^[a-f0-9]{40}$/.test(id) || typeof req.body?.activated !== 'boolean') return res.status(400).json({ message: 'Invalid update.' });
      await db.collection('canvaGiveawayEntries').doc(id).update({ activated: req.body.activated, activatedAt: req.body.activated ? admin.firestore.FieldValue.serverTimestamp() : null });
      return res.status(200).json({ ok: true });
    }
    if (req.method === 'DELETE') {
      if (req.body?.confirmation !== 'RESET-CANVA-GIVEAWAY') {
        return res.status(400).json({ message: 'Invalid reset confirmation.' });
      }

      const snapshot = await db.collection('canvaGiveawayEntries').get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      batch.set(db.collection('campaigns').doc(CAMPAIGN_ID), {
        claimed: 0,
        limit: 15,
        active: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await batch.commit();

      return res.status(200).json({ ok: true, deleted: snapshot.size });
    }
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Admin request failed.' });
  }
};
