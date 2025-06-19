const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const crypto = require('crypto');
const CleanCSS = require('clean-css');
const esbuild = require('esbuild');
const sharp = require('sharp');
const sizeOf = require('image-size');

// Конфигурация
const config = {
    sourceDir: 'content',
    outputDir: 'docs',
    templateFile: 'templates/post.html'
};

const isDev = process.argv.includes('--watch');
const shouldClean = process.argv.includes('--clean');

// Создаем выходную директорию
fs.ensureDirSync(config.outputDir);

// Копируем статические файлы
fs.copySync('static', path.join(config.outputDir, 'static'), { overwrite: true });

// Читаем шаблон
const template = fs.readFileSync(config.templateFile, 'utf-8');

// Настраиваем marked для обработки ссылок
const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);
renderer.link = (href, title, text) => {
    // Если ссылка начинается с /, убираем слеш
    if (href.startsWith('/')) {
        href = href.substring(1);
    }
    // Remove index.html at end of href
    if (href.endsWith('index.html')) {
        href = href.slice(0, -'index.html'.length);
    }
    return originalLinkRenderer(href, title, text);
};

const originalImageRenderer = renderer.image.bind(renderer);
renderer.image = (href, title, text) => {
    if (href.startsWith('/')) href = href.substring(1);
    const ext = path.extname(href).toLowerCase();
    const supportsPicture = ['.png', '.jpg', '.jpeg'].includes(ext);
    const alt = text || title || '';
    if (!supportsPicture) {
        // default handling with lazy/async attrs
        let base = originalImageRenderer(href, title, text);
        // Compute dims
        try {
            const imgPath = path.join(config.sourceDir, currentMdDir, href);
            const { width, height } = sizeOf(imgPath);
            if (width && height) {
                base = base.replace('<img ', `<img width="${width}" height="${height}" style="aspect-ratio:${width}/${height}" `);
            }
        } catch {}
        return base.replace('<img ', '<img loading="lazy" decoding="async" ');
    }
    const withoutExt = href.replace(/\.[^/.]+$/, '');
    const avif = withoutExt + '.avif';
    const webp = withoutExt + '.webp';

    // Attempt to read dimensions for width/height
    let dimAttrs = '';
    try {
        const imgPath = path.join(config.sourceDir, currentMdDir, href);
        const { width, height } = sizeOf(imgPath);
        if (width && height) {
            dimAttrs = ` width="${width}" height="${height}" style="aspect-ratio:${width}/${height}"`;
        }
    } catch { /* ignore */ }

    return `<picture>`+
        `<source type="image/avif" srcset="${avif}">`+
        `<source type="image/webp" srcset="${webp}">`+
        `<img loading="lazy" decoding="async" src="${href}" alt="${alt}"${dimAttrs}>`+
        `</picture>`;
};

marked.setOptions({ renderer });

const assetManifest = {}; // original relative path -> hashed path

function hashContent(buf) {
    return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

let currentMdDir = '';

// Функция для конвертации Markdown в HTML
function convertMarkdownToHtml(markdown, metadata, mdDirRel) {
    const prevDir = currentMdDir;
    currentMdDir = mdDirRel || '';
    const content = marked.parse(markdown);
    currentMdDir = prevDir;
    let dateStr = metadata.date || '';
    if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().slice(0, 10);
    }
    const devScript = '';
    return template
        .replace(/{{title}}/g, metadata.title || '')
        .replace(/{{date}}/g, dateStr)
        .replace(/{{bodyClass}}/g, metadata.bodyClass || '')
        .replace(/{{devReload}}/g, devScript)
        .replace('{{content}}', content);
}

