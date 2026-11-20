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
      SELECT id, name, google_maps_url, public_slug 
      FROM businesses 
      WHERE public_slug = ?
    `).bind(slug).first();

    if (!business) {
      return jsonResponse({ error: 'Business not found' }, 404);
    }

    return jsonResponse({
      id: business.id,
      name: business.name,
      google_maps_url: business.google_maps_url,
      google_review_url: business.google_maps_url, // For legacy frontend compatibility
      public_slug: business.public_slug
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
