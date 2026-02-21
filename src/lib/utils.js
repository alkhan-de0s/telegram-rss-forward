import crypto from 'node:crypto';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex');
}

export function truncate(text, maxLength = 4000) {
  if (!text) return '';
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

export function detectSourceLanguage(text) {
  const value = (text || '').trim();
  if (!value) return 'unknown';

  const cyrillic = (value.match(/[\u0400-\u04FF]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;

  if (cyrillic > 5 && cyrillic >= latin) return 'ru';
  if (latin > 5) return 'en';
  return 'unknown';
}

export function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

