/**
 * SPARQL Proxy Server
 * Handles CORS for LINDAS SPARQL requests from Grafana
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3002;
const DEFAULT_ENDPOINT = process.env.DEFAULT_SPARQL_ENDPOINT || 'https://lindas.admin.ch/query';

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', endpoint: DEFAULT_ENDPOINT }));
    return;
  }

  // SPARQL proxy endpoint
  if (req.url === '/sparql' && req.method === 'POST') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse the endpoint URL
      const parsedUrl = url.parse(DEFAULT_ENDPOINT);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const httpModule = parsedUrl.protocol === 'https:' ? https : http;

      const proxyReq = httpModule.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*',
        });

        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });

    return;
  }

  // Custom endpoint proxy (pass endpoint as query param)
  if (req.url.startsWith('/proxy?')) {
    const queryParams = url.parse(req.url, true).query;
    const targetEndpoint = queryParams.endpoint || DEFAULT_ENDPOINT;

    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const parsedUrl = url.parse(targetEndpoint);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
          'Accept': req.headers['accept'] || 'application/sparql-results+json',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const httpModule = parsedUrl.protocol === 'https:' ? https : http;

      const proxyReq = httpModule.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*',
        });

        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error('Proxy error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      proxyReq.write(body);
      proxyReq.end();
    });

    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`SPARQL Proxy running on port ${PORT}`);
  console.log(`Default endpoint: ${DEFAULT_ENDPOINT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SPARQL proxy: http://localhost:${PORT}/sparql`);
});
