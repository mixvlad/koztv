#!/usr/bin/env node
/**
 * Process posts from intermediate files (Step 2 only)
 * No Telegram API needed - works offline with .telegram-export/
 *
 * Usage:
 *   node scripts/process-posts.js                    # Process all
 *   node scripts/process-posts.js --force            # Force reprocess all
 *   node scripts/process-posts.js --msg 16           # Process specific message
 *   node scripts/process-posts.js --msg 16 --force   # Force reprocess specific message
 *   node scripts/process-posts.js --translate        # With translation
 */

const fs = require('fs');
const path = require('path');
const { processFromFiles } = require('koztv-blog-tools');

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
const hasFlag = (name) => args.includes(`--${name}`);

const FORCE = hasFlag('force');
const TRANSLATE = hasFlag('translate');
const MSG_ID = getArg('msg');
const TARGET_LANGS = (getArg('langs') || process.env.TARGET_LANGS || 'en').split(',').map(s => s.trim());
const KEEP_ORIGINAL = getArg('keep-original') === 'true' || process.env.KEEP_ORIGINAL === 'true';

const EXPORT_DIR = path.join(__dirname, '..', 'content', '.telegram-export');
const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'posts');

// Translation config
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_API_URL = process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4';
const LLM_MODEL = process.env.LLM_MODEL || 'GLM-4.7-Flash';

async function main() {
  console.log('Process Posts from Files');
  console.log('========================');
  console.log(`Export dir: ${EXPORT_DIR}`);
  console.log(`Output dir: ${OUTPUT_DIR}`);
  if (MSG_ID) console.log(`Message ID: ${MSG_ID}`);
  if (FORCE) console.log('Force: yes');
  if (TRANSLATE) console.log(`Translate to: ${TARGET_LANGS.join(', ')}`);
  console.log('');

  const translateConfig = TRANSLATE && LLM_API_KEY ? {
    apiKey: LLM_API_KEY,
    apiUrl: LLM_API_URL,
    model: LLM_MODEL,
    sourceLang: 'ru',
    targetLangs: TARGET_LANGS,
    keepOriginal: KEEP_ORIGINAL,
  } : undefined;

  const result = await processFromFiles({
    exportDir: EXPORT_DIR,
    outputDir: OUTPUT_DIR,
    translate: translateConfig,
    msgIds: MSG_ID ? [parseInt(MSG_ID, 10)] : undefined,
    force: FORCE,
    onProgress: (msg) => console.log(msg),
  });

  console.log('');
  console.log('========================');
  console.log(`Done! Processed: ${result.processed}, Skipped: ${result.skipped}`);
}

main().catch(console.error);
