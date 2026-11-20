const DEFAULT_SECRET = 'taqyeemi-dev-session-secret-min-32-chars';

async function getHmacKey(secret) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret || DEFAULT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionCookie(email, secret, isSecure = true) {
  const normalizedEmail = (email || '').toLowerCase().trim();
  const timestamp = Date.now().toString();
  const data = `${normalizedEmail}:${timestamp}`;
  const key = await getHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const signature = bufferToHex(sigBuffer);
  const token = `${btoa(data)}.${signature}`;
  const secureFlag = isSecure ? ' Secure;' : '';
  return `tqm_session=${token}; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=2592000`;
}

export async function clearSessionCookie(isSecure = true) {
  const secureFlag = isSecure ? ' Secure;' : '';
  return `tqm_session=; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=0`;
}

export async function verifySessionCookie(cookieHeader, secret) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/tqm_session=([^;]+)/);
  if (!match) return null;
  const token = match[1].trim();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  try {
    const rawData = atob(parts[0]);
    const signature = parts[1];
    const key = await getHmacKey(secret);
    const expectedSigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawData));
    const expectedSig = bufferToHex(expectedSigBuffer);
    if (signature !== expectedSig) return null;

    const [email, timestamp] = rawData.split(':');
    if (!email || !timestamp) return null;
    // 30 days expiration
    if (Date.now() - Number(timestamp) > 30 * 24 * 60 * 60 * 1000) return null;
    return email;
  } catch {
    return null;
  }
}
