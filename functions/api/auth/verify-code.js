import { jsonResponse, handleOptions } from '../_auth.js';
import { createSessionCookie } from '../_session.js';

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

  const email = (body.email || '').trim().toLowerCase();
  const code = (body.code || '').trim();

  if (!email || !code) {
    return jsonResponse({ error: 'Both email and verification code are required.' }, 400);
  }

  try {
    const record = await env.DB.prepare(`
      SELECT email, code, expires_at 
      FROM auth_codes 
      WHERE LOWER(email) = LOWER(?)
    `).bind(email).first();

    if (!record || record.code !== code || Number(record.expires_at) < Date.now()) {
      return jsonResponse({ error: 'Invalid or expired verification code.' }, 400);
    }

    // Delete used auth code
    await env.DB.prepare(`
      DELETE FROM auth_codes 
      WHERE LOWER(email) = LOWER(?)
    `).bind(email).run();

    // Create signed HttpOnly session cookie
    const isSecure = new URL(request.url).protocol === 'https:';
    const cookie = await createSessionCookie(email, env.SESSION_SECRET, isSecure);

    return jsonResponse({
      success: true,
      email
    }, 200, {
      'Set-Cookie': cookie
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
