#!/usr/bin/env node

/**
 * Import a remote Koz.TV post and convert it into a Markdown file with front-matter.
 *
 * Usage:
 *   npm run import -- <URL> [--slug my-slug] [--date YYYY-MM-DD]
 *
 * If --slug is omitted, it is derived from the URL path (last segment).
 * If --date is omitted, the script will try to parse it from the page (div.date).
 *
 * The script:
 *   1. Downloads the HTML with axios
 *   2. Parses the page with cheerio
 *   3. Extracts the main content inside <div class="content"> (or <article>)
 *   4. Converts HTML → Markdown using Turndown
 *   5. Writes to content/posts/<slug>/index.md with YAML front-matter
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

async function importPost(url, params = {}) {
  const slug = params.slug || deriveSlug(url);
  const destDir = path.join('content', 'posts', slug);
  const destFile = path.join(destDir, 'index.md');

  // Clean previous media files in destDir (everything except markdown files)
  if (await fs.pathExists(destDir)) {
    const existing = await fs.readdir(destDir);
    for (const f of existing) {
      if (f.toLowerCase().endsWith('.md')) continue;
      await fs.remove(path.join(destDir, f));
    }
  }

  console.log(`Fetching ${url} …`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  // Extract title
  const title = $('h1').first().text().trim() || slug;

  // Extract date (try .date element or <time>)
  let date = params.date;
  if (!date) {
    date = $('.date').first().text().trim();
    if (!date) date = $('time').first().attr('datetime');
    if (!date) date = new Date().toISOString().substring(0, 10);
  }
  // Normalize to YYYY-MM-DD if possible
  date = normalizeDate(date);

  // Extract content
  let contentHtml = $('.content').first().html();
  if (!contentHtml) {
    contentHtml = $('article').first().html();
  }
  if (!contentHtml) {
    console.error('Unable to locate main content.');
    return;
  }

  // Remove first h1 & date inside content if present
  const temp = cheerio.load(contentHtml);
  temp('h1').first().remove();
  temp('.date, time').first().remove();
  // Remove any <script> elements to keep pure HTML content
  temp('script').remove();
  // Remove social/share and meta info blocks
  temp('.sharedaddy, .post-meta, .post-navigation, .entry-footer, .author, .post-author, .wp-block-post-author').remove();
  // Also remove any element whose text begins with 'Share:'
  temp('*').each((i, el) => {
    const txt = temp(el).text().trim();
    if (txt.startsWith('Share:')) {
      temp(el).remove();
    }
  });
  // Remove empty paragraphs
  temp('p').each((i, el) => {
    if (!temp(el).text().trim()) temp(el).remove();
  });

  // Download images and rewrite src
  const imgPromises = [];
  const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  let imgCounter = 1;
  temp('img').each((i, el) => {
    let srcAttr = temp(el).attr('src');
    if (!srcAttr || srcAttr === '#' || srcAttr === ' ' || srcAttr.startsWith('data:')) {
      // try alternative attributes used by lazy loaders
      srcAttr = temp(el).attr('data-src') || temp(el).attr('data-lazy-src') || temp(el).attr('data-original');
    }
    // If still empty, try first URL from srcset
    if (!srcAttr) {
      const srcset = temp(el).attr('srcset');
      if (srcset) {
        srcAttr = srcset.split(',')[0].trim().split(' ')[0];
      }
    }
    if (!srcAttr || srcAttr.startsWith('data:')) return;
    const absUrl = srcAttr.startsWith('http') ? srcAttr : new URL(srcAttr, url).href;
    const rawName = path.basename(absUrl.split('?')[0]);
    const ext = path.extname(rawName).toLowerCase();
    if (!allowedExt.includes(ext)) return;
    const fileName = `image${imgCounter}${ext}`;
    imgCounter += 1;
    const localImgPath = path.join(destDir, fileName);
    // update src immediately to relative path
    temp(el).attr('src', fileName);
    // remove srcset / data-xxx to avoid external calls
    temp(el).removeAttr('srcset data-src data-lazy-src data-original');

    // if image is wrapped by anchor linking to bigger file
    const parent = temp(el).parent('a');
    if (parent.length) {
      let href = parent.attr('href');
      if (href && !href.startsWith('#')) {
        if (!href.startsWith('http')) href = new URL(href, url).href;
        const hrefExt = path.extname(href.split('?')[0]).toLowerCase();
        if (allowedExt.includes(hrefExt)) {
          const fullName = `image${imgCounter}_full${hrefExt}`;
          parent.attr('href', fullName);
          const fullPath = path.join(destDir, fullName);
          imgPromises.push(downloadFile(href, fullPath));
        }
      }
    }

    imgPromises.push(downloadFile(absUrl, localImgPath));
  });

  await Promise.all(imgPromises);
  // Remove style tags
  temp('style').remove();
  // Remove anchors linking to author or category pages
  temp('a').each((i, el) => {
    const href = temp(el).attr('href') || '';
    if (/\/author\//.test(href) || /\/category\//.test(href) || /\/tag\//.test(href)) {
      temp(el).remove();
    }
  });
  // Remove elements whose inner text contains '.pacman'
  temp('*').each((i, el) => {
    if (temp(el).text().includes('.pacman')) {
      temp(el).remove();
    }
  });
  // Remove empty paragraphs again after removals
  temp('p').each((i, el) => {
    if (!temp(el).text().trim()) temp(el).remove();
  });
  const cleanedHtml = temp.root().html();

  // Rewrite internal koz.tv links to local relative links
  temp('a').each((i, el) => {
    let href = temp(el).attr('href');
    if (!href || href.startsWith('#')) return;
    // Absolute or root-relative URL
    let slugMatch;
    if (/^https?:\/\/koz\.tv\//.test(href)) {
      const urlObj = new URL(href);
      slugMatch = urlObj.pathname.match(/^\/([^\/]+)\/?$/);
    } else if (href.startsWith('/')) {
      slugMatch = href.match(/^\/([^\/]+)\/?$/);
    } else {
      // relative like '../other/' or 'other/'
      slugMatch = href.match(/^(?:\.\.\/)?([^\/]+)\/?$/);
    }
    if (slugMatch) {
      const targetSlug = slugMatch[1];
      if (targetSlug === slug) return; // link to self leave as is
      const targetPath = path.join('content', 'posts', targetSlug, 'index.md');
      if (fs.existsSync(targetPath)) {
        temp(el).attr('href', `../${targetSlug}/index.html`);
      }
    }
  });

  // Convert to Markdown
  const turndown = new TurndownService({ codeBlockStyle: 'fenced' });
  const markdownBody = turndown.turndown(cleanedHtml).trim();

  // Compose Markdown with front-matter
  const md = `---\ntitle: "${escapeQuotes(title)}"\ndate: ${date}\n---\n\n${markdownBody}\n`;

  await fs.ensureDir(destDir);
  await fs.writeFile(destFile, md, 'utf-8');
  console.log(`Saved to ${destFile}`);
}

function deriveSlug(url) {
  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'post';
}

function escapeQuotes(str) {
  return str.replace(/"/g, '\\"');
}

function normalizeDate(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  // If already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = Date.parse(input);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function downloadFile(absUrl, destPath) {
  return (async () => {
    try {
      if (await fs.pathExists(destPath)) return;
      const resp = await axios.get(absUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(destPath, resp.data);
    } catch (err) {
      console.error('Image download failed', absUrl, err.message);
    }
  })();
}

// CLI wrapper
async function runCli() {
  const [, , url, ...args] = process.argv;
  if (!url) {
    console.error('Usage: npm run import -- <URL> [--slug my-slug] [--date YYYY-MM-DD]');
    process.exit(1);
  }

  const params = {};
  args.forEach((arg, idx) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      params[key] = args[idx + 1];
    }
  });

  await importPost(url, params);
}

module.exports = importPost;

if (require.main === module) {
  runCli().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 