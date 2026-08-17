export async function onRequestPost(context) {
    const { request, env } = context;

    const SUPABASE_URL = env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHptcmdoYnZxZmFjbGFudGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjQ4MjUsImV4cCI6MjEwMDQwMDgyNX0.KvpR7DqUi-Ed4E3s_wVkJXMqB5cj3DHKEmis_jiTffw';

    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    try {
        const body = await request.json();
        const { client_id, rating, feedback_text } = body;

        if (!client_id || !rating || !feedback_text) {
            return new Response(JSON.stringify({ error: 'client_id, rating, and feedback_text are required' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

        const res = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
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

        const data = await res.json();
        if (!res.ok) {
            return new Response(JSON.stringify({ error: data.message || 'Database insert failed' }), {
                status: res.status,
                headers: corsHeaders
            });
        }

        return new Response(JSON.stringify({ success: true, feedback: data }), {
            status: 200,
            headers: corsHeaders
        });
    } catch(err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
