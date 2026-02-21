import { detectSourceLanguage } from '../lib/utils.js';

const API_URL = 'https://api.mymemory.translated.net/get';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';
const MAX_QUERY_CHARS = 480;

async function requestTranslation(text, langPair, timeoutMs = 10000, email = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const de = email ? `&de=${encodeURIComponent(email)}` : '';
    const url = `${API_URL}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}${de}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Translate request failed: ${response.status}`);
    }
    const data = await response.json();
    return data?.responseData?.translatedText?.trim() || null;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestDeeplTranslation(text, sourceLang, apiKey, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = new URLSearchParams({
      text,
      target_lang: 'AZ',
      source_lang: sourceLang.toUpperCase(),
    });

    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`DeepL request failed: ${response.status}`);
    }

    const data = await response.json();
    return data?.translations?.[0]?.text?.trim() || null;
  } finally {
    clearTimeout(timeout);
  }
}

function splitForTranslation(text, maxLen = MAX_QUERY_CHARS) {
  const value = String(text || '').trim();
  if (!value) return [];

  const parts = value.split(/\n\n+/).map((x) => x.trim()).filter(Boolean);
  const chunks = [];

  for (const part of parts) {
    if (part.length <= maxLen) {
      chunks.push(part);
      continue;
    }

    let rest = part;
    while (rest.length > maxLen) {
      const slice = rest.slice(0, maxLen);
      const lastSpace = slice.lastIndexOf(' ');
      const cut = lastSpace > 100 ? lastSpace : maxLen;
      chunks.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) chunks.push(rest);
  }

  return chunks;
}

export async function translateRuEnToAz(text, enabled, options = {}) {
  if (!enabled || !text?.trim()) {
    return { translated: text || '', usedFallback: true, sourceLang: 'unknown' };
  }

  const sourceLang = detectSourceLanguage(text);
  if (sourceLang !== 'ru' && sourceLang !== 'en') {
    return { translated: text, usedFallback: true, sourceLang };
  }

  try {
    const chunks = splitForTranslation(text);
    if (!chunks.length) {
      return { translated: text, usedFallback: true, sourceLang };
    }

    const translatedChunks = [];
    const translationProvider = [];
    for (const chunk of chunks) {
      let translatedChunk = null;
      let provider = null;

      // Rule: 480 chars and below -> MyMemory first
      if (chunk.length <= MAX_QUERY_CHARS) {
        const langPair = `${sourceLang}|az`;
        try {
          translatedChunk = await requestTranslation(
            chunk,
            langPair,
            10000,
            options?.mymemoryEmail || null,
          );
          if (translatedChunk) provider = 'mymemory';
        } catch {
          translatedChunk = null;
        }
      }

      // If long text or MyMemory failed -> DeepL
      if (!translatedChunk && options?.deeplApiKey) {
        try {
          translatedChunk = await requestDeeplTranslation(chunk, sourceLang, options.deeplApiKey);
          if (translatedChunk) provider = 'deepl';
        } catch {
          translatedChunk = null;
        }
      }

      // Last fallback provider try: MyMemory
      if (!translatedChunk) {
        const langPair = `${sourceLang}|az`;
        translatedChunk = await requestTranslation(
          chunk,
          langPair,
          10000,
          options?.mymemoryEmail || null,
        );
        if (translatedChunk) provider = 'mymemory';
      }

      if (!translatedChunk) {
        return { translated: text, usedFallback: true, sourceLang };
      }
      translatedChunks.push(translatedChunk);
      translationProvider.push(provider || 'mymemory');
    }

    const translated = translatedChunks.join('\n\n').trim();
    if (!translated) {
      return { translated: text, usedFallback: true, sourceLang };
    }
    const provider = translationProvider.includes('deepl') ? 'deepl' : 'mymemory';
    return { translated, usedFallback: false, sourceLang, provider };
  } catch {
    return { translated: text, usedFallback: true, sourceLang };
  }
}

