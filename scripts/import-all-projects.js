#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const importProject = require('./import-project');

(async () => {
  const projectsRoot = path.join('content', 'projects');
  const dirs = await fs.readdir(projectsRoot, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const slug = d.name;
    const url = `https://koz.tv/${slug}/`;
    console.log(`\n=== Importing project ${slug}`);
    try {
      await importProject(url, { slug });
    } catch (e) {
      console.error('Fail', slug, e.message);
    }
  }
})(); 