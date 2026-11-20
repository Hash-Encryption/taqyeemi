import { jsonResponse, handleOptions } from './_auth.js';
import { verifySessionCookie } from './_session.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. Check for token auth via query parameter (?token=...) or Authorization header
  let token = url.searchParams.get('token');
  if (!token) {
    const authHeader = request.headers.get('Authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.slice(7).trim();
      if (candidate.startsWith('tqm_')) {
        token = candidate;
      }
    }
  }

  try {
    if (token) {
      const business = await env.DB.prepare(`
        SELECT id, name, google_maps_url, public_slug, owner_email, created_at
        FROM businesses
        WHERE secret_token = ?
      `).bind(token).first();

      if (!business) {
        return jsonResponse({ error: 'Invalid or expired secret token.' }, 401);
      }

      const { results: feedback } = await env.DB.prepare(`
        SELECT id, business_id, rating, comment, customer_contact, created_at
        FROM feedback
        WHERE business_id = ?
        ORDER BY created_at DESC
      `).bind(business.id).all();

      return jsonResponse({
        success: true,
        authMode: 'token',
        business,
        feedback: feedback || []
      });
    }

    // 2. Check for session cookie auth (owner_email)
    const cookieHeader = request.headers.get('Cookie');
    const ownerEmail = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);

    if (ownerEmail) {
      const { results: businesses } = await env.DB.prepare(`
        SELECT id, name, google_maps_url, public_slug, secret_token, owner_email, created_at
        FROM businesses
        WHERE LOWER(owner_email) = LOWER(?)
        ORDER BY created_at DESC
      `).bind(ownerEmail).all();

      if (!businesses || businesses.length === 0) {
        return jsonResponse({
          success: true,
          authMode: 'session',
          ownerEmail,
          businesses: [],
          feedback: []
        });
      }

      const placeholders = businesses.map(() => '?').join(',');
      const ids = businesses.map(b => b.id);

      const { results: feedback } = await env.DB.prepare(`
        SELECT id, business_id, rating, comment, customer_contact, created_at
        FROM feedback
        WHERE business_id IN (${placeholders})
        ORDER BY created_at DESC
      `).bind(...ids).all();

      return jsonResponse({
        success: true,
        authMode: 'session',
        ownerEmail,
        businesses,
        feedback: feedback || []
      });
    }

    // 3. No valid authentication provided
    return jsonResponse({
      error: 'Unauthorized. Provide ?token=<secret_token> or log in with owner email.'
    }, 401);

  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