// Helper to walk source directory recursively
async function processDir(srcDir) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(srcDir, entry.name);
        const relPath = path.relative(config.sourceDir, fullPath);
        const destPath = path.join(config.outputDir, relPath);

        if (entry.isDirectory()) {
            await fs.ensureDir(destPath);
            await processDir(fullPath);
        } else if (entry.isFile()) {
            if (path.extname(entry.name) === '.md') {
                const content = await fs.readFile(fullPath, 'utf-8');
                const { attributes, body } = frontMatter(content);
                let mdBody = body;
                if (relPath === 'index.md') {
                    const proj = generateProjectsMarkup();
                    mdBody = mdBody
                        .replace(/{{postsList}}/g, generatePostsMarkdownList())
                        .replace(/{{projectsFeatured}}/g, proj.featured)
                        .replace(/{{projectsGrid}}/g, proj.grid);
                }
                const depth = path.relative(config.outputDir, path.dirname(destPath)).split(path.sep).filter(Boolean).length;
                const rootPrefix = depth === 0 ? '' : Array(depth).fill('..').join('/') + '/';
                let html = convertMarkdownToHtml(mdBody, {
                    ...attributes,
                    bodyClass: relPath === 'index.md' ? 'home' : (attributes.bodyClass || '')
                }, path.dirname(relPath));
                // Inject hashed stylesheet placeholder before root replacement
                if (assetManifest['static/css/style.css']) {
                    const stylePath = rootPrefix + assetManifest['static/css/style.css'];
                    html = html.replace(/{{styleCss}}/g, stylePath);
                } else {
                    html = html.replace(/{{styleCss}}/g, rootPrefix + 'static/css/style.css');
                }
                // Replace root token
                html = html.replace(/{{root}}/g, rootPrefix);
                // Replace any static asset paths with hashed ones
                for (const [orig, hashed] of Object.entries(assetManifest)) {
                    const origPath1 = rootPrefix + orig;
                    const hashedPath1 = rootPrefix + hashed;
                    html = html.split(origPath1).join(hashedPath1);
                    // Also replace non-prefixed variant (for root pages)
                    html = html.split(orig).join(hashed);
                }
                const htmlDest = destPath.replace(/\.md$/, '.html');
                await fs.ensureDir(path.dirname(htmlDest));
                await fs.writeFile(htmlDest, html);
                console.log(`Built: ${htmlDest}`);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                    const needCopy = !(fs.existsSync(destPath) && (await fs.stat(destPath)).mtimeMs >= (await fs.stat(fullPath)).mtimeMs);
                    if (needCopy) {
                        await fs.copy(fullPath, destPath);
                    }
                    const withoutExt = destPath.slice(0, -ext.length);
                    const webpDest = withoutExt + '.webp';
                    const avifDest = withoutExt + '.avif';
                    if (!(fs.existsSync(webpDest) && (await fs.stat(webpDest)).mtimeMs >= (await fs.stat(fullPath)).mtimeMs)) {
                        try { await sharp(fullPath).toFormat('webp', { quality: 82 }).toFile(webpDest); } catch {}
                    }
                    if (!(fs.existsSync(avifDest) && (await fs.stat(avifDest)).mtimeMs >= (await fs.stat(fullPath)).mtimeMs)) {
                        try { await sharp(fullPath).toFormat('avif', { quality: 55 }).toFile(avifDest); } catch {}
                    }
                } else {
                    await fs.copy(fullPath, destPath);
                }
            }
        }
    }
}

// Функция для безопасного копирования статических файлов
async function copyStaticFiles() {
    const staticSrc = 'static';
    const staticDest = path.join(config.outputDir, 'static');
    await fs.ensureDir(staticDest);

    async function walk(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(dir, entry.name);
            const relPath = path.relative(staticSrc, srcPath).replace(/\\/g, '/');
            const destPath = path.join(staticDest, relPath);

            if (entry.isDirectory()) {
                await fs.ensureDir(destPath);
                await walk(srcPath);
                continue;
            }

            const ext = path.extname(entry.name).toLowerCase();
            if (ext === '.css') {
                const cssSrc = await fs.readFile(srcPath, 'utf-8');
                const hash = hashContent(cssSrc);
                const hashedName = entry.name.replace(/\.css$/, `.${hash}.css`);
                const finalDest = path.join(path.dirname(destPath), hashedName);
                assetManifest[`static/${relPath}`] = `static/${path.posix.join(path.dirname(relPath), hashedName)}`;
                if (!fs.existsSync(finalDest)) {
                    const minified = new CleanCSS({ level: 2 }).minify(cssSrc).styles;
                    await fs.writeFile(finalDest, minified);
                }
            } else if (ext === '.js') {
                const jsSrc = await fs.readFile(srcPath, 'utf-8');
                const hash = hashContent(jsSrc);
                const hashedName = entry.name.replace(/\.js$/, `.${hash}.js`);
                const finalDest = path.join(path.dirname(destPath), hashedName);
                assetManifest[`static/${relPath}`] = `static/${path.posix.join(path.dirname(relPath), hashedName)}`;
                if (!fs.existsSync(finalDest)) {
                    const result = await esbuild.build({
                        stdin: { contents: jsSrc, resolveDir: path.dirname(srcPath), sourcefile: entry.name },
                        bundle: false,
                        minify: true,
                        write: false,
                        format: 'iife',
                        target: 'es2018'
                    });
                    const js = result.outputFiles[0].text;
                    await fs.writeFile(finalDest, js);
                }
            } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
                // Copy original if missing or outdated
                const needCopy = !(fs.existsSync(destPath) && (await fs.stat(destPath)).mtimeMs >= (await fs.stat(srcPath)).mtimeMs);
                if (needCopy) {
                    await fs.copy(srcPath, destPath);
                }
                // Generate WebP & AVIF only if not exist or outdated
                const withoutExt = destPath.slice(0, -ext.length);
                const webpDest = withoutExt + '.webp';
                const avifDest = withoutExt + '.avif';
                if (!(fs.existsSync(webpDest) && (await fs.stat(webpDest)).mtimeMs >= (await fs.stat(srcPath)).mtimeMs)) {
                    try { await sharp(srcPath).toFormat('webp', { quality: 82 }).toFile(webpDest); } catch {}
                }
                if (!(fs.existsSync(avifDest) && (await fs.stat(avifDest)).mtimeMs >= (await fs.stat(srcPath)).mtimeMs)) {
                    try { await sharp(srcPath).toFormat('avif', { quality: 55 }).toFile(avifDest); } catch {}
                }
            } else {
                // Copy as-is
                await fs.copy(srcPath, destPath);
            }
        }
    }

    await walk(staticSrc);
}

