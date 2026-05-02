import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import Otp from '../models/otp.model.js';
import Session from '../models/session.model.js';
import config from '../config/config.js';
import {
  generateOtp,
  hashValue,
  refreshTokenCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../utils/utils.js';
import { sendOtpEmail } from '../services/email.service.js';

const buildTokenPayload = (user) => ({ sub: user._id.toString(), role: user.role });

const parseRefreshExpiryDate = () => {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
};

export const register = async (req, res) => {
  try {
    const { name, studentId, email, phone, password } = req.body;

    if (!name || !studentId || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { studentId: String(studentId).trim() }],
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email or student ID.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const userValidationProbe = new User({
      name: String(name).trim(),
      studentId: String(studentId).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      password: passwordHash,
    });
    const validationError = userValidationProbe.validateSync();

    if (validationError) {
      const firstIssue = Object.values(validationError.errors)[0];
      return res.status(400).json({
        message: firstIssue?.message || 'Registration payload is invalid.',
      });
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        pendingUser: {
          name: String(name).trim(),
          studentId: String(studentId).trim(),
          email: normalizedEmail,
          phone: String(phone).trim(),
          password: passwordHash,
        },
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail({ to: normalizedEmail, otp });

    return res.status(200).json({
      message: 'OTP sent to email. Verify OTP to create account.',
      email: normalizedEmail,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to register.' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(404).json({ message: 'OTP session not found. Register again.' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(410).json({ message: 'OTP expired. Register again.' });
    }

    if (otpRecord.otpHash !== hashValue(String(otp))) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const exists = await User.findOne({
      $or: [
        { email: otpRecord.pendingUser.email },
        { studentId: otpRecord.pendingUser.studentId },
      ],
    });

    if (exists) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(409).json({ message: 'User already exists.' });
    }

    const user = await User.create({
      name: otpRecord.pendingUser.name,
      studentId: otpRecord.pendingUser.studentId,
      email: otpRecord.pendingUser.email,
      phone: otpRecord.pendingUser.phone,
      password: otpRecord.pendingUser.password,
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(201).json({
      message: 'Email verified and account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to verify email.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(String(password), user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const refreshTokenHash = hashValue(refreshToken);

    await Session.create({
      user: user._id,
      refreshTokenHash,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
      expiresAt: parseRefreshExpiryDate(),
    });

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());

    return res.status(200).json({
      message: 'Login successful.',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to login.' });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const userId = req.user._id;

    if (!name && !phone && !location) {
      return res.status(400).json({ message: 'At least one field is required for update.' });
    }

    const updateData = {};
    
    if (name) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ message: 'Name must be between 2 and 100 characters.' });
      }
      updateData.name = trimmedName;
    }
    
    if (phone) {
      const trimmedPhone = String(phone).trim();
      const PHONE_REGEX = /^(?:\+8801|01)[3-9]\d{8}$/;
      if (!PHONE_REGEX.test(trimmedPhone)) {
        return res.status(400).json({ message: 'Please provide a valid Bangladeshi phone number.' });
      }
      updateData.phone = trimmedPhone;
    }
    
    if (location) {
      updateData.location = String(location).trim();
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update profile.' });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token is required.' });
    }

    const tokenHash = hashValue(token);
    const session = await Session.findOne({ refreshTokenHash: tokenHash, revoked: false });

    if (!session) {
      return res.status(401).json({ message: 'Session not found or revoked.' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      session.revoked = true;
      await session.save();
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      session.revoked = true;
      await session.save();
      return res.status(401).json({ message: 'User not found.' });
    }

    const nextPayload = buildTokenPayload(user);
    const nextAccessToken = signAccessToken(nextPayload);
    const nextRefreshToken = signRefreshToken(nextPayload);

    session.refreshTokenHash = hashValue(nextRefreshToken);
    session.expiresAt = parseRefreshExpiryDate();
    await session.save();

    res.cookie('refreshToken', nextRefreshToken, refreshTokenCookieOptions());

    return res.status(200).json({
      message: 'Token refreshed.',
      accessToken: nextAccessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to refresh token.' });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await Session.updateOne({ refreshTokenHash: hashValue(token) }, { revoked: true });
    }

    res.clearCookie('refreshToken', refreshTokenCookieOptions());

    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to logout.' });
  }
};

export const logoutAll = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token is required.' });
    }

    const payload = verifyToken(token);

    await Session.updateMany({ user: payload.sub, revoked: false }, { revoked: true });

    res.clearCookie('refreshToken', refreshTokenCookieOptions());

    return res.status(200).json({ message: 'Logged out from all sessions.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to logout all sessions.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'User with this email not found.' });
    }

    const otp = generateOtp();
    const otpHash = hashValue(otp);
    const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otpHash,
        type: 'password_reset',
        userId: user._id,
        attempts: 0,
        expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendOtpEmail({ to: normalizedEmail, otp, type: 'password_reset' });

    return res.status(200).json({
      message: 'OTP sent to your email. Use it to reset your password.',
      email: normalizedEmail,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to process forgot password request.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(404).json({ message: 'OTP session not found.' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(410).json({ message: 'OTP expired.' });
    }

    if (otpRecord.otpHash !== hashValue(String(otp))) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await User.findByIdAndUpdate(user._id, { password: passwordHash });

    await Otp.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to reset password.' });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(404).json({ message: 'OTP session not found.' });
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(410).json({ message: 'OTP expired.' });
    }

    if (otpRecord.otpHash !== hashValue(String(otp))) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    return res.status(200).json({
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to verify OTP.' });
  }
};
