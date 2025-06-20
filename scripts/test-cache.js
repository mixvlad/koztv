const fs = require('fs-extra');
const path = require('path');
const { shouldRegenerateFile } = require('../lib');

async function testCache() {
    console.log('🧪 Testing image caching logic...\n');
    
    // Тестируем с несуществующим файлом
    console.log('1. Testing with non-existent destination file:');
    const result1 = await shouldRegenerateFile(
        'content/projects/d1-flat-design/cover.jpg',
        'docs/non-existent.jpg'
    );
    console.log(`   Result: ${result1} (should be true)\n`);
    
    // Тестируем с существующим файлом
    if (fs.existsSync('content/projects/d1-flat-design/cover.jpg')) {
        console.log('2. Testing with existing source file:');
        const result2 = await shouldRegenerateFile(
            'content/projects/d1-flat-design/cover.jpg',
            'content/projects/d1-flat-design/cover.jpg' // same file
        );
        console.log(`   Result: ${result2} (should be false)\n`);
    }
    
    // Тестируем с force regenerate
    console.log('3. Testing with force regenerate flag:');
    const result3 = await shouldRegenerateFile(
        'content/projects/d1-flat-design/cover.jpg',
        'docs/test.jpg',
        true
    );
    console.log(`   Result: ${result3} (should be true)\n`);
    
    console.log('✅ Cache testing completed!');
}

testCache().catch(console.error); 