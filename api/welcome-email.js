// api/welcome-email.js
// POST /api/welcome-email
// Called internally after a successful payment to send a welcome email.
// Body: { email, firstName, plan }

const nodemailer = require('nodemailer');
const { applyCors, rateLimit } = require('./_security');

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false', // true by default
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

function buildHtml(firstName, plan) {
  const planLabel = plan === 'umrah'
    ? 'Full VR Umrah Experience'
    : 'Full VR Hajj Experience';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Welcome to Pilgrim's Path</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a00 0%,#3d1f00 60%,#C9A84C 100%);padding:36px 40px 28px;text-align:center;">
            <p style="margin:0 0 4px;color:#C9A84C;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Pilgrim's Path</h1>
            <p style="margin:6px 0 0;color:#D4AF5A;font-size:14px;">The World's First Free VR Hajj &amp; Umrah Experience</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 16px;color:#2C1810;font-size:22px;font-weight:700;">As-salamu alaykum, ${firstName}! 🕋</p>
            <p style="margin:0 0 16px;color:#444;font-size:15px;line-height:1.6;">JazakAllah khayran for joining <strong>Pilgrim's Path</strong>. Your access to the <strong>${planLabel}</strong> has been confirmed. May Allah accept your preparation and grant you the opportunity to perform Hajj.</p>

            <div style="background:#FBF7EE;border:1px solid #E8D89A;border-radius:8px;padding:20px 24px;margin:24px 0;">
              <p style="margin:0 0 10px;color:#8B6914;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What's Included</p>
              <ul style="margin:0;padding:0 0 0 18px;color:#3D2B1F;font-size:14px;line-height:1.8;">
                <li>360° immersive VR scenes of every Hajj ritual</li>
                <li>Step-by-step guided narration in English</li>
                <li>Interactive stone-throwing at Jamarat</li>
                <li>Duas, supplications, and Islamic context for each step</li>
                <li>Works on any device — phone, tablet, desktop or VR headset</li>
              </ul>
            </div>

            <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">Visit your dashboard to begin your journey:</p>

            <div style="text-align:center;margin:0 0 28px;">
              <a href="https://pilgrimspath.io/dashboard.html"
                 style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#8B6914);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(201,168,76,0.4);">
                Begin Your Journey ▸
              </a>
            </div>

            <p style="margin:0 0 8px;color:#666;font-size:13px;line-height:1.6;">If you have any questions, simply reply to this email and we'll be happy to help.</p>
            <p style="margin:0;color:#666;font-size:13px;line-height:1.6;">Wassalam,<br><strong style="color:#2C1810;">The Pilgrim's Path Team</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F5F0E8;padding:20px 40px;text-align:center;border-top:1px solid #E8D89A;">
            <p style="margin:0 0 4px;color:#8B6914;font-size:12px;font-weight:600;">Pilgrim's Path · pilgrimspath.io</p>
            <p style="margin:0;color:#999;font-size:11px;">You received this because you purchased access. Questions? Email us at support@pilgrimspath.io</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (!applyCors(req, res, 'POST, OPTIONS')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;

  const { email, firstName, plan } = req.body || {};

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const safeName = (typeof firstName === 'string' && firstName.trim())
    ? firstName.trim().slice(0, 60).replace(/[<>"'&]/g, '')
    : 'Pilgrim';
  const safePlan = (plan === 'umrah') ? 'umrah' : 'hajj';

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[WelcomeEmail] SMTP not configured — skipping send');
    return res.status(200).json({ sent: false, reason: 'smtp_not_configured' });
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.MAIL_FROM || `"Pilgrim's Path" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Welcome to Pilgrim's Path — Your VR Journey Awaits 🕋`,
      html: buildHtml(safeName, safePlan),
    });
    console.log('[WelcomeEmail] sent to', email);
    return res.status(200).json({ sent: true });
  } catch (err) {
    console.error('[WelcomeEmail] send failed:', err.message);
    // Don't expose SMTP internals to the caller
    return res.status(500).json({ error: 'Email delivery failed' });
  }
};
