import nodemailer from 'nodemailer';
import config from '../config/config.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: config.googleUser,
    clientId: config.googleClientId,
    clientSecret: config.googleClientSecret,
    refreshToken: config.googleRefreshToken,
  },
});

export const sendOtpEmail = async ({ to, otp }) => {
  const mailOptions = {
    from: `CampusTrace <${config.googleUser}>`,
    to,
    subject: 'CampusTrace OTP Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">Verify your account</h2>
        <p style="margin-top: 0; color: #555;">Use the OTP below to complete signup.</p>
        <div style="font-size: 32px; letter-spacing: 6px; font-weight: bold; margin: 20px 0;">${otp}</div>
        <p style="color: #777;">This OTP will expire in ${config.otpExpiryMinutes} minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
