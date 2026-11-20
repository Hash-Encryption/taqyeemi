import { corsHeaders, jsonResponse, handleOptions, checkAdminAuth, generateSecretToken, generateUniqueSlug } from '../_auth.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized. Invalid or missing admin secret.' }, 401);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT 
        b.id,
        b.name,
        b.google_maps_url,
        b.public_slug,
        b.secret_token,
        b.owner_email,
        b.created_at,
        COUNT(f.id) AS feedback_count
      FROM businesses b
      LEFT JOIN feedback f ON f.business_id = b.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `).all();

    return jsonResponse({ success: true, businesses: results || [] });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized. Invalid or missing admin secret.' }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const name = (body.name || '').trim();
  const googleMapsUrl = (body.googleMapsUrl || body.google_maps_url || '').trim();
  const ownerEmail = (body.ownerEmail || body.owner_email || '').trim().toLowerCase() || null;

  if (!name || !googleMapsUrl) {
    return jsonResponse({ error: 'Both name and googleMapsUrl are required.' }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const publicSlug = await generateUniqueSlug(env.DB, name);
    const secretToken = generateSecretToken();

    await env.DB.prepare(`
      INSERT INTO businesses (id, name, google_maps_url, public_slug, secret_token, owner_email)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, name, googleMapsUrl, publicSlug, secretToken, ownerEmail).run();

    const origin = new URL(request.url).origin;
    const publicLink = `${origin}/?c=${publicSlug}`;
    const privateDashboardLink = `${origin}/api/dashboard?token=${secretToken}`;
    const embedIframeCode = `<iframe src="${publicLink}" width="100%" height="600" frameborder="0"></iframe>`;

    return jsonResponse({
      success: true,
      id,
      name,
      googleMapsUrl,
      publicSlug,
      secretToken,
      ownerEmail,
      publicLink,
      privateDashboardLink,
      embedIframeCode
    }, 201);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
