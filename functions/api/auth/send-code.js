import { jsonResponse, handleOptions } from '../_auth.js';
import { sendOtpEmail } from '../_email.js';

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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return jsonResponse({ error: 'Valid email address is required.' }, 400);
  }

  try {
    const business = await env.DB.prepare(`
      SELECT id, name 
      FROM businesses 
      WHERE LOWER(owner_email) = LOWER(?) 
      LIMIT 1
    `).bind(email).first();

    if (business) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      await env.DB.prepare(`
        INSERT INTO auth_codes (email, code, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET 
          code = excluded.code, 
          expires_at = excluded.expires_at
      `).bind(email, code, expiresAt).run();

      await sendOtpEmail({
        email,
        code,
        businessName: business.name,
        env
      });
    }

    // Always return generic response to prevent email enumeration
    return jsonResponse({
      success: true,
      message: 'If an account exists with this email, a verification code has been sent.'
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