// Обрабатываем все Markdown файлы и копируем ресурсы
async function build() {
    if (shouldClean) {
        await fs.emptyDir(config.outputDir);
    } else {
        await fs.ensureDir(config.outputDir);
    }
    await copyStaticFiles();
    await processDir(config.sourceDir);

    // Create .nojekyll file for GitHub Pages
    await fs.writeFile(path.join(config.outputDir, '.nojekyll'), '# This file tells GitHub Pages not to use Jekyll');

    // After main content copied, create legacy redirects
    await createRedirects();
}

// Функция для наблюдения за изменениями
async function watch() {
    console.log('Watching for changes...');

    // WebSocket server removed - live reload now handled by BrowserSync
    function notifyClients() {
        /* no-op */
    }

    // Debounce / queue to избегать одновременных билдов
    let building = false;
    let buildQueued = false;
    async function safeBuild() {
        if (building) {
            buildQueued = true;
            return;
        }
        building = true;
        try {
            await build();
        } catch (err) {
            console.error('Build failed:', err);
        } finally {
            building = false;
            if (buildQueued) {
                buildQueued = false;
                // Запускаем ещё один билд, если был запланирован
                safeBuild();
            } else {
                // Шлём уведомление только после успешного (последнего) билда
                notifyClients();
            }
        }
    }
    
    // Наблюдаем за изменениями в директории с контентом (рекурсивно на Windows/mac)
    fs.watch(config.sourceDir, { recursive: true }, async (eventType, filename) => {
        if (filename) {
            console.log(`Change detected in ${filename}`);
            safeBuild();
        }
    });
    
    // Наблюдаем за изменениями во всех шаблонах
    fs.watch('templates', async (eventType, filename) => {
        if (filename && filename.endsWith('.html')) {
            console.log(`Template ${filename} has been changed`);
            safeBuild();
        }
    });
    
    // Наблюдаем за изменениями во всех CSS
    fs.watch('static/css', async (eventType, filename) => {
        if (filename && filename.endsWith('.css')) {
            console.log(`CSS ${filename} has been changed`);
            safeBuild();
        }
    });
    
    // Наблюдаем за изменениями в статических файлах (остальное)
    fs.watch('static', async (eventType, filename) => {
        if (filename && !filename.endsWith('.css')) {
            console.log(`Static file ${filename} has been changed`);
            safeBuild();
        }
    });
}

// Проверяем, запущен ли скрипт в режиме наблюдения
if (process.argv.includes('--watch')) {
    build().then(watch).catch(console.error);
} else {
    build().catch(console.error);
}

