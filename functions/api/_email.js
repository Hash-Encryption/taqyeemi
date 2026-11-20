export async function sendOtpEmail({ email, code, businessName, env }) {
  const apiKey = env?.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[AUTH DEV WARNING] RESEND_API_KEY not configured. Mock OTP code for ${email}: ${code}`);
    return { success: true, mocked: true };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM || 'Taqyeemi Login <auth@taqyeemi.com>',
      to: [email],
      subject: `Your Taqyeemi Login Code: ${code}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a73e8; margin-bottom: 8px;">Taqyeemi Portal Login</h2>
          <p style="color: #444; font-size: 15px;">Use the verification code below to log in to your review dashboard${businessName ? ` for <strong>${businessName}</strong>` : ''}.</p>
          <div style="background: #f1f3f4; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #202124; margin: 24px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 13px;">This code will expire in 10 minutes. If you did not request this login, you can safely ignore this email.</p>
        </div>
      `
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Failed to send email via Resend: ${res.status} - ${errorText}`);
    return { success: false, error: errorText };
  }

  return { success: true };
}
