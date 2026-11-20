import { corsHeaders, jsonResponse, handleOptions, checkAdminAuth, generateSecretToken } from '../../_auth.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;

  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized. Invalid or missing admin secret.' }, 401);
  }

  const id = params.id;
  if (!id) {
    return jsonResponse({ error: 'Business ID is required in URL.' }, 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  try {
    const current = await env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first();
    if (!current) {
      return jsonResponse({ error: 'Business not found' }, 404);
    }

    const newName = body.name !== undefined ? String(body.name).trim() : current.name;
    const newUrl = (body.googleMapsUrl !== undefined ? body.googleMapsUrl : (body.google_maps_url !== undefined ? body.google_maps_url : current.google_maps_url));
    const finalUrl = String(newUrl).trim();

    let newEmail = current.owner_email;
    if (body.ownerEmail !== undefined || body.owner_email !== undefined) {
      const raw = body.ownerEmail !== undefined ? body.ownerEmail : body.owner_email;
      newEmail = raw ? String(raw).trim().toLowerCase() : null;
    }

    let newToken = current.secret_token;
    const shouldRotate = body.rotateToken === true || body.rotate_token === true;
    if (shouldRotate) {
      newToken = generateSecretToken();
    }

    await env.DB.prepare(`
      UPDATE businesses 
      SET name = ?, google_maps_url = ?, owner_email = ?, secret_token = ?
      WHERE id = ?
    `).bind(newName, finalUrl, newEmail, newToken, id).run();

    const updated = await env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first();

    const origin = new URL(request.url).origin;
    const privateDashboardLink = `${origin}/api/dashboard?token=${updated.secret_token}`;

    return jsonResponse({
      success: true,
      business: updated,
      tokenRotated: shouldRotate,
      privateDashboardLink
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
