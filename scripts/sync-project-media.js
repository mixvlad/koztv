#!/usr/bin/env node

/*
 * Copy cover image (cover.* or image1.*) and video.mp4 from docs/projects/<slug>/
 * into content/projects/<slug>/.
 * Useful when images already generated in docs but not present in content.
 */

const fs = require('fs-extra');
const path = require('path');

(async () => {
  const docsRoot = path.join('docs', 'projects');
  const contentRoot = path.join('content', 'projects');
  if (!fs.existsSync(docsRoot)) {
    console.error('docs/projects directory not found. Build the site first.');
    process.exit(1);
  }
  const slugs = fs.readdirSync(docsRoot, { withFileTypes: true }).filter(d=>d.isDirectory()).map(d=>d.name);
  let copied = 0;
  for (const slug of slugs) {
    const srcDir = path.join(docsRoot, slug);
    const destDir = path.join(contentRoot, slug);
    if (!fs.existsSync(destDir)) continue; // only sync for existing content projects
    const files = fs.readdirSync(srcDir);

    const mediaToCopy = files.filter(f => /^(cover\.|image1\.)/i.test(f) && /\.(png|jpe?g|gif|svg|webp)$/i.test(f));
    if (files.includes('video.mp4')) mediaToCopy.push('video.mp4');

    for (const file of mediaToCopy) {
      const src = path.join(srcDir, file);
      const dest = path.join(destDir, file);
      await fs.copy(src, dest, { overwrite: true });
      copied++;
    }
  }
  console.log(`Copied ${copied} media files from docs -> content projects.`);
})(); 