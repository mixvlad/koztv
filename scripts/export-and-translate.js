#!/usr/bin/env node
/**
 * Export posts from Telegram channel and translate to English
 *
 * Usage:
 *   node scripts/export-and-translate.js --channel @channelname --limit 5
 *
 * Environment variables (can be set in .env file):
 *   TELEGRAM_API_ID    - Telegram API ID from https://my.telegram.org
 *   TELEGRAM_API_HASH  - Telegram API Hash
 *   TELEGRAM_SESSION   - Session string (optional, for re-auth)
 *   LLM_API_KEY        - API key for translation
 *   LLM_API_URL        - API endpoint (default: https://open.bigmodel.cn/api/paas/v4)
 *   LLM_MODEL          - Model name (default: GLM-4.7-Flash)
 */

const fs = require('fs');
const path = require('path');

// Load .env file if exists
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
const {
  exportTelegramChannel,
  parsePost,
  translateContent,
  translateTitle,
  generateEnglishSlug,
} = require('koztv-blog-tools');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const CHANNEL = getArg('channel') || process.env.TELEGRAM_CHANNEL || '@koztv';
const LIMIT = parseInt(getArg('limit') || '0', 10);
const DRY_RUN = args.includes('--dry-run');
const SKIP_EXISTING = !args.includes('--force');
const SINCE = getArg('since');

const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'posts');
const EXPORT_DIR = path.join(__dirname, '..', '.telegram-export');
const TRANSLATED_LOG = path.join(__dirname, '..', '.translated-posts.json');
const SESSION_FILE = path.join(__dirname, '..', '.telegram-session');

// Telegram credentials
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION = process.env.TELEGRAM_SESSION || '';

// Translation config
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_URL = process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4';
const LLM_MODEL = process.env.LLM_MODEL || 'GLM-4.7-Flash';

// Validate required env vars
if (!CHANNEL) {
  console.error('Error: Channel is required');
  console.error('Usage: node scripts/export-and-translate.js --channel @channelname');
  process.exit(1);
}

if (!API_ID || !API_HASH) {
  console.error('Error: TELEGRAM_API_ID and TELEGRAM_API_HASH are required');
  console.error('Get them from https://my.telegram.org');
  process.exit(1);
}

if (!LLM_API_KEY) {
  console.error('Error: LLM_API_KEY is required for translation');
  console.error('');
  console.error('Examples:');
  console.error('  # Zhipu GLM');
  console.error('  LLM_API_KEY=xxx node scripts/export-and-translate.js --channel @ch');
  console.error('');
  console.error('  # OpenAI');
  console.error('  LLM_API_KEY=sk-xxx LLM_API_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4o-mini node scripts/export-and-translate.js --channel @ch');
  process.exit(1);
}

// Load saved session
let savedSession = SESSION;
if (!savedSession && fs.existsSync(SESSION_FILE)) {
  savedSession = fs.readFileSync(SESSION_FILE, 'utf-8').trim();
}

// Load translation log
function loadTranslatedLog() {
  try {
    return JSON.parse(fs.readFileSync(TRANSLATED_LOG, 'utf-8'));
  } catch {
    return {};
  }
}

function saveTranslatedLog(log) {
  fs.writeFileSync(TRANSLATED_LOG, JSON.stringify(log, null, 2));
}

