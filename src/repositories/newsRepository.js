import { FieldValue, Timestamp, getDb } from '../services/firebase.js';

const COLLECTION = 'news_posts';

function buildDocId(sourceChannelId, sourceMessageId) {
  return `${sourceChannelId}_${sourceMessageId}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function existsBySource(sourceChannelId, sourceMessageId) {
  const db = getDb();
  const docId = buildDocId(sourceChannelId, sourceMessageId);
  const doc = await db.collection(COLLECTION).doc(docId).get();
  return doc.exists;
}

export async function savePostedNews(record) {
  const db = getDb();
  const docId = buildDocId(record.sourceChannelId, record.sourceMessageId);
  await db.collection(COLLECTION).doc(docId).set({
    ...record,
    postedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(record.expiresAt),
    deleteStatus: 'pending',
  }, { merge: true });
}

export async function getExpiredPending(limit = 50) {
  const db = getDb();
  const now = Timestamp.now();
  const snapshot = await db
    .collection(COLLECTION)
    .where('deleteStatus', '==', 'pending')
    .where('expiresAt', '<=', now)
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function markDeleted(docId) {
  const db = getDb();
  await db.collection(COLLECTION).doc(docId).set({
    deleteStatus: 'deleted',
    deletedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

export async function markDeleteFailed(docId, reason) {
  const db = getDb();
  await db.collection(COLLECTION).doc(docId).set({
    deleteStatus: 'failed',
    deleteError: String(reason || 'unknown error').slice(0, 500),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

