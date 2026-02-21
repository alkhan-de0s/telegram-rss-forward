# Telegram Public Channel -> Group News Forwarder (Node.js)

Automates fetching news posts from a public Telegram web channel (`t.me/s/<channel>`), optionally translates RU/EN content to Azerbaijani, posts into your target Telegram group, stores metadata in Firestore, and deletes posted messages after a configured time.

## 1) Features

- Public channel scraping from `t.me/s/<channel>` (no MTProto session)
- Telegram Bot API posting with link preview
- Translation pipeline (smart routing):
  - Short chunks (`<= 480` chars): MyMemory first
  - Long chunks (`> 480` chars): DeepL first
  - Fallback chain: DeepL/MyMemory -> original text
- Provider label appended to each posted message:
  - `Tercume etdi: mymemory` / `deepl` / `original`
- Firestore deduplication (`sourceChannelId + sourceMessageId`)
- Auto-delete workflow for expired posts
- GitHub Actions cron automation

## 2) Project Structure

- Main fetch/post job: [`src/jobs/fetchAndPostJob.js`](src/jobs/fetchAndPostJob.js)
- Auto-delete job: [`src/jobs/deleteExpiredJob.js`](src/jobs/deleteExpiredJob.js)
- Scraper: [`src/services/scraper.js`](src/services/scraper.js)
- Translation service: [`src/services/translation.js`](src/services/translation.js)
- Telegram API wrapper: [`src/services/telegram.js`](src/services/telegram.js)
- Firebase init: [`src/services/firebase.js`](src/services/firebase.js)
- Firestore repository: [`src/repositories/newsRepository.js`](src/repositories/newsRepository.js)
- Runtime config/env parsing: [`src/config.js`](src/config.js)
- Cron workflows:
  - [`.github/workflows/fetch-and-post.yml`](.github/workflows/fetch-and-post.yml)
  - [`.github/workflows/delete-expired.yml`](.github/workflows/delete-expired.yml)

## 3) Prerequisites

- Node.js 20+
- A Telegram bot token
- Target Telegram group where bot is admin
- Firebase project with Firestore enabled
- (Optional but recommended) DeepL API key

## 4) Environment Variables

Required:

- `TELEGRAM_BOT_TOKEN`
- `TARGET_CHAT_ID`
- `SOURCE_CHANNEL_USERNAME`
- `FIREBASE_SERVICE_ACCOUNT_JSON` **or** `FIREBASE_SERVICE_ACCOUNT_PATH`

Recommended:

- `DEEPL_API_KEY`
- `MYMEMORY_EMAIL`

Optional:

- `FETCH_LIMIT` (default: `10`)
- `TRANSLATE_ENABLED` (default: `true`)
- `DELETE_AFTER_HOURS` (default: `12`)
- `REQUEST_TIMEOUT_MS` (default: `15000`)

## 5) Step-by-Step Setup (0 -> Production)

### Step 0 — Clone & Install

```bash
npm install
```

### Step 1 — Create Telegram Bot

1. Open `@BotFather`
2. Run `/newbot`
3. Save bot token as `TELEGRAM_BOT_TOKEN`

### Step 2 — Prepare Target Group

1. Add bot to target group
2. Promote bot to admin with `Send messages` and `Delete messages`
3. Get `TARGET_CHAT_ID` (supergroups usually start with `-100...`)

### Step 3 — Firebase / Firestore

1. Create/select Firebase project
2. Enable Firestore (Native mode)
3. Generate service account JSON
4. Use either:
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (single-line JSON in secret), or
   - `FIREBASE_SERVICE_ACCOUNT_PATH` (local file path)

### Step 4 — Configure `.env` (Local)

Create/update [`.env`](.env) with your values.

### Step 5 — Local Test

```bash
npm run job:fetch
npm run job:delete
```

Check Telegram output and Firestore records.

### Step 6 — GitHub Repository

1. Push code to GitHub
2. Add repository secrets:
   - `TELEGRAM_BOT_TOKEN`
   - `TARGET_CHAT_ID`
   - `SOURCE_CHANNEL_USERNAME`
   - `FETCH_LIMIT`
   - `TRANSLATE_ENABLED`
   - `DEEPL_API_KEY`
   - `MYMEMORY_EMAIL`
   - `DELETE_AFTER_HOURS`
   - `REQUEST_TIMEOUT_MS`
   - `FIREBASE_SERVICE_ACCOUNT_JSON`

