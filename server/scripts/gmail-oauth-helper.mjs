import config from '../src/config/config.js';

const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
const SCOPE = 'https://www.googleapis.com/auth/gmail.send';

const printUsage = () => {
  console.log('Usage:');
  console.log('  node scripts/gmail-oauth-helper.mjs auth-url');
  console.log('  node scripts/gmail-oauth-helper.mjs exchange <authorization_code>');
  console.log('Optional env: GOOGLE_REDIRECT_URI (default: http://localhost:3000/oauth2callback)');
};

const ensureClientConfig = () => {
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  }
};

const printAuthUrl = () => {
  ensureClientConfig();

  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
  });

  console.log('Open this URL in your browser and complete consent:');
  console.log(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

const exchangeCode = async (code) => {
  ensureClientConfig();

  if (!code) {
    throw new Error('Authorization code is required.');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const payload = await tokenResponse.json();

  if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(payload)}`);
  }

  if (!payload.refresh_token) {
    console.log('Token response did not include a refresh_token.');
    console.log('Use prompt=consent and ensure this is the first grant for this client/user/scope pair.');
  }

  console.log('Token exchange successful.');
  console.log('Set this in server/.env:');
  console.log(`GOOGLE_REFRESH_TOKEN=${payload.refresh_token || ''}`);
};

const main = async () => {
  const [, , command, ...rest] = process.argv;

  if (command === 'auth-url') {
    printAuthUrl();
    return;
  }

  if (command === 'exchange') {
    await exchangeCode(rest[0]);
    return;
  }

  printUsage();
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
