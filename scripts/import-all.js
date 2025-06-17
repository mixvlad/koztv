#!/usr/bin/env node

/**
 * Batch-import all posts from koz.tv based on directories present in content/posts.
 * For each slug directory it will fetch https://koz.tv/<slug>/ and run import-post logic.
 * Existing Markdown will be overwritten.
 */

const fs = require('fs-extra');
const path = require('path');
const importPost = require('./import-post');

async function run() {
  const postsDir = path.join('content', 'posts');
  const slugs = (await fs.readdir(postsDir, { withFileTypes: true }))
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const slug of slugs) {
    const url = `https://koz.tv/${slug}/`;
    console.log(`\n=== Importing ${slug}`);
    try {
      await importPost(url, { slug });
    } catch (err) {
      console.error(`Failed to import ${slug}:`, err.message);
    }
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
}); 