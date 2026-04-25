import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

export const generateOtp = () => {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
};

export const signAccessToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessTokenExpiry });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.refreshTokenExpiry });
};

export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

export const refreshTokenCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: config.cookieSecure,
  domain: config.cookieDomain,
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
