export async function onRequest(context) {
    return new Response(JSON.stringify({ 
        provider: 'cloudflare-d1',
        database: 'taqyeemi-db',
        d1_enabled: true
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
