const http = require('http');
const fs   = require('fs');
const path = require('path');

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

const PORT_LANDING   = process.env.PORT_LANDING || 3000;
const PORT_DASHBOARD = process.env.PORT_DASHBOARD || 3001;
const PORT_ADMIN     = process.env.PORT_ADMIN || 3002;

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

function createStaticServer(appFolder, port, appName) {
    const root = path.resolve(__dirname, 'apps', appFolder);

    return http.createServer(async (req, res) => {
        const urlPath = req.url.split('?')[0];

        // Handle CORS Preflight OPTIONS
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end();
            return;
        }

        if (urlPath === '/api/config') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end(JSON.stringify({
                SUPABASE_URL: process.env.SUPABASE_URL || '',
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
                DASHBOARD_URL: process.env.DASHBOARD_URL || process.env.OWNER_APP_URL || `http://localhost:${PORT_DASHBOARD}`,
                OWNER_APP_URL: process.env.OWNER_APP_URL || process.env.DASHBOARD_URL || `http://localhost:${PORT_DASHBOARD}`,
                PUBLIC_FUNNEL_URL: process.env.PUBLIC_FUNNEL_URL || 'https://taqyeemi.pages.dev',
                ADMIN_APP_URL: process.env.ADMIN_APP_URL || `http://localhost:${PORT_ADMIN}`
            }));
            return;
        }

        if (urlPath === '/api/invite' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const corsHeaders = {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                };
                try {
                    const parsed = JSON.parse(body);
                    const { lead_id, email, business_name, google_maps_link, counter_count, slug } = parsed;
                    const clientSlug = slug || business_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                    
                    const SUPABASE_URL = process.env.SUPABASE_URL;
                    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
                    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

                    if (SUPABASE_URL && apiKey) {
                        await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
                            method: 'POST',
                            headers: {
                                'apikey': apiKey,
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: business_name,
                                slug: clientSlug,
                                owner_email: email.toLowerCase(),
                                google_review_url: google_maps_link || 'https://g.page/r/review',
                                active: true
                            })
                        });

                        if (lead_id) {
                            await fetch(`${SUPABASE_URL}/rest/v1/lead_submissions?id=eq.${lead_id}`, {
                                method: 'PATCH',
                                headers: {
                                    'apikey': apiKey,
                                    'Authorization': `Bearer ${apiKey}`,
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ status: 'invited', updated_at: new Date().toISOString() })
                            });
                        }
                    }

                    const publicFunnelBase = process.env.PUBLIC_FUNNEL_URL || 'https://taqyeemi.pages.dev';
                    const funnelUrl = `${publicFunnelBase.replace(/\/+$/, '')}/?c=${encodeURIComponent(clientSlug)}`;

                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true, slug: clientSlug, owner_email: email, funnel_url: funnelUrl }));
                } catch(err) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        if (urlPath === '/api/lead-notify' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const corsHeaders = {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                };
                try {
                    const parsed = JSON.parse(body);
                    const { business_name, decision_maker_name, email, phone_number, google_maps_link, counter_count, is_resubmission } = parsed;
                    const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_CSiVQsu8_B9Y64tk7wZKtcSTvgBk67nXJ';
                    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muhabagency@gmail.com';

                    const subject = `${is_resubmission ? '🔄 [Resubmission]' : '📬 [New Lead]'} Taqyeemi Request: ${business_name}`;
                    const html = `
                        <div style="font-family:sans-serif; background:#121214; color:#e8eaed; padding:32px; border-radius:16px; max-width:560px;">
                            <h2 style="color:#4285F4; margin:0 0 12px;">Taqyeemi Lead Request Notification</h2>
                            <p style="color:#9aa0a6;">${is_resubmission ? 'A client has updated their application.' : 'A new business has applied for access.'}</p>
                            <p><strong>Business:</strong> ${business_name}</p>
                            <p><strong>Contact:</strong> ${decision_maker_name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Phone:</strong> ${phone_number}</p>
                            <p><strong>Counters:</strong> ${counter_count}</p>
                            <p><strong>Maps Link:</strong> <a href="${google_maps_link}" style="color:#4285f4;">Open Link</a></p>
                        </div>
                    `;

                    const resendRes = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${RESEND_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'Taqyeemi Platform <onboarding@resend.dev>',
                            to: [ADMIN_EMAIL],
                            subject: subject,
                            html: html
                        })
                    });
                    const resendData = await resendRes.json();
                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true, resend: resendData }));
                } catch(err) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        if (urlPath === '/api/feedback' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', async () => {
                const corsHeaders = {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type'
                };
                try {
                    const parsed = JSON.parse(body);
                    const { client_id, rating, feedback_text } = parsed;
                    const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
                    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
                    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHptcmdoYnZxZmFjbGFudGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjQ4MjUsImV4cCI6MjEwMDQwMDgyNX0.KvpR7DqUi-Ed4E3s_wVkJXMqB5cj3DHKEmis_jiTffw';
                    const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

                    const fbRes = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
                        method: 'POST',
                        headers: {
                            'apikey': apiKey,
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({
                            client_id,
                            rating: parseInt(rating),
                            feedback_text: String(feedback_text).trim()
                        })
                    });

                    const data = await fbRes.json();
                    if (!fbRes.ok) {
                        res.writeHead(fbRes.status, corsHeaders);
                        res.end(JSON.stringify({ error: data.message || 'Database insert failed' }));
                        return;
                    }

                    res.writeHead(200, corsHeaders);
                    res.end(JSON.stringify({ success: true, feedback: data }));
                } catch(err) {
                    res.writeHead(500, corsHeaders);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
            return;
        }

        const relative = urlPath === '/' ? 'index.html' : urlPath;
        const filePath = path.join(root, relative);

        if (!filePath.startsWith(root) || !fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        const ext  = path.extname(filePath);
        const mime = MIME[ext] || 'text/plain';

        res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
        fs.createReadStream(filePath).pipe(res);
    }).listen(port, () => {
        console.log(`  🚀 [${appName}] running at http://localhost:${port}`);
    });
}

console.log(`\n  ==================================================`);
console.log(`  Taqyeemi Multi-App Local Development Server`);
console.log(`  ==================================================\n`);

createStaticServer('landing', PORT_LANDING, 'Landing App');
createStaticServer('dashboard', PORT_DASHBOARD, 'Dashboard App');
createStaticServer('admin', PORT_ADMIN, 'Admin App');
