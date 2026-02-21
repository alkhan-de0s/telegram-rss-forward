import dotenv from 'dotenv';

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  targetChatId: process.env.TARGET_CHAT_ID,
  sourceChannelUsername: process.env.SOURCE_CHANNEL_USERNAME,
  fetchLimit: toNumber(process.env.FETCH_LIMIT, 10),
  translateEnabled: toBoolean(process.env.TRANSLATE_ENABLED, true),
  deeplApiKey: process.env.DEEPL_API_KEY,
  mymemoryEmail: process.env.MYMEMORY_EMAIL,
  deleteAfterHours: toNumber(process.env.DELETE_AFTER_HOURS, 12),
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 15000),
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
};

export function validateFetchEnv() {
  const missing = [];
  if (!config.telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');
  if (!config.targetChatId) missing.push('TARGET_CHAT_ID');
  if (!config.sourceChannelUsername) missing.push('SOURCE_CHANNEL_USERNAME');
  if (!config.firebaseServiceAccountJson && !config.firebaseServiceAccountPath) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

