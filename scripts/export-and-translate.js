#!/usr/bin/env node
/**
 * Export posts from Telegram and translate to target languages
 *
 * Usage:
 *   node scripts/export-and-translate.js --channel @koztv
 *
 * Environment variables:
 *   TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION
 *   TELEGRAM_CHANNEL - default channel
 *   LLM_API_KEY, LLM_API_URL, LLM_MODEL - for translation
 *   TARGET_LANGS - comma-separated list (default: en)
 *   KEEP_ORIGINAL - true/false (default: false)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportAndTranslate } from 'koztv-blog-tools';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
}

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const CHANNEL = getArg('channel') || process.env.TELEGRAM_CHANNEL || '@koztv';
const LIMIT = parseInt(getArg('limit') || '0', 10);
const TARGET_LANGS = (getArg('langs') || process.env.TARGET_LANGS || 'en').split(',').map(s => s.trim());
const KEEP_ORIGINAL = getArg('keep-original') === 'true' || process.env.KEEP_ORIGINAL === 'true';

const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'posts');
const MEDIA_DIR = path.join(__dirname, '..', 'public', 'media');
const SESSION_FILE = path.join(__dirname, '..', '.telegram-session');
const LOG_FILE = path.join(__dirname, '..', '.processed-posts.json');

// Credentials
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_API_URL = process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4';
const LLM_MODEL = process.env.LLM_MODEL || 'GLM-4.7-Flash';

// Load session
let session = process.env.TELEGRAM_SESSION || '';
if (!session && fs.existsSync(SESSION_FILE)) {
  session = fs.readFileSync(SESSION_FILE, 'utf-8').trim();
}

// Load processed log
function loadLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveLog(log) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

async function main() {
  console.log('Telegram Export + Translate');
  console.log('============================');
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Target languages: ${TARGET_LANGS.join(', ')}`);
  console.log(`Keep original: ${KEEP_ORIGINAL}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  console.log('');

  if (!API_ID || !API_HASH) {
    console.error('Error: TELEGRAM_API_ID and TELEGRAM_API_HASH required');
    process.exit(1);
  }

  const processedLog = loadLog();

  const result = await exportAndTranslate({
    apiId: API_ID,
    apiHash: API_HASH,
    session,
    channel: CHANNEL,
    outputDir: OUTPUT_DIR,
    mediaDir: MEDIA_DIR,
    limit: LIMIT || undefined,
    downloadMedia: true,

    translate: LLM_API_KEY ? {
      apiKey: LLM_API_KEY,
      apiUrl: LLM_API_URL,
      model: LLM_MODEL,
      sourceLang: 'ru',
      targetLangs: TARGET_LANGS,
      keepOriginal: KEEP_ORIGINAL,
    } : undefined,

    onProgress: (msg) => console.log(msg),
    onSession: (s) => {
      fs.writeFileSync(SESSION_FILE, s);
      console.log('Session saved');
    },
    processedLog,
    onProcessedLog: saveLog,
  });

  console.log('\n============================');
  console.log(`Done! Exported: ${result.exported}, Processed: ${result.processed}, Skipped: ${result.skipped}`);
}

main().catch(console.error);
