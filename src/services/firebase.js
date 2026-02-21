import admin from 'firebase-admin';
import fs from 'node:fs';
import { config } from '../config.js';

let initialized = false;

function parseServiceAccount(rawValue) {
  console.log(rawValue)
  const value = String(rawValue || '').trim();
  if (!value) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is empty');
  }

  // 1) Duz JSON
  try {
    return JSON.parse(value);
  } catch {
    // continue
  }

  // 2) Cift tirnak icinde JSON geldiyse dis tirnaklari temizle
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const unwrapped = value.slice(1, -1);
    try {
      return JSON.parse(unwrapped);
    } catch {
      // continue
    }
  }

  // 3) Base64 encode edilmis JSON destekle
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    // continue
  }

  throw new Error(
    'FIREBASE_SERVICE_ACCOUNT_JSON parse edilemedi. JSON formatini kontrol et veya base64 JSON kullan.',
  );
}

function loadServiceAccount() {
  if (config.firebaseServiceAccountPath) {
    const rawFile = fs.readFileSync(config.firebaseServiceAccountPath, 'utf8');
    return JSON.parse(rawFile);
  }

  // Lokal kolaylik: yaygin dosya konumlarini otomatik dene
  const candidatePaths = [
    './firebase-service-account.json',
    './src/services/firebase-service-account.json',
    './serviceAccount.json',
  ];

  for (const filePath of candidatePaths) {
    if (fs.existsSync(filePath)) {
      const rawFile = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rawFile);
    }
  }

  // .env icinde JSON blok cok satirli yazildiginda deger bazen sadece "{" gelir
  // Bu durumda daha anlasilir hata ver
  if (String(config.firebaseServiceAccountJson || '').trim() === '{') {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON cok satirli yazilmis gorunuyor. JSONu tek satir yaz veya firebase-service-account.json dosyasi kullan.',
    );
  }

  return parseServiceAccount(config.firebaseServiceAccountJson);
}

export function getDb() {
  if (!initialized) {
    const serviceAccount = loadServiceAccount();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
  }
  return admin.firestore();
}

export const Timestamp = admin.firestore.Timestamp;
export const FieldValue = admin.firestore.FieldValue;

