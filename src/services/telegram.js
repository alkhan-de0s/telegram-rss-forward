import { truncate } from '../lib/utils.js';

async function callTelegramApi(botToken, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      const details = parsed?.description ? ` - ${parsed.description}` : '';
      throw new Error(`Telegram API HTTP ${response.status}${details}`);
    } catch {
      throw new Error(`Telegram API HTTP ${response.status} - ${raw.slice(0, 300)}`);
    }
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || 'unknown error'}`);
  }

  return data.result;
}

export async function sendNewsMessage({ botToken, chatId, text, sourceUrl, preview = true }) {
  const combined = `${truncate(text, 3500)}\n\n🔗 ${sourceUrl}`.trim();
  const result = await callTelegramApi(botToken, 'sendMessage', {
    chat_id: chatId,
    text: combined,
    disable_web_page_preview: !preview,
  });
  return result;
}

export async function deleteTelegramMessage({ botToken, chatId, messageId }) {
  return callTelegramApi(botToken, 'deleteMessage', {
    chat_id: chatId,
    message_id: messageId,
  });
}

