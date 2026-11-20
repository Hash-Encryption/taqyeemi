export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function checkAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const adminSecret = env.ADMIN_SECRET || 'dev-admin-secret-replace-in-production';
  return Boolean(token && token === adminSecret);
}

export function generateSecretToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `tqm_${hex}`;
}

export async function generateUniqueSlug(db, name) {
  let baseSlug = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'business';

  let candidate = baseSlug;
  const existing = await db.prepare('SELECT id FROM businesses WHERE public_slug = ?').bind(candidate).first();
  if (!existing) {
    return candidate;
  }

  for (let i = 0; i < 5; i++) {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    const suffix = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    candidate = `${baseSlug}-${suffix}`;
    const taken = await db.prepare('SELECT id FROM businesses WHERE public_slug = ?').bind(candidate).first();
    if (!taken) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}
