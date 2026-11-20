import { jsonResponse, handleOptions } from './_auth.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const ratingNum = parseInt(body.rating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return jsonResponse({ error: 'Rating must be an integer between 1 and 5.' }, 400);
  }

  const slug = (body.slug || '').trim();
  const rawClientId = (body.businessId || body.business_id || body.clientId || body.client_id || '').trim();

  let businessId = null;

  try {
    if (slug) {
      const biz = await env.DB.prepare('SELECT id FROM businesses WHERE public_slug = ?').bind(slug).first();
      if (!biz) {
        return jsonResponse({ error: `Business not found for slug '${slug}'.` }, 404);
      }
      businessId = biz.id;
    } else if (rawClientId) {
      const biz = await env.DB.prepare('SELECT id FROM businesses WHERE id = ?').bind(rawClientId).first();
      if (!biz) {
        return jsonResponse({ error: `Business not found for id '${rawClientId}'.` }, 404);
      }
      businessId = biz.id;
    } else {
      return jsonResponse({ error: 'Either slug or business_id is required.' }, 400);
    }

    const comment = body.comment !== undefined 
      ? String(body.comment).trim() 
      : (body.feedback_text !== undefined ? String(body.feedback_text).trim() : null);

    const customerContact = body.customerContact !== undefined 
      ? String(body.customerContact).trim() 
      : (body.customer_contact !== undefined ? String(body.customer_contact).trim() : null);

    const id = crypto.randomUUID();

    await env.DB.prepare(`
      INSERT INTO feedback (id, business_id, rating, comment, customer_contact)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, businessId, ratingNum, comment, customerContact).run();

    return jsonResponse({
      success: true,
      id,
      message: 'Feedback submitted successfully'
    }, 201);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
