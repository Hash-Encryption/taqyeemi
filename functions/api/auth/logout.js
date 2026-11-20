import { jsonResponse, handleOptions } from '../_auth.js';
import { clearSessionCookie } from '../_session.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestPost(context) {
  const isSecure = new URL(context.request.url).protocol === 'https:';
  const cookie = await clearSessionCookie(isSecure);
  return jsonResponse({ success: true, message: 'Logged out successfully.' }, 200, {
    'Set-Cookie': cookie
  });
}

export async function onRequestGet(context) {
  const isSecure = new URL(context.request.url).protocol === 'https:';
  const cookie = await clearSessionCookie(isSecure);
  return jsonResponse({ success: true, message: 'Logged out successfully.' }, 200, {
    'Set-Cookie': cookie
  });
}
