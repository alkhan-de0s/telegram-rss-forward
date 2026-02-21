import { config, validateFetchEnv } from '../config.js';
import { logError, logInfo, logWarn } from '../lib/logger.js';
import { sha256, sleep } from '../lib/utils.js';
import { existsBySource, savePostedNews } from '../repositories/newsRepository.js';
import { fetchPublicChannelPosts } from '../services/scraper.js';
import { sendNewsMessage } from '../services/telegram.js';
import { translateRuEnToAz } from '../services/translation.js';

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  validateFetchEnv();
  logInfo(`Fetch job started${DRY_RUN ? ' (dry-run)' : ''}`);

  const posts = await fetchPublicChannelPosts(
    config.sourceChannelUsername,
    config.fetchLimit,
    config.requestTimeoutMs,
  );

  logInfo(`Fetched posts from public page`, { count: posts.length });

  let sentCount = 0;
  let skippedCount = 0;

  for (const post of posts) {
    const exists = await existsBySource(post.sourceChannelId, post.sourceMessageId);
    if (exists) {
      skippedCount += 1;
      continue;
    }

    const translated = await translateRuEnToAz(post.text, config.translateEnabled, {
      deeplApiKey: config.deeplApiKey,
      mymemoryEmail: config.mymemoryEmail,
    });
    const translationProvider = translated.provider || (translated.usedFallback ? 'original' : 'mymemory');
    const baseText = translated.translated || post.text || post.sourceUrl;
    const finalText = `${baseText}\n\nTercume etdi: ${translationProvider}`;
    const contentHash = sha256(`${post.sourceChannelId}|${post.sourceMessageId}|${finalText}`);

    if (DRY_RUN) {
      logInfo('Dry-run post prepared', {
        sourceMessageId: post.sourceMessageId,
        sourceLang: translated.sourceLang,
        usedFallback: translated.usedFallback,
      });
      continue;
    }

    try {
      const sent = await sendNewsMessage({
        botToken: config.telegramBotToken,
        chatId: config.targetChatId,
        text: finalText,
        sourceUrl: post.sourceUrl,
        preview: true,
      });

      const expiresAt = new Date(Date.now() + config.deleteAfterHours * 60 * 60 * 1000);

      await savePostedNews({
        sourceChannelId: post.sourceChannelId,
        sourceMessageId: post.sourceMessageId,
        sourceUrl: post.sourceUrl,
        originalText: post.text || '',
        translatedText: finalText,
        sourceLang: translated.sourceLang,
        translationFallback: translated.usedFallback,
        translationProvider,
        contentHash,
        targetChatId: String(config.targetChatId),
        targetMessageId: sent.message_id,
        expiresAt,
      });

      sentCount += 1;
      await sleep(1200);
    } catch (error) {
      logWarn('Post send failed, continuing with next item', {
        sourceMessageId: post.sourceMessageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logInfo('Fetch job completed', { sentCount, skippedCount });
}

run().catch((error) => {
  logError('Fetch job crashed', error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});

