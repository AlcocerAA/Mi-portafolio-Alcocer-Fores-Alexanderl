const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {

    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);

    let extname = path.extname(filePath);

    let contentType = 'text/html';

    if (extname === '.css') contentType = 'text/css';
    if (extname === '.js') contentType = 'text/javascript';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Archivo no encontrado');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });

});

server.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});