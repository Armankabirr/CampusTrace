import config from '../config/config.js';

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildMimeMessage = ({ to, otp }) => {
  const subject = 'CampusTrace OTP Verification';
  const text = `Your CampusTrace verification code is ${otp}. It expires in ${config.otpExpiryMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="margin-bottom: 8px;">Verify your account</h2>
      <p style="margin-top: 0; color: #555;">Use the OTP below to complete signup.</p>
      <div style="font-size: 32px; letter-spacing: 6px; font-weight: bold; margin: 20px 0;">${escapeHtml(otp)}</div>
      <p style="color: #777;">This OTP will expire in ${config.otpExpiryMinutes} minutes.</p>
    </div>
  `;

  const mimeMessage = [
    `From: CampusTrace <${config.googleUser}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="campustrace-otp-boundary"',
    '',
    '--campustrace-otp-boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text,
    '',
    '--campustrace-otp-boundary',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    '',
    '--campustrace-otp-boundary--',
    '',
  ].join('\r\n');

  return Buffer.from(mimeMessage)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const refreshGmailAccessToken = async () => {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      refresh_token: config.googleRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Failed to refresh Gmail access token: ${errorBody}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
};

export const sendOtpEmail = async ({ to, otp }) => {
  try {
    const accessToken = await refreshGmailAccessToken();
    const raw = buildMimeMessage({ to, otp });

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (!sendResponse.ok) {
      const errorBody = await sendResponse.text();
      throw new Error(`Failed to send Gmail API message: ${errorBody}`);
    }

    return sendResponse.json();
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    console.warn(`OTP email delivery failed for ${to}: ${error.message}`);
    console.info(`CampusTrace OTP for ${to}: ${otp}`);
    return { fallback: true };
  }
};
