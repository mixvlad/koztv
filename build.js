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
    return originalLinkRenderer(href, title, text);
};

marked.setOptions({ renderer });

// Функция для конвертации Markdown в HTML
function convertMarkdownToHtml(markdown, metadata) {
    const content = marked.parse(markdown);
    return template
        .replace(/{{title}}/g, metadata.title || '')
        .replace(/{{date}}/g, metadata.date || '')
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
                const depth = path.relative(config.outputDir, path.dirname(destPath)).split(path.sep).filter(Boolean).length;
                const rootPrefix = depth === 0 ? '' : Array(depth).fill('..').join('/') + '/';
                const html = convertMarkdownToHtml(body, attributes)
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