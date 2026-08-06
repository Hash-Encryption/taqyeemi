const http = require('http');
const fs   = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                value = value.trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
}

loadEnv();

const ROOT = path.resolve(__dirname, 'Google funnel full Platform');
const PORT = process.env.PORT || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'text/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
    // Strip query string to get the file path
    const urlPath = req.url.split('?')[0];

    // API Endpoint for dynamic configuration from server .env
    if (urlPath === '/api/config') {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            SUPABASE_URL: process.env.SUPABASE_URL || '',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
        }));
        return;
    }

    // Default to platform.html for root
    const relative = urlPath === '/' ? 'platform.html' : urlPath;
    const filePath = path.join(ROOT, relative);

    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403); res.end('Forbidden'); return;
    }

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found: ' + relative);
        return;
    }

    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'text/plain';

    res.writeHead(200, { 
        'Content-Type': mime,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);

}).listen(PORT, () => {
    console.log(`\n  ✅ Server running at http://localhost:${PORT}`);
    console.log(`  🔑 Environment loaded from .env`);
    console.log(`\n  Pages:`);
    console.log(`  Admin     → http://localhost:${PORT}`);
    console.log(`  Review    → http://localhost:${PORT}?c=lavoa`);
    console.log(`  Dashboard → http://localhost:${PORT}?view=dashboard\n`);
});