// Clean content for translation
function prepareContent(text) {
  return text
    .replace(/##\s*Attachments\n(?:- [^\n]+\n?)*/g, '')
    .replace(/- media\/\d+\/[^\n]+/g, '')
    .replace(/#\w+@\w+/g, '')
    .trim();
}

// Copy media files
function processMedia(content, sourceDir, targetDir) {
  const mediaRegex = /media\/\d+\/([^\s\n)]+)/g;
  let imageIndex = 1;
  const mediaMap = new Map();

  let match;
  while ((match = mediaRegex.exec(content)) !== null) {
    const fullPath = match[0];
    const filename = match[1];

    if (!mediaMap.has(fullPath)) {
      const ext = path.extname(filename).toLowerCase() || '.jpg';
      const newName = `image${imageIndex}${ext}`;
      mediaMap.set(fullPath, newName);
      imageIndex++;

      const sourcePath = path.join(sourceDir, fullPath);
      const targetPath = path.join(targetDir, newName);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  Copied: ${newName}`);
      } else {
        console.log(`  Warning: Media not found: ${fullPath}`);
      }
    }
  }

  let newContent = content;
  for (const [oldPath, newName] of mediaMap) {
    newContent = newContent.replace(new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newName);
  }

  return newContent;
}

async function translatePost(post, translatedLog) {
  const postId = `${post.channelUsername}-${post.msgId}`;

  if (SKIP_EXISTING && translatedLog[postId]) {
    console.log(`  Already translated: ${postId} → ${translatedLog[postId].slug}`);
    return null;
  }

  console.log(`\nProcessing: ${postId}`);
  console.log(`  Original: ${post.content.substring(0, 50)}...`);

  const cleanedContent = prepareContent(post.content);
  const lines = cleanedContent.split('\n').filter(l => l.trim());
  const originalTitle = lines[0]?.replace(/[#@[\]*]/g, '').trim() || 'Untitled';
  const bodyContent = lines.slice(1).join('\n').trim();

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would translate: "${originalTitle}"`);
    return null;
  }

  const translateOpts = {
    apiKey: LLM_API_KEY,
    apiUrl: LLM_API_URL,
    model: LLM_MODEL,
    sourceLang: 'ru',
    targetLang: 'en',
  };

  console.log(`  Translating title: "${originalTitle}"`);
  const translatedTitleText = await translateTitle(originalTitle, translateOpts);
  console.log(`  → "${translatedTitleText}"`);

  let translatedBody = '';
  if (bodyContent) {
    console.log(`  Translating body (${bodyContent.length} chars)...`);
    translatedBody = await translateContent(bodyContent, translateOpts);
  }

  const slug = generateEnglishSlug(translatedTitleText);
  console.log(`  Slug: ${slug}`);

  const postDir = path.join(OUTPUT_DIR, slug);
  if (fs.existsSync(postDir)) {
    if (SKIP_EXISTING) {
      console.log(`  Directory exists, skipping: ${slug}`);
      return null;
    }
  } else {
    fs.mkdirSync(postDir, { recursive: true });
  }

  // Process media
  const contentWithMedia = processMedia(post.content, EXPORT_DIR, postDir);
  let finalBody = translatedBody;

  const mediaRegex = /image\d+\.(jpg|jpeg|png|gif|webp|mp4|mov)/gi;
  const mediaFiles = contentWithMedia.match(mediaRegex) || [];

  if (mediaFiles.length > 0) {
    const imageMarkdown = mediaFiles
      .filter(f => !f.match(/\.(mp4|mov)$/i))
      .map(f => `![](${f})`)
      .join('\n\n');
    if (imageMarkdown) {
      finalBody = finalBody + '\n\n' + imageMarkdown;
    }
  }

  const date = post.date.toISOString().split('T')[0];

  const markdown = `---
title: "${translatedTitleText.replace(/"/g, '\\"')}"
date: ${date}
original_link: "${post.link || ''}"
---

${finalBody}
`;

  fs.writeFileSync(path.join(postDir, 'index.md'), markdown);
  console.log(`  Created: content/posts/${slug}/index.md`);

  translatedLog[postId] = {
    slug,
    originalTitle,
    translatedTitle: translatedTitleText,
    date,
    importedAt: new Date().toISOString(),
  };

  return slug;
}

async function main() {
  console.log('Telegram Export + Translate');
  console.log('===========================');
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Skip existing: ${SKIP_EXISTING}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  if (SINCE) console.log(`Since: ${SINCE}`);
  console.log('');

  // Step 1: Export from Telegram
  console.log('Step 1: Exporting from Telegram...');

  const exportResult = await exportTelegramChannel({
    apiId: API_ID,
    apiHash: API_HASH,
    session: savedSession,
    target: CHANNEL,
    outputDir: EXPORT_DIR,
    limit: LIMIT,
    since: SINCE ? new Date(SINCE) : undefined,
    downloadMedia: true,
    onProgress: (current, total, msg) => {
      process.stdout.write(`\r  ${msg} (${current}/${total})`);
    },
    onSession: (session) => {
      fs.writeFileSync(SESSION_FILE, session);
      console.log('\n  Session saved');
    },
  });

  console.log(`\n  Exported ${exportResult.posts.length} posts from "${exportResult.channelMeta.title}"`);

  // Step 2: Translate and save
  console.log('\nStep 2: Translating...');

  const translatedLog = loadTranslatedLog();
  let imported = 0;
  let skipped = 0;

  for (const post of exportResult.posts) {
    if (!post.content && !post.hasMedia) {
      skipped++;
      continue;
    }

    try {
      const result = await translatePost(post, translatedLog);
      if (result) {
        imported++;
        saveTranslatedLog(translatedLog);
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      skipped++;
    }

    // Rate limit delay
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n===========================');
  console.log(`Done! Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
