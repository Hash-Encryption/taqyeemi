export async function onRequest(context) {
    const SUPABASE_URL = context.env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
    const SUPABASE_ANON_KEY = context.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHptcmdoYnZxZmFjbGFudGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MjQ4MjUsImV4cCI6MjEwMDQwMDgyNX0.KvpR7DqUi-Ed4E3s_wVkJXMqB5cj3DHKEmis_jiTffw';
    const OWNER_APP_URL = context.env.OWNER_APP_URL || context.env.DASHBOARD_URL || 'https://app-taqyeemi.pages.dev';
    const DASHBOARD_URL = OWNER_APP_URL;
    const PUBLIC_FUNNEL_URL = context.env.PUBLIC_FUNNEL_URL || 'https://taqyeemi.pages.dev';

    return new Response(JSON.stringify({ SUPABASE_URL, SUPABASE_ANON_KEY, DASHBOARD_URL, OWNER_APP_URL, PUBLIC_FUNNEL_URL }), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

