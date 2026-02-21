export function logInfo(message, data = undefined) {
  if (data !== undefined) {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, data);
    return;
  }
  console.log(`[INFO] ${new Date().toISOString()} ${message}`);
}

export function logWarn(message, data = undefined) {
  if (data !== undefined) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, data);
    return;
  }
  console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
}

export function logError(message, data = undefined) {
  if (data !== undefined) {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, data);
    return;
  }
  console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
}

