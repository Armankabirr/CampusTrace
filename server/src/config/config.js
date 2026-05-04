import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const requiredEnv = [
  'MONGO_URI',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REFRESH_TOKEN',
  'GOOGLE_USER',
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.warn(`Missing environment variable: ${key}`);
  }
}

const config = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campustrace',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  uploadMaxFileSizeBytes: Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  clientBaseUrl: process.env.CLIENT_BASE_URL || process.env.BASE_URL || 'http://localhost:5173',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  googleUser: process.env.GOOGLE_USER,
  imagekitPrivateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  imagekitPublicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  imagekitUrlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
};

export default config;
