const admin = require('firebase-admin');

function credentialFromEnv() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured.');
  return admin.credential.cert(JSON.parse(raw));
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: credentialFromEnv() });
}

module.exports = { admin, db: admin.firestore() };
