#!/usr/bin/env node
/**
 * Import posts from Telegram export (tg-corpus) with translation to English
 *
 * Usage:
 *   GLM_API_KEY=xxx node scripts/import-telegram.js --source ../tg-corpus/export/posts
 *   node scripts/import-telegram.js --source ../staskoz-site/content/posts --limit 5
 */

const fs = require('fs');
const path = require('path');
const {
  parsePost,
  cleanContent,
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

const SOURCE_DIR = getArg('source') || '../tg-corpus/export/posts';
const LIMIT = parseInt(getArg('limit') || '0', 10);
const DRY_RUN = args.includes('--dry-run');
const SKIP_EXISTING = !args.includes('--force');

const OUTPUT_DIR = path.join(__dirname, '..', 'content', 'posts');
const TRANSLATED_LOG = path.join(__dirname, '..', '.translated-posts.json');

// Load config from environment
const API_KEY = process.env.LLM_API_KEY;
const API_URL = process.env.LLM_API_URL || 'https://open.bigmodel.cn/api/paas/v4';
const MODEL = process.env.LLM_MODEL || 'GLM-4.7-Flash';

if (!API_KEY) {
  console.error('Error: LLM_API_KEY environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  LLM_API_KEY=xxx node scripts/import-telegram.js --source ./path/to/posts');
  console.error('');
  console.error('Optional env vars:');
  console.error('  LLM_API_URL  - API endpoint (default: https://open.bigmodel.cn/api/paas/v4)');
  console.error('  LLM_MODEL    - Model name (default: GLM-4.7-Flash)');
  console.error('');
  console.error('Examples:');
  console.error('  # Zhipu GLM');
  console.error('  LLM_API_KEY=xxx LLM_MODEL=GLM-4.7-Flash node scripts/import-telegram.js --source ./posts');
  console.error('');
  console.error('  # OpenAI');
  console.error('  LLM_API_KEY=sk-xxx LLM_API_URL=https://api.openai.com/v1 LLM_MODEL=gpt-4o-mini node scripts/import-telegram.js --source ./posts');
  process.exit(1);
}

// Load list of already translated posts
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

// Clean content for translation (remove attachments section, etc.)
function prepareContent(text) {
  return text
    .replace(/##\s*Attachments\n(?:- [^\n]+\n?)*/g, '')
    .replace(/- media\/\d+\/[^\n]+/g, '')
    .replace(/#\w+@\w+/g, '')
    .trim();
}

// Copy media files and update references
function processMedia(content, sourceDir, targetDir) {
  const mediaRegex = /media\/\d+\/([^\s\n)]+)/g;
  let imageIndex = 1;
  const mediaMap = new Map();

  // Find all media references
  let match;
  while ((match = mediaRegex.exec(content)) !== null) {
    const fullPath = match[0];
    const filename = match[1];

    if (!mediaMap.has(fullPath)) {
      const ext = path.extname(filename).toLowerCase() || '.jpg';
      const newName = `image${imageIndex}${ext}`;
      mediaMap.set(fullPath, newName);
      imageIndex++;

      // Copy file if exists - check multiple possible locations
      const possiblePaths = [
        path.join(sourceDir, '..', fullPath),           // ../media/000001/file.jpg
        path.join(sourceDir, '..', '..', 'public', fullPath), // ../../public/media/000001/file.jpg
        path.join(sourceDir, '..', 'public', fullPath), // ../public/media/000001/file.jpg
      ];
      const sourcePath = possiblePaths.find(p => fs.existsSync(p));
      const targetPath = path.join(targetDir, newName);

      if (sourcePath) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`  Copied: ${newName}`);
      } else {
        console.log(`  Warning: Media not found: ${fullPath}`);
      }
    }
  }

  // Update content with new paths
  let newContent = content;
  for (const [oldPath, newName] of mediaMap) {
    newContent = newContent.replace(new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newName);
  }

  return newContent;
}

