import { handleOptions, jsonResponse, checkAdminAuth } from '../_auth.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAdminAuth(request, env)) {
    return jsonResponse({ error: 'Unauthorized. Invalid or missing admin secret.' }, 401);
  }

  const url = new URL(request.url);
  const businessId = (url.searchParams.get('businessId') || url.searchParams.get('business_id') || '').trim();

  try {
    let query = `
      SELECT 
        f.id,
        f.business_id,
        f.rating,
        f.comment,
        f.customer_contact,
        f.is_read,
        f.created_at,
        b.name AS business_name,
        b.public_slug AS business_slug
      FROM feedback f
      JOIN businesses b ON f.business_id = b.id
    `;
    let stmt;
    if (businessId) {
      query += ` WHERE f.business_id = ? ORDER BY f.created_at DESC`;
      stmt = env.DB.prepare(query).bind(businessId);
    } else {
      query += ` ORDER BY f.created_at DESC`;
      stmt = env.DB.prepare(query);
    }

    const { results } = await stmt.all();
    return jsonResponse({ success: true, feedback: results || [] });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
