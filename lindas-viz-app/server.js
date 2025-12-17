/**
 * Simple server for LINDAS Visualization App
 * Serves static files and proxies SPARQL requests to avoid CORS
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const SPARQL_ENDPOINT = 'https://lindas.admin.ch/query';

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // SPARQL proxy endpoint
    if (parsedUrl.pathname === '/sparql' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const sparqlUrl = url.parse(SPARQL_ENDPOINT);

            const options = {
                hostname: sparqlUrl.hostname,
                port: 443,
                path: sparqlUrl.path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/sparql-results+json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };

            const proxyReq = https.request(options, proxyRes => {
                res.writeHead(proxyRes.statusCode, {
                    'Content-Type': 'application/sparql-results+json',
                    'Access-Control-Allow-Origin': '*',
                });
                proxyRes.pipe(res);
            });

            proxyReq.on('error', err => {
                console.error('Proxy error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            });

            proxyReq.write(body);
            proxyReq.end();
        });

        return;
    }

    // Serve static files
    let filePath = parsedUrl.pathname;
    if (filePath === '/') {
        filePath = '/index.html';
    }

    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath);

    fs.readFile(fullPath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }

        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'text/plain',
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`
=========================================
  LINDAS Dataset Visualizer
=========================================

Server running at: http://localhost:${PORT}

Open this URL in your browser to:
  1. Browse LINDAS datasets
  2. Select data fields
  3. Create visualizations

Press Ctrl+C to stop the server.
=========================================
    `);
});
