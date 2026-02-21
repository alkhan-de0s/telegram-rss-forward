import { load } from 'cheerio';

function absoluteUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `https://t.me${url}`;
  return url;
}

function parsePost($, postNode, username) {
  const element = $(postNode);
  const postIdRaw = element.attr('data-post') || '';
  const sourceMessageId = postIdRaw.split('/').pop();
  if (!sourceMessageId) return null;

  const textHtml = element.find('.tgme_widget_message_text').html() || '';
  const text = element.find('.tgme_widget_message_text').text().trim();
  const mediaStyle = element.find('.tgme_widget_message_photo_wrap').attr('style') || '';
  const mediaUrlMatch = mediaStyle.match(/url\('(.*?)'\)/);
  const mediaUrl = absoluteUrl(mediaUrlMatch?.[1] || null);

  const sourceUrl = `https://t.me/${username}/${sourceMessageId}`;
  const dateIso = element.find('time').attr('datetime') || null;

  return {
    sourceChannelId: username,
    sourceMessageId,
    sourceUrl,
    text,
    textHtml,
    mediaUrl,
    publishedAt: dateIso,
  };
}

export async function fetchPublicChannelPosts(username, limit = 10, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://t.me/s/${encodeURIComponent(username)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; TelegramRssBot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch channel page: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const nodes = $('.tgme_widget_message_wrap .tgme_widget_message').toArray();

    const parsed = nodes
      .map((node) => parsePost($, node, username))
      .filter(Boolean)
      .filter((post) => Boolean(post.text || post.mediaUrl));

    return parsed.slice(-Math.abs(limit));
  } finally {
    clearTimeout(timeout);
  }
}

