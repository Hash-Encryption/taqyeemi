export async function onRequestPost(context) {
    const { request, env } = context;

    const SUPABASE_URL = env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHptcmdoYnZxZmFjbGFudGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjQ4MjUsImV4cCI6MjEwMDQwMDgyNX0.KvpR7DqUi-Ed4E3s_wVkJXMqB5cj3DHKEmis_jiTffw';

    try {
        const body = await request.json();
        const { lead_id, email, business_name, google_maps_link, counter_count, slug } = body;

        if (!email || !business_name) {
            return new Response(JSON.stringify({ error: 'Email and business_name are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const clientSlug = slug || business_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        const apiKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

        // 1. Create/Insert Client Record in database
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
                active: true
            })
        });

        const clientData = await clientRes.json();
        if (!clientRes.ok && clientRes.status !== 409 && !JSON.stringify(clientData).includes('duplicate')) {
            console.warn('Client pre-registration response:', clientData);
        }

        // 2. Trigger Supabase inviteUserByEmail API if service_role key is available
        let inviteResult = { invited: false };
        if (SUPABASE_SERVICE_ROLE_KEY) {
            const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    redirectTo: env.OWNER_APP_URL || env.DASHBOARD_URL || 'https://app-taqyeemi.pages.dev'
                })
            });
            const inviteData = await inviteRes.json();
            if (inviteRes.ok) {
                inviteResult = { invited: true, user: inviteData };
            } else {
                inviteResult = { invited: false, message: inviteData.msg || inviteData.message };
            }
        }

        // 3. Update lead_submissions status if lead_id provided
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
            funnel_url: funnelUrl,
            invite: inviteResult
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
