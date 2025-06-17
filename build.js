const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Конфигурация
const config = {
    sourceDir: 'content',
    outputDir: 'dist',
    templateFile: 'templates/post.html'
};

// Создаем выходную директорию
fs.ensureDirSync(config.outputDir);

// Копируем статические файлы
fs.copySync('static', path.join(config.outputDir, 'static'));

// Читаем шаблон
const template = fs.readFileSync(config.templateFile, 'utf-8');

// Функция для конвертации Markdown в HTML
function convertMarkdownToHtml(markdown, metadata) {
    const content = marked.parse(markdown);
    return template
        .replace('{{title}}', metadata.title || '')
        .replace('{{date}}', metadata.date || '')
        .replace('{{content}}', content);
}

// Обрабатываем все Markdown файлы
async function build() {
    const files = await fs.readdir(config.sourceDir);
    
    for (const file of files) {
        if (path.extname(file) === '.md') {
            const content = await fs.readFile(path.join(config.sourceDir, file), 'utf-8');
            const { attributes, body } = frontMatter(content);
            
            const html = convertMarkdownToHtml(body, attributes);
            const outputFile = path.join(config.outputDir, file.replace('.md', '.html'));
            
            await fs.writeFile(outputFile, html);
            console.log(`Built: ${outputFile}`);
        }
    }
}

build().catch(console.error); 