const { timingSafeEqual } = require('crypto');
const { db } = require('./_firebase');
const { FieldValue } = require('firebase-admin/firestore');

const CAMPAIGN_ID = 'canva-open-day-2026';
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 5000;

function authorized(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const expected = String(process.env.GIVEAWAY_ADMIN_TOKEN || '');
  if (!token || !expected) return false;
  const suppliedBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function validLimit(value) {
  return Number.isInteger(value) && value >= 1 && value <= MAX_LIMIT;
}

function serializeEntry(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    submittedAt: data.submittedAt?.toDate?.().toISOString() || null,
    activatedAt: data.activatedAt?.toDate?.().toISOString() || null,
  };
}

async function deleteCollection(name) {
  let deleted = 0;
  while (true) {
    const snapshot = await db.collection(name).limit(400).get();
    if (snapshot.empty) return deleted;
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ message: 'Unauthorized.' });

  try {
    const campaignRef = db.collection('campaigns').doc(CAMPAIGN_ID);

    if (req.method === 'GET') {
      const [snapshot, campaign] = await Promise.all([
        db.collection('canvaGiveawayEntries').orderBy('submittedAt', 'desc').limit(1000).get(),
        campaignRef.get(),
      ]);
      const campaignData = campaign.data() || {};
      return res.status(200).json({
        entries: snapshot.docs.map(serializeEntry),
        campaign: {
          claimed: Math.max(0, Number(campaignData.claimed || 0)),
          limit: validLimit(Number(campaignData.limit)) ? Number(campaignData.limit) : DEFAULT_LIMIT,
          cycle: Math.max(1, Number(campaignData.cycle || 1)),
          active: campaignData.active !== false,
        },
      });
    }

    if (req.method === 'PATCH') {
      if (req.body?.action === 'setLimit') {
        const limit = Number(req.body.limit);
        if (!validLimit(limit)) return res.status(400).json({ message: `Limit must be between 1 and ${MAX_LIMIT}.` });
        const campaign = await campaignRef.get();
        const claimed = Math.max(0, Number(campaign.data()?.claimed || 0));
        await campaignRef.set({ limit, active: claimed < limit, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return res.status(200).json({ ok: true, limit });
      }

      const id = String(req.body?.id || '');
      if (!/^[a-f0-9]{40}$/.test(id) || typeof req.body?.activated !== 'boolean') {
        return res.status(400).json({ message: 'Invalid update.' });
      }
      await db.collection('canvaGiveawayEntries').doc(id).update({
        activated: req.body.activated,
        activatedAt: req.body.activated ? FieldValue.serverTimestamp() : null,
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      if (req.body?.action !== 'resetCounter' || req.body?.confirmation !== 'RESET-COUNTER') {
        return res.status(400).json({ message: 'Invalid reset confirmation.' });
      }
      const result = await db.runTransaction(async (transaction) => {
        const campaign = await transaction.get(campaignRef);
        const data = campaign.data() || {};
        const cycle = Math.max(1, Number(data.cycle || 1)) + 1;
        const limit = validLimit(Number(data.limit)) ? Number(data.limit) : DEFAULT_LIMIT;
        transaction.set(campaignRef, {
          claimed: 0,
          limit,
          cycle,
          active: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        return { cycle, limit };
      });
      return res.status(200).json({ ok: true, ...result });
    }

    if (req.method === 'DELETE') {
      if (req.body?.confirmation !== 'DELETE-ALL-GIVEAWAY-DATA') {
        return res.status(400).json({ message: 'Invalid delete confirmation.' });
      }
      const [deletedEntries, deletedGuards] = await Promise.all([
        deleteCollection('canvaGiveawayEntries'),
        deleteCollection('canvaGiveawayGuards'),
      ]);
      await campaignRef.set({
        claimed: 0,
        limit: DEFAULT_LIMIT,
        cycle: 1,
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return res.status(200).json({ ok: true, deletedEntries, deletedGuards });
    }

    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ message: 'Admin request failed.' });
  }
};
