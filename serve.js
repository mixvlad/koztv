const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;

// Раздача статических файлов из директории docs
app.use(express.static('docs'));

// Редирект с корня на index.html
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
}); 