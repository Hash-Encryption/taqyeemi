export async function onRequestPost(context) {
    const { request, env } = context;

    const RESEND_API_KEY = env.RESEND_API_KEY || 're_CSiVQsu8_B9Y64tk7wZKtcSTvgBk67nXJ';
    const ADMIN_EMAIL = env.ADMIN_EMAIL || 'hgendi3@gmail.com';

    try {
        const body = await request.json();
        const { business_name, decision_maker_name, email, phone_number, google_maps_link, counter_count, is_resubmission } = body;

        const subject = `${is_resubmission ? '🔄 [Resubmission]' : '📬 [New Lead]'} Taqyeemi Request: ${business_name}`;
        
        const html = `
            <div style="font-family:'Inter',sans-serif; background:#121214; color:#e8eaed; padding:32px; border-radius:16px; max-width:560px;">
                <div style="border-bottom:2px solid #4285F4; padding-bottom:16px; margin-bottom:20px;">
                    <h2 style="color:#4285F4; margin:0; font-size:1.4rem;">Taqyeemi Lead Request Notification</h2>
                    <p style="color:#9aa0a6; margin:4px 0 0; font-size:0.85rem;">${is_resubmission ? 'A client has updated their existing application details.' : 'A new business has applied for access.'}</p>
                </div>

                <table style="width:100%; font-size:0.92rem; border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6; width:140px;"><strong>Business Name:</strong></td>
                        <td style="padding:8px 0; color:#ffffff;"><strong>${business_name}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6;"><strong>Contact Person:</strong></td>
                        <td style="padding:8px 0; color:#ffffff;">${decision_maker_name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6;"><strong>Email Address:</strong></td>
                        <td style="padding:8px 0; color:#4285f4;"><a href="mailto:${email}" style="color:#4285f4; text-decoration:none;">${email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6;"><strong>Phone Number:</strong></td>
                        <td style="padding:8px 0; color:#34a853;"><strong>${phone_number}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6;"><strong>Counters / Tables:</strong></td>
                        <td style="padding:8px 0; color:#fbbc05;"><strong>${counter_count}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0; color:#9aa0a6;"><strong>Google Maps Link:</strong></td>
                        <td style="padding:8px 0;"><a href="${google_maps_link}" target="_blank" style="color:#4285f4;">Open Maps Link ↗</a></td>
                    </tr>
                </table>

                <div style="margin-top:28px; padding-top:20px; border-top:1px solid #2c2f33; text-align:center;">
                    <a href="https://admin-taqyeemi-btl-pages.pages.dev" style="background:#4285F4; color:#ffffff; padding:12px 24px; border-radius:30px; text-decoration:none; font-weight:600; font-size:0.9rem; display:inline-block;">Open Admin Panel & Provision Access &rarr;</a>
                </div>
            </div>
        `;

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Taqyeemi Platform <onboarding@resend.dev>',
                to: [ADMIN_EMAIL],
                subject: subject,
                html: html
            })
        });

        const resendData = await resendRes.json();
        return new Response(JSON.stringify({ success: true, resend: resendData }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
