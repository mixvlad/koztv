const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');
const createWebSocketServer = require('./websocket-server');
const WebSocket = require('ws');

// Конфигурация
const config = {
    sourceDir: 'content',
    outputDir: 'docs',
    templateFile: 'templates/post.html'
};

const isDev = process.argv.includes('--watch');

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

marked.setOptions({ renderer });

// Функция для конвертации Markdown в HTML
function convertMarkdownToHtml(markdown, metadata) {
    const content = marked.parse(markdown);
    let dateStr = metadata.date || '';
    if (dateStr instanceof Date) {
        dateStr = dateStr.toISOString().slice(0, 10);
    }
    const devScript = isDev ? `// WebSocket hot-reload\nconst ws = new WebSocket('ws://localhost:8080');\nws.onmessage = e=>e.data==='reload' && location.reload();\nws.onclose = () => setTimeout(()=>location.reload(),1000);` : '';
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
                const html = convertMarkdownToHtml(mdBody, {
                    ...attributes,
                    bodyClass: relPath === 'index.md' ? 'home' : (attributes.bodyClass || '')
                })
                    .replace(/{{root}}/g, rootPrefix);
                const htmlDest = destPath.replace(/\.md$/, '.html');
                await fs.ensureDir(path.dirname(htmlDest));
                await fs.writeFile(htmlDest, html);
                console.log(`Built: ${htmlDest}`);
            } else {
                await fs.copy(fullPath, destPath);
            }
        }
    }
}

// Функция для безопасного копирования статических файлов
async function copyStaticFiles() {
    try {
        await fs.copy('static', path.join(config.outputDir, 'static'), { 
            overwrite: true,
            errorOnExist: false,
            preserveTimestamps: true
        });
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error('Error copying static files:', err);
        }
    }
}

// Обрабатываем все Markdown файлы и копируем ресурсы
async function build() {
    if (!process.argv.includes('--watch')) {
        await fs.emptyDir(config.outputDir);
    }
    await copyStaticFiles();
    await processDir(config.sourceDir);

    // After main content copied, create legacy redirects
    await createRedirects();
}

// Функция для наблюдения за изменениями
async function watch() {
    console.log('Watching for changes...');
    
    // Создаем WebSocket сервер
    const wss = await createWebSocketServer();
    
    // Функция для отправки уведомлений всем клиентам
    function notifyClients() {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send('reload');
            }
        });
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
        const imgTag = imgSrc ? `<img src="${imgSrc}" alt="${m.title}" />` : '';
        return `<a class="project-item${m===featuredProject?' full':''}" href="projects/${m.slug}/"${videoAttr}>${imgTag}<span class="caption">${m.title}</span></a>`;
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
    await fs.writeFile(path.join(portfolioDir, 'index.html'), redirectPage('../index.html'));

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
        await fs.writeFile(path.join(legacyDir, 'index.html'), redirectPage(`posts/${slug}/`));
    }
} 