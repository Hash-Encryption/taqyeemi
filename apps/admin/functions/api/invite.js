export async function onRequestPost(context) {
    const { request, env } = context;

    const SUPABASE_URL = env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHptcmdoYnZxZmFjbGFudGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjQ4MjUsImV4cCI6MjEwMDQwMDgyNX0.KvpR7DqUi-Ed4E3s_wVkJXMqB5cj3DHKEmis_jiTffw';

    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // 0. Privileged Admin Endpoint Authorization Guard
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }), {
            status: 401,
            headers: corsHeaders
        });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Verify token with Supabase Auth
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
        }
    });

    if (!userRes.ok) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired access token' }), {
            status: 401,
            headers: corsHeaders
        });
    }

    const authUser = await userRes.json();
    if (!authUser || !authUser.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Unable to verify user' }), {
            status: 401,
            headers: corsHeaders
        });
    }

    // Verify role in user_roles table
    const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const roleRes = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${authUser.id}&select=role`, {
        headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!roleRes.ok) {
        return new Response(JSON.stringify({ error: 'Forbidden: Could not verify user permissions' }), {
            status: 403,
            headers: corsHeaders
        });
    }

    const roles = await roleRes.json();
    if (!roles || roles.length === 0 || roles[0].role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin permissions required' }), {
            status: 403,
            headers: corsHeaders
        });
    }

    try {
        const body = await request.json();
        const { lead_id, email, business_name, google_maps_link, counter_count, slug } = body;

        if (!email || !business_name) {
            return new Response(JSON.stringify({ error: 'Email and business_name are required' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const clientSlug = slug || business_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

        // 1. Create/Insert Pre-Approved Client Record in database
        const clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
            method: 'POST',
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name: business_name,
                slug: clientSlug,
                owner_email: email.toLowerCase(),
                google_review_url: google_maps_link || 'https://g.page/r/review',
                active: true,
                portal_status: 'active'
            })
        });

        const clientData = await clientRes.json();
        if (!clientRes.ok && clientRes.status !== 409 && !JSON.stringify(clientData).includes('duplicate')) {
            console.warn('Client pre-registration response:', clientData);
        }

        // 2. Update lead_submissions status if lead_id provided
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

        const publicFunnelBase = env.PUBLIC_FUNNEL_URL || 'https://taqyeemi.pages.dev';
        const funnelUrl = `${publicFunnelBase.replace(/\/+$/, '')}/?c=${encodeURIComponent(clientSlug)}`;

        return new Response(JSON.stringify({
            success: true,
            slug: clientSlug,
            owner_email: email.toLowerCase(),
            funnel_url: funnelUrl
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