### Step 7 — Run Workflows Manually Once

From GitHub Actions:

1. Run [`.github/workflows/fetch-and-post.yml`](.github/workflows/fetch-and-post.yml)
2. Run [`.github/workflows/delete-expired.yml`](.github/workflows/delete-expired.yml)

### Step 8 — Let Cron Run Automatically

- Fetch workflow runs by cron
- Delete workflow runs by cron
- Monitor Actions logs and Firestore states

## 6) Security Checklist

- Never commit real secrets
- Ensure [`.gitignore`](.gitignore) excludes service-account files
- Rotate leaked tokens/keys immediately
- Prefer GitHub repository secrets for production

---

# Telegram Public Kanal -> Qrupa Xəbər Ötürücü (Node.js)

Bu layihə açıq Telegram kanalını (`t.me/s/<kanal>`) oxuyur, RU/EN mətnləri Azərbaycan dilinə çevirə bilir, hədəf qrupa bot ilə göndərir, Firestore-da qeyd aparır və müəyyən vaxtdan sonra mesajları silir.

## 1) İmkanlar

- `t.me/s/<kanal>` üzərindən scraping (MTProto olmadan)
- Telegram Bot API ilə preview-li paylaşım
- Ağıllı çeviri marşrutu:
  - `<= 480` simvol: əvvəl MyMemory
  - `> 480` simvol: əvvəl DeepL
  - Uğursuz olarsa fallback -> orijinal mətn
- Hər mesajın sonunda provider qeyd olunur:
  - `Tercume etdi: mymemory` / `deepl` / `original`
- Firestore deduplikasiya
- Vaxtı dolan mesajların avtomatik silinməsi
- GitHub Actions cron ilə avtomatlaşdırma

## 2) 0-dan sona addım-addım qurulum

### Addım 0 — Qurulum

```bash
npm install
```

### Addım 1 — Telegram bot yarat

1. `@BotFather` aç
2. `/newbot` et
3. Token-i `TELEGRAM_BOT_TOKEN` kimi saxla

### Addım 2 — Hədəf qrupu hazırla

1. Botu qrupa əlavə et
2. Admin et (`Send messages`, `Delete messages`)
3. `TARGET_CHAT_ID` götür (`-100...` formatı ola bilər)

### Addım 3 — Firebase/Firestore hazırla

1. Firebase project yarat/seç
2. Firestore-u aktiv et
3. Service account JSON yarat
4. Lokalda ya path ilə, GitHub-da isə secret ilə istifadə et

### Addım 4 — `.env` doldur

Lokal dəyərləri [`.env`](.env) içində tamamla.

### Addım 5 — Lokal test

```bash
npm run job:fetch
npm run job:delete
```

### Addım 6 — GitHub secrets əlavə et

Repo -> Settings -> Secrets and variables -> Actions:

- `TELEGRAM_BOT_TOKEN`
- `TARGET_CHAT_ID`
- `SOURCE_CHANNEL_USERNAME`
- `FETCH_LIMIT`
- `TRANSLATE_ENABLED`
- `DEEPL_API_KEY`
- `MYMEMORY_EMAIL`
- `DELETE_AFTER_HOURS`
- `REQUEST_TIMEOUT_MS`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

### Addım 7 — Workflow-ları 1 dəfə manual işə sal

1. [`.github/workflows/fetch-and-post.yml`](.github/workflows/fetch-and-post.yml)
2. [`.github/workflows/delete-expired.yml`](.github/workflows/delete-expired.yml)

### Addım 8 — Avtomatik rejim

- Cron tetikləri ilə öz-özünə işləyəcək.
- Actions log və Firestore statuslarını periodik yoxla.

## 3) Təhlükəsizlik qeydləri

- Secret faylları repoya push etmə
- [`.gitignore`](.gitignore) qaydalarını qoruyun
- Sızma olduqda token/key-ləri dərhal yenilə

---

## IMPORTANT DISCLAIMER

This project is provided **for educational purposes only**.

Bu layihə **yalnız tədris (educational) məqsədləri üçün** təqdim olunur.