// Generate markdown bullet list of posts sorted by date desc
function generatePostsMarkdownList() {
    const postsRoot = path.join(config.sourceDir, 'posts');
    const slugs = fs.readdirSync(postsRoot, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    const metas = slugs.map(slug => {
        const mdPath = path.join(postsRoot, slug, 'index.md');
        try {
            const mdContent = fs.readFileSync(mdPath, 'utf-8');
            const { attributes } = frontMatter(mdContent);
            const date = attributes.date || '1970-01-01';
            const title = attributes.title || slug;
            return { slug, title, date };
        } catch {
            return null;
        }
    }).filter(Boolean);
    metas.sort((a, b) => {
        const ta = Date.parse(a.date);
        const tb = Date.parse(b.date);
        return tb - ta;
    });
    return metas.map(m => `* [${m.title}](posts/${m.slug}/)`).join('\n');
}

// Generate HTML markup for projects section
function generateProjectsMarkup() {
    const projectsRoot = path.join(config.sourceDir, 'projects');
    if (!fs.existsSync(projectsRoot)) return { featured: '', grid: '' };

    const dirs = fs.readdirSync(projectsRoot, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

    const metas = dirs.map(slug => {
        const mdPath = path.join(projectsRoot, slug, 'index.md');
        let title = slug;
        let date = '1970-01-01';
        let featured = false;
        if (fs.existsSync(mdPath)) {
            const { attributes } = frontMatter(fs.readFileSync(mdPath, 'utf-8'));
            title = attributes.title || title;
            date = attributes.date || date;
            featured = !!attributes.featured;
        }

        // find cover image
        const dirFiles = fs.readdirSync(path.join(projectsRoot, slug));
        let cover = dirFiles.find(f => /^cover\.(png|jpe?g|gif|svg|webp)$/i.test(f));
        if (!cover) {
            cover = dirFiles.find(f => /image1\.(png|jpe?g|gif|svg|webp)$/i.test(f));
        }
        const hasVideo = fs.existsSync(path.join(projectsRoot, slug, 'video.mp4'));

        return { slug, title, date, cover, hasVideo, featured };
    });

    metas.sort((a,b)=> Date.parse(b.date) - Date.parse(a.date));

    let featuredProject = metas.find(m=>m.featured);
    if(!featuredProject && metas.length) featuredProject = metas[0];
    const others = metas.filter(m=>m!==featuredProject);

    const makeAnchor = m => {
        const videoAttr = m.hasVideo ? ' data-video' : '';
        const imgSrc = m.cover ? `projects/${m.slug}/${m.cover}` : '';
        let dimAttr = '';
        if (imgSrc) {
            try {
                const { width, height } = sizeOf(path.join(projectsRoot, m.slug, m.cover));
                if (width && height) {
                    dimAttr = ` width="${width}" height="${height}" style="aspect-ratio:${width}/${height}"`;
                }
            } catch {}
        }
        const ratioStyle = m.cover && dimAttr ? ` style="aspect-ratio:${dimAttr.match(/width=\"(\d+)/)[1]}/${dimAttr.match(/height=\"(\d+)/)[1]}"` : '';
        const imgTag = imgSrc ? `<img data-src="${imgSrc}" alt="${m.title}"${dimAttr} style="aspect-ratio:${dimAttr.match(/width=\"(\d+)/)[1]}/${dimAttr.match(/height=\"(\d+)/)[1]}" />` : '';
        return `<a class="project-item${m===featuredProject?' full':''}" href="projects/${m.slug}/"${videoAttr}${ratioStyle}>${imgTag}<span class="caption">${m.title}</span></a>`;
    };

    return {
        featured: featuredProject ? makeAnchor(featuredProject) : '',
        grid: others.map(makeAnchor).join('\n\n')
    };
}

// Generate simple HTML redirect page
function redirectPage(to) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=${to}"><link rel="canonical" href="${to}"></head></html>`;
}

async function createRedirects() {
    // 1. /portfolio/ -> /
    const portfolioDir = path.join(config.outputDir, 'portfolio');
    await fs.ensureDir(portfolioDir);
    await fs.writeFile(path.join(portfolioDir, 'index.html'), redirectPage('../'));

    // 2. /portfolio/<project>/ -> /projects/<project>/
    const projectsRoot = path.join(config.sourceDir, 'projects');
    const projectSlugs = (await fs.readdir(projectsRoot, { withFileTypes: true }))
        .filter(d => d.isDirectory())
        .map(d => d.name);
    for (const slug of projectSlugs) {
        const legacyDir = path.join(portfolioDir, slug);
        await fs.ensureDir(legacyDir);
        await fs.writeFile(path.join(legacyDir, 'index.html'), redirectPage(`../../projects/${slug}/`));
    }

    // 3. Root /<post>/ -> /posts/<post>/
    const postsRoot = path.join(config.sourceDir, 'posts');
    const postSlugs = (await fs.readdir(postsRoot, { withFileTypes: true }))
        .filter(d => d.isDirectory())
        .map(d => d.name);
    for (const slug of postSlugs) {
        const legacyDir = path.join(config.outputDir, slug);
        await fs.ensureDir(legacyDir);
        await fs.writeFile(path.join(legacyDir, 'index.html'), redirectPage(`../posts/${slug}/`));
    }
} 