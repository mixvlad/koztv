#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const frontMatter = require('front-matter');

const INDEX_PATH = path.join('content', 'index.md');

(async () => {
  const raw = await fs.readFile(INDEX_PATH, 'utf-8');
  const lines = raw.split(/\r?\n/);

  // Locate list start (line starting with '* [') under '## Posts'
  const headerIdx = lines.findIndex(l => /^##\s+Posts/.test(l));
  if (headerIdx === -1) {
    console.error('Post list header not found');
    process.exit(1);
  }

  const listStart = lines.slice(headerIdx + 1).findIndex(l => /^\*\s+\[/.test(l));
  if (listStart === -1) {
    console.error('No bullet list found after header');
    process.exit(1);
  }
  const absStart = headerIdx + 1 + listStart;

  // Collect bullet lines until blank line or non-bullet
  let end = absStart;
  while (end < lines.length && /^\*\s+\[/.test(lines[end])) end++;
  const bulletLines = lines.slice(absStart, end);

  // Parse slug and title from each bullet
  const posts = await Promise.all(
    bulletLines.map(async line => {
      const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!match) return null;
      const title = match[1];
      const link = match[2]; // e.g., posts/slug/index.html
      const slugMatch = link.match(/posts\/([^/]+)\//);
      const slug = slugMatch ? slugMatch[1] : null;
      let date = '1970-01-01';
      if (slug) {
        const mdPath = path.join('content', 'posts', slug, 'index.md');
        try {
          const md = await fs.readFile(mdPath, 'utf-8');
          const { attributes } = frontMatter(md);
          if (attributes.date) date = attributes.date.slice(0, 10);
        } catch (err) {
          // ignore missing file
        }
      }
      return { line, date };
    })
  );

  // sort descending by date
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  const sortedLines = posts.map(p => p.line);

  // replace lines in original array
  const newLines = [...lines.slice(0, absStart), ...sortedLines, ...lines.slice(end)];
  await fs.writeFile(INDEX_PATH, newLines.join('\n'), 'utf-8');
  console.log(`Sorted ${sortedLines.length} posts by date in content/index.md`);
})(); 