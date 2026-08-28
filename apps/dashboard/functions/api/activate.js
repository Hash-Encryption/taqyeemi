export async function onRequestPost(context) {
    const { request, env } = context;

    const SUPABASE_URL = env.SUPABASE_URL || 'https://tldzmrghbvqfaclantlr.supabase.co';
    const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({
            error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for First-Time Activation.'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }

    try {
        const body = await request.json();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        if (password.length < 8) {
            return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // 1. Verify pre-approval in clients table
        const clientRes = await fetch(
            `${SUPABASE_URL}/rest/v1/clients?owner_email=ilike.${encodeURIComponent(email)}&select=id,name,slug,owner_email,owner_user_id`,
            {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!clientRes.ok) {
            return new Response(JSON.stringify({ error: 'Failed to verify client pre-approval status' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const clients = await clientRes.json();
        if (!clients || clients.length === 0) {
            return new Response(JSON.stringify({
                error: 'Registration restricted: Email has not been pre-approved by Taqyeemi Administrator.'
            }), {
                status: 403,
                headers: corsHeaders
            });
        }

        const client = clients[0];

        // 2. Attempt to create confirmed user via Supabase Auth Admin API
        let userId = null;
        const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: { name: client.name }
            })
        });

        if (createRes.ok) {
            const newUser = await createRes.json();
            userId = newUser.id;
        } else {
            // User may already exist in auth.users
            // Look up existing user via admin API
            let existingUser = null;
            const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                }
            });

            if (listRes.ok) {
                const listData = await listRes.json();
                const userList = listData.users || (Array.isArray(listData) ? listData : []);
                existingUser = userList.find(u => u.email && u.email.toLowerCase() === email);
            }

            if (!existingUser) {
                // Try filter parameter
                const filterRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`, {
                    headers: {
                        'apikey': SUPABASE_SERVICE_ROLE_KEY,
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                    }
                });
                if (filterRes.ok) {
                    const filterData = await filterRes.json();
                    const filterList = filterData.users || (Array.isArray(filterData) ? filterData : []);
                    existingUser = filterList.find(u => u.email && u.email.toLowerCase() === email);
                }
            }

            if (existingUser) {
                // Check if already confirmed
                const isConfirmed = !!(existingUser.email_confirmed_at || existingUser.confirmed_at);
                if (isConfirmed) {
                    // Do NOT silently overwrite password of existing confirmed user
                    return new Response(JSON.stringify({
                        error: 'Account already activated. Please use the Log In tab with your password.'
                    }), {
                        status: 409,
                        headers: corsHeaders
                    });
                } else {
                    // Unconfirmed user recovery: update password and confirm email
                    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
                        method: 'PUT',
                        headers: {
                            'apikey': SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            password: password,
                            email_confirm: true
                        })
                    });

                    if (!updateRes.ok) {
                        const updateErr = await updateRes.json();
                        return new Response(JSON.stringify({
                            error: updateErr.message || 'Failed to activate existing unconfirmed account'
                        }), {
                            status: 500,
                            headers: corsHeaders
                        });
                    }
                    userId = existingUser.id;
                }
            } else {
                const errData = await createRes.json();
                return new Response(JSON.stringify({
                    error: errData.msg || errData.message || 'Failed to create user account'
                }), {
                    status: createRes.status,
                    headers: corsHeaders
                });
            }
        }

        // 3. Link client record to owner_user_id
        if (userId) {
            await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${client.id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    owner_user_id: userId
                })
            });

            // 4. Ensure owner role in user_roles
            await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SERVICE_ROLE_KEY,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    user_id: userId,
                    role: 'owner'
                })
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Account activated successfully',
            client_id: client.id,
            slug: client.slug
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}
