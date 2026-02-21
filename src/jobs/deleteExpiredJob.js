import { config, validateFetchEnv } from '../config.js';
import { logError, logInfo, logWarn } from '../lib/logger.js';
import { getExpiredPending, markDeleteFailed, markDeleted } from '../repositories/newsRepository.js';
import { deleteTelegramMessage } from '../services/telegram.js';

async function run() {
  validateFetchEnv();
  logInfo('Delete-expired job started');

  const records = await getExpiredPending(100);
  logInfo('Found expired pending records', { count: records.length });

  let deletedCount = 0;

  for (const record of records) {
    try {
      await deleteTelegramMessage({
        botToken: config.telegramBotToken,
        chatId: record.targetChatId,
        messageId: record.targetMessageId,
      });
      await markDeleted(record.id);
      deletedCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await markDeleteFailed(record.id, message);
      logWarn('Delete failed for message', { id: record.id, error: message });
    }
  }

  logInfo('Delete-expired job completed', { deletedCount });
}

run().catch((error) => {
  logError('Delete-expired job crashed', error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});

