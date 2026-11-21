import { jsonResponse, handleOptions } from '../../_auth.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const slug = params.slug;

  if (!slug) {
    return jsonResponse({ error: 'Slug parameter is required.' }, 400);
  }

  try {
    const business = await env.DB.prepare(`
      SELECT id, name, google_maps_url, public_slug, is_active 
      FROM businesses 
      WHERE public_slug = ?
    `).bind(slug).first();

    if (!business || business.is_active === 0) {
      return jsonResponse({ error: 'Business not found or inactive' }, 404);
    }

    return jsonResponse({
      id: business.id,
      name: business.name,
      google_maps_url: business.google_maps_url,
      google_review_url: business.google_maps_url, // For legacy frontend compatibility
      public_slug: business.public_slug,
      is_active: business.is_active !== 0 ? 1 : 0,
      active: business.is_active !== 0
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