async function importPost(filePath, translatedLog) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const post = parsePost(fileContent);

  if (!post.content && !post.has_media) {
    console.log(`  Skipping empty post: ${filePath}`);
    return null;
  }

  // Check if already translated
  const postId = `${post.channel_username}-${post.msg_id}`;
  if (SKIP_EXISTING && translatedLog[postId]) {
    console.log(`  Already translated: ${postId} → ${translatedLog[postId].slug}`);
    return null;
  }

  console.log(`\nProcessing: ${path.basename(filePath)}`);
  console.log(`  Original: ${post.content.substring(0, 50)}...`);

  // Prepare content for translation
  const cleanedContent = prepareContent(post.content);

  // Extract title (first line)
  const lines = cleanedContent.split('\n').filter(l => l.trim());
  const originalTitle = lines[0]?.replace(/[#@\[\]*]/g, '').trim() || 'Untitled';
  const bodyContent = lines.slice(1).join('\n').trim();

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would translate: "${originalTitle}"`);
    return null;
  }

  // Translation options
  const translateOpts = {
    apiKey: API_KEY,
    apiUrl: API_URL,
    model: MODEL,
    sourceLang: 'ru',
    targetLang: 'en',
  };

  // Translate title and content
  console.log(`  Translating title: "${originalTitle}"`);
  const translatedTitleText = await translateTitle(originalTitle, translateOpts);
  console.log(`  → "${translatedTitleText}"`);

  let translatedBody = '';
  if (bodyContent) {
    console.log(`  Translating body (${bodyContent.length} chars)...`);
    translatedBody = await translateContent(bodyContent, translateOpts);
  }

  // Generate slug from English title
  const slug = generateEnglishSlug(translatedTitleText);
  console.log(`  Slug: ${slug}`);

  // Create output directory
  const postDir = path.join(OUTPUT_DIR, slug);
  if (fs.existsSync(postDir)) {
    if (SKIP_EXISTING) {
      console.log(`  Directory exists, skipping: ${slug}`);
      return null;
    }
  } else {
    fs.mkdirSync(postDir, { recursive: true });
  }

  // Process media files
  const contentWithMedia = processMedia(post.content, path.dirname(filePath), postDir);

  // Update translated body with new image paths
  let finalBody = translatedBody;
  const mediaRegex = /image\d+\.(jpg|jpeg|png|gif|webp|mp4|mov)/gi;
  const mediaFiles = contentWithMedia.match(mediaRegex) || [];

  // Add images at the end if they exist
  if (mediaFiles.length > 0) {
    const imageMarkdown = mediaFiles
      .filter(f => !f.match(/\.(mp4|mov)$/i))
      .map(f => `![](${f})`)
      .join('\n\n');
    if (imageMarkdown) {
      finalBody = finalBody + '\n\n' + imageMarkdown;
    }
  }

  // Format date
  const date = post.date ? new Date(post.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  // Create markdown file
  const markdown = `---
title: "${translatedTitleText.replace(/"/g, '\\"')}"
date: ${date}
original_link: "${post.link || ''}"
---

${finalBody}
`;

  fs.writeFileSync(path.join(postDir, 'index.md'), markdown);
  console.log(`  Created: content/posts/${slug}/index.md`);

  // Update translated log
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
  console.log('Telegram Post Importer with Translation');
  console.log('=======================================');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Skip existing: ${SKIP_EXISTING}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  console.log('');

  // Check source directory
  const sourcePath = path.resolve(SOURCE_DIR);
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source directory not found: ${sourcePath}`);
    process.exit(1);
  }

  // Get list of markdown files
  let files = fs.readdirSync(sourcePath)
    .filter(f => f.endsWith('.md'))
    .sort((a, b) => b.localeCompare(a)); // Newest first

  if (LIMIT) {
    files = files.slice(0, LIMIT);
  }

  console.log(`Found ${files.length} posts to process\n`);

  // Load translation log
  const translatedLog = loadTranslatedLog();

  // Process each file
  let imported = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const result = await importPost(path.join(sourcePath, file), translatedLog);
      if (result) {
        imported++;
        // Save log after each successful import
        saveTranslatedLog(translatedLog);
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
      skipped++;
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=======================================');
  console.log(`Done! Imported: ${imported}, Skipped: ${skipped}`);
}

main().catch(console.error);
