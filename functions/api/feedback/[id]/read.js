import { handleOptions, jsonResponse, checkAdminAuth } from '../../_auth.js';
import { verifySessionCookie } from '../../_session.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const feedbackId = params.id;

  if (!feedbackId) {
    return jsonResponse({ error: 'Feedback ID is required.' }, 400);
  }

  try {
    const feedback = await env.DB.prepare(`
      SELECT f.id, f.business_id, b.secret_token, b.owner_email
      FROM feedback f
      JOIN businesses b ON f.business_id = b.id
      WHERE f.id = ?
    `).bind(feedbackId).first();

    if (!feedback) {
      return jsonResponse({ error: 'Feedback item not found.' }, 404);
    }

    let isAuthorized = false;

    // 1. Check Admin Auth
    if (checkAdminAuth(request, env)) {
      isAuthorized = true;
    }

    // 2. Check Token Auth (?token=... or Bearer tqm_...)
    if (!isAuthorized) {
      const url = new URL(request.url);
      let token = url.searchParams.get('token');
      if (!token) {
        const authHeader = request.headers.get('Authorization') || '';
        if (authHeader.startsWith('Bearer ')) {
          const candidate = authHeader.slice(7).trim();
          if (candidate.startsWith('tqm_')) token = candidate;
        }
      }
      if (token && token === feedback.secret_token) {
        isAuthorized = true;
      }
    }

    // 3. Check Session Cookie Auth
    if (!isAuthorized) {
      const cookieHeader = request.headers.get('Cookie');
      const sessionEmail = await verifySessionCookie(cookieHeader, env.SESSION_SECRET);
      if (sessionEmail && feedback.owner_email && sessionEmail.toLowerCase() === feedback.owner_email.toLowerCase()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return jsonResponse({ error: 'Unauthorized to mark this feedback as read.' }, 401);
    }

    await env.DB.prepare('UPDATE feedback SET is_read = 1 WHERE id = ?').bind(feedbackId).run();

    return jsonResponse({ success: true, id: feedbackId, is_read: 1 });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
