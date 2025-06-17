#!/usr/bin/env node

/*
 * Remove stray files (e.g., long hash names without extension) that were
 * accidentally downloaded during earlier imports. Criteria:
 *   • Located in content/posts/** or docs/posts/** (mirrored output)
 *   • Is a file and has NO extension (path.extname === '')
 *   • Optionally, filename length > 20 and consists of hex chars
 */

const fs = require('fs-extra');
const path = require('path');

const roots = [
  path.join('content', 'posts'),
  path.join('docs', 'posts')
];

(async () => {
  const removed = [];
  for (const root of roots) {
    if (!(await fs.pathExists(root))) continue;
    await walk(root, async file => {
      const ext = path.extname(file);
      if (ext) return; // has extension, keep
      const base = path.basename(file);
      if (base.length < 20) return;
      if (!/^[a-f0-9]+$/i.test(base)) return;
      await fs.remove(file);
      removed.push(file);
    });
  }
  console.log(`Removed ${removed.length} stray files`);
  if (removed.length) removed.forEach(f => console.log('  -', f));
})();

async function walk(dir, cb) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(full, cb);
    } else if (e.isFile()) {
      await cb(full);
    }
  }
} 