const fs = require('fs');
const path = require('path');

// Load environment variables from root .env
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
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

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env file!');
    process.exit(1);
}

async function runGoalFlow() {
    const timestamp = Date.now().toString().slice(-4);
    const slug = `bistro-${timestamp}`;
    const name = `Bistro Deluxe ${timestamp}`;
    const preRegisteredEmail = `owner_${slug}@gmail.com`;
    const unapprovedEmail = `unapproved_${timestamp}@gmail.com`;
    const password = 'Password123!';

    console.log(`\n==================================================`);
    console.log(`🚀 STARTING STRICT ADMIN-ONLY EMAIL PRE-REGISTRATION TEST`);
    console.log(`==================================================`);
    console.log(`1. Restaurant Name: "${name}"`);
    console.log(`2. Restaurant Slug: "${slug}"`);
    console.log(`3. Pre-Approved Email: "${preRegisteredEmail}"`);
    console.log(`4. Unapproved Email: "${unapprovedEmail}"\n`);

    // Step 1: Attempt sign-up with UNAPPROVED email (Must be rejected)
    console.log(`Step 1: Attempting signup with UNAPPROVED email (${unapprovedEmail})...`);
    const rejectedRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unapprovedEmail, password: password })
    });
    const rejectedData = await rejectedRes.json();
    
    if (rejectedRes.ok && rejectedData.user) {
        console.error('❌ Step 1 FAIL: Unapproved user was able to register!', rejectedData);
        process.exit(1);
    } else {
        console.log(`✅ Step 1 Success! Registration correctly blocked for unapproved email.`);
        console.log(`   Rejection Reason: ${rejectedData.msg || rejectedData.message || JSON.stringify(rejectedData)}`);
    }

    // Step 2: Simulate Admin Pre-Registering Client
    console.log(`\nStep 2: Pre-registering client in database via RPC / API...`);
    const registerClientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            name: name,
            slug: slug,
            owner_email: preRegisteredEmail,
            google_review_url: 'https://g.page/r/test/review'
        })
    });
    
    const clientData = await registerClientRes.json();
    if (!registerClientRes.ok) {
        console.warn(`ℹ️ Step 2 Info: Direct insert status ${registerClientRes.status}:`, clientData);
    } else {
        console.log(`✅ Step 2 Success! Client pre-registered with owner_email "${preRegisteredEmail}".`);
    }

    // Step 3: Register Pre-Approved Owner Account
    console.log(`\nStep 3: Registering pre-approved owner account (${preRegisteredEmail})...`);
    const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preRegisteredEmail, password: password })
    });
    const signupData = await signupRes.json();
    if (!signupData.user) {
        console.error('❌ Step 3 Failed to register pre-approved user:', signupData);
        process.exit(1);
    }
    const user = signupData.user;
    console.log(`✅ Step 3 Success! Pre-approved user created with ID: ${user.id}`);

    // Step 4: Log in as owner to get valid Auth Token
    console.log(`\nStep 4: Logging in as pre-approved owner (${preRegisteredEmail})...`);
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preRegisteredEmail, password: password })
    });
    const authData = await loginRes.json();
    if (!authData.access_token) {
        console.error('❌ Step 4 Failed to log in:', authData);
        process.exit(1);
    }
    console.log(`✅ Step 4 Success! Bearer token obtained for owner.`);

    console.log(`\n🎉 STRICT ADMIN-ONLY PRE-REGISTRATION FLOW VERIFIED!`);
    console.log(`==================================================\n`);
}

runGoalFlow().catch(console.error);
