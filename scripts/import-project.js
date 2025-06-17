#!/usr/bin/env node

/*
 * Import a Koz.TV project page and convert it to local Markdown in content/projects/<slug>/index.md
 * Usage: npm run import:project -- <URL> [--slug my-slug]
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const turndown = new TurndownService({ codeBlockStyle: 'fenced' });

async function importProject(url, params = {}) {
  const slug = params.slug || deriveSlug(url);
  const destDir = path.join('content', 'projects', slug);
  await fs.ensureDir(destDir);
  const destMarkdown = path.join(destDir, 'index.md');

  console.log(`Fetching ${url}`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const title = $('h1').first().text().trim() || slug;

  // extract date
  let date = params.date || '';
  if (!date) {
    date = $('meta[property="article:published_time"]').attr('content') || '';
    if (!date) date = $('time').first().attr('datetime') || '';
    if (!date) date = $('time').first().text().trim();
  }
  date = normalizeDate(date);

  // main content inside .content or article
  let contentHtml = $('.content').first().html();
  if (!contentHtml) contentHtml = $('article').first().html();
  if (!contentHtml) contentHtml = $('.entry-content').first().html();
  if (!contentHtml) contentHtml = $('.wpb-content-wrapper').parent().html();
  if (!contentHtml) contentHtml = $('.wpb-content-wrapper').first().html();
  if (!contentHtml) contentHtml = $('main').first().html();
  if (!contentHtml) {
    console.error('Cannot find main content');
    return;
  }

  const root = cheerio.load(contentHtml);
  // remove first h1 if present
  root('h1').first().remove();
  root('.date, time').first().remove();
  root('script, style').remove();
  // remove share/author/tag links similar to post import
  root('a').each((i, el) => {
    const href = root(el).attr('href') || '';
    if (/\/author\//.test(href) || /\/category\//.test(href) || /\/tag\//.test(href)) {
      root(el).remove();
    }
  });

  // handle images download
  const imgPromises = [];
  const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  let imgCounter = 1;
  root('img').each((i, el) => {
    let src = root(el).attr('src');
    if (!src || src.startsWith('data:') || src === '#') src = root(el).attr('data-src');
    if (!src) return;
    if (!src.startsWith('http')) src = new URL(src, url).href;
    const ext = path.extname(src.split('?')[0]).toLowerCase();
    if (!allowedExt.includes(ext)) return;
    const fileName = `image${imgCounter}${ext}`;
    imgCounter += 1;
    const localPath = path.join(destDir, fileName);
    root(el).attr('src', fileName);
    root(el).removeAttr('srcset data-src data-lazy-src data-original');

    imgPromises.push(download(src, localPath));
  });

  await Promise.all(imgPromises);
  // convert to markdown
  const markdownBody = turndown.turndown(root.html()).trim();

  // write md with optional title
  const front = `---\ntitle: "${escape(title)}"\ndate: ${date}\n---\n\n`;
  await fs.writeFile(destMarkdown, front + markdownBody + '\n', 'utf-8');
  console.log(`Saved to ${destMarkdown}`);

  if (await fs.pathExists(destDir)) {
    const existing = await fs.readdir(destDir);
    for (const f of existing) {
      if (f.toLowerCase().endsWith('.md') || f.toLowerCase() === 'video.mp4' || /^cover\./i.test(f)) continue;
      await fs.remove(path.join(destDir, f));
    }
  }
}

function deriveSlug(u) {
  const parts = u.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'project';
}

function escape(str) {
  return str.replace(/"/g, '\\"');
}

function normalizeDate(input) {
  if (!input) return new Date().toISOString().slice(0,10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const parsed = Date.parse(input);
  if (!isNaN(parsed)) return new Date(parsed).toISOString().slice(0,10);
  return new Date().toISOString().slice(0,10);
}

async function download(srcUrl, dest) {
  try {
    if (await fs.pathExists(dest)) return;
    const res = await axios.get(srcUrl, { responseType: 'arraybuffer' });
    await fs.writeFile(dest, res.data);
  } catch (err) {
    console.error('Failed download', srcUrl, err.message);
  }
}

// CLI wrapper
async function runCli() {
  const [, , url, ...rest] = process.argv;
  if (!url) {
    console.error('Usage: npm run import:project -- <URL> [--slug my-slug]');
    process.exit(1);
  }
  const params = {};
  rest.forEach((arg, idx) => {
    if (arg.startsWith('--')) params[arg.slice(2)] = rest[idx + 1];
  });
  await importProject(url, params);
}

module.exports = importProject;

if (require.main === module) {
  runCli().catch(err => {
    console.error(err);
    process.exit(1);
  });
} 