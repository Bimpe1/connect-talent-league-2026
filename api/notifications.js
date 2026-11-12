import { getDb, ensureTables } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    type = 'challenge_opened',
    challengeTitle = "Today's Challenge",
    challengeDay = 'Today',
    instructions = '',
    openTime = '09:00',
    closeTime = '21:00',
    recipients = []
  } = req.body || {};

  // Filter valid emails
  const validRecipients = recipients
    .map(r => ({
      name: typeof r === 'string' ? r : r.name || 'Participant',
      email: typeof r === 'string' ? r.trim().toLowerCase() : (r.email || '').trim().toLowerCase()
    }))
    .filter(r => r.email && /\S+@\S+\.\S+/.test(r.email));

  if (validRecipients.length === 0) {
    return res.status(400).json({
      error: 'No valid recipient email addresses provided.'
    });
  }

  const isClosingSoon = type === 'closing_soon';
  const subject = isClosingSoon
    ? `⏳ 1 Hour Left: Submit "${challengeTitle}" (Connect Talent League 2026)`
    : `🚀 Today's Challenge is Live: "${challengeTitle}" (Connect Talent League 2026)`;

  const headline = isClosingSoon
    ? `One Hour Remaining to Submit Today's Challenge!`
    : `Today's Daily Challenge is Now Open!`;

  const bannerColor = isClosingSoon ? '#b45309' : '#0a2558';
  const badgeColor = isClosingSoon ? '#fef3c7' : '#ede9fe';
  const badgeTextColor = isClosingSoon ? '#92400e' : '#5b21b6';

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <tr>
          <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #0a2558 0%, #2e1065 50%, #4c1d95 100%); text-align: center; color: #ffffff;">
            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #c4b5fd; margin-bottom: 6px;">
              Connect Talent League 2026
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3;">
              ${headline}
            </h1>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 32px;">
            
            <!-- Timing Badge -->
            <div style="background-color: ${badgeColor}; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
              <span style="font-size: 13px; font-weight: 700; color: ${badgeTextColor};">
                ${isClosingSoon ? '⏳ Submissions lock at ' + closeTime + ' sharp!' : '🟢 Submissions open now until ' + closeTime}
              </span>
            </div>

            <!-- Challenge Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #6d28d9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                ${challengeDay} · Up to 20 Talent Points
              </div>
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0a2558;">
                ${challengeTitle}
              </h2>
              ${instructions ? `<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155;">${instructions}</p>` : ''}
            </div>

            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 28px;">
              Remember: you can submit your evidence by writing a short note, recording a voice note, or uploading a photo or drawing. Effort, teamwork, and testing with a buddy count towards your score!
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="https://connect-talent-league-2026.vercel.app/" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0a2558 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(109, 40, 217, 0.25);">
                Open League App & Submit Now →
              </a>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                Connect Talent CIO · Registered Charity 1169975<br>
                <em>Learn together. Think creatively. Celebrate every step.</em>
              </p>
            </div>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  let deliveredCount = 0;
  let failedCount = 0;
  let providerUsed = process.env.RESEND_API_KEY ? 'resend' : 'simulated';
  let errorDetails = [];

  // Try live delivery if RESEND_API_KEY is configured
  if (process.env.RESEND_API_KEY) {
    const fromAddress = process.env.EMAIL_FROM || 'Connect Talent League <onboarding@resend.dev>';
    
    // Send to each recipient individually for privacy and per-recipient delivery resilience
    for (const recipient of validRecipients) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromAddress,
            to: recipient.email,
            subject,
            html: htmlBody
          })
        });

        if (resendRes.ok) {
          deliveredCount++;
        } else {
          failedCount++;
          const errData = await resendRes.json().catch(() => ({}));
          const errMsg = errData.message || `HTTP ${resendRes.status}`;
          console.warn(`Resend failed for ${recipient.email}:`, errMsg);
          errorDetails.push(`${recipient.email}: ${errMsg}`);
        }
      } catch (err) {
        failedCount++;
        console.warn(`Failed sending email to ${recipient.email}:`, err.message);
        errorDetails.push(`${recipient.email}: ${err.message}`);
      }
    }
  } else {
    // Simulated fallback when no RESEND_API_KEY
    deliveredCount = validRecipients.length;
  }

  // Construct helpful status message
  let responseMessage = '';
  if (providerUsed === 'resend') {
    if (deliveredCount > 0 && failedCount === 0) {
      responseMessage = `Successfully delivered live emails to ${deliveredCount} participant(s)!`;
    } else if (deliveredCount > 0 && failedCount > 0) {
      const isDomainRestriction = errorDetails.some(e => 
        e.toLowerCase().includes('only send testing emails') || 
        e.toLowerCase().includes('verify your domain') ||
        e.toLowerCase().includes('validation_error')
      );
      responseMessage = `Delivered to ${deliveredCount} participant(s). ${failedCount} skipped (${
        isDomainRestriction 
          ? 'Resend test sandbox only allows sending to your account email until you verify your domain at resend.com/domains' 
          : errorDetails[0]
      }).`;
    } else {
      const isDomainRestriction = errorDetails.some(e => 
        e.toLowerCase().includes('only send testing emails') || 
        e.toLowerCase().includes('verify your domain') ||
        e.toLowerCase().includes('validation_error')
      );
      responseMessage = isDomainRestriction
        ? `Resend Sandbox Restriction: The free test domain (onboarding@resend.dev) only delivers to your own registered Resend account email. To send to other emails, verify your domain at resend.com/domains.`
        : `Resend error: ${errorDetails[0] || 'Could not deliver emails.'}`;
    }
  } else {
    responseMessage = `Email queued for ${deliveredCount} participant(s) (simulated mode. Add RESEND_API_KEY to Vercel for live delivery).`;
  }

  // Record in Database Log
  try {
    const sql = getDb();
    if (sql) {
      await ensureTables(sql);
      const logId = `eml_${Date.now()}`;
      await sql`
        INSERT INTO email_logs (id, type, subject, recipients, recipient_count, status)
        VALUES (
          ${logId},
          ${type},
          ${subject},
          ${JSON.stringify(validRecipients.map(r => r.email))},
          ${deliveredCount},
          ${providerUsed === 'resend' ? (deliveredCount > 0 ? 'delivered' : 'failed') : 'simulated'}
        );
      `;
    }
  } catch (err) {
    console.warn('Could not record email log in DB:', err.message);
  }

  return res.status(200).json({
    success: deliveredCount > 0 || providerUsed === 'simulated',
    type,
    deliveredCount,
    failedCount,
    provider: providerUsed,
    recipients: validRecipients.map(r => r.email),
    message: responseMessage,
    errors: errorDetails
  });
}
