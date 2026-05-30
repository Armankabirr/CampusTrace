import User from '../models/user.model.js';
import { verifyToken } from '../utils/utils.js';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'fraud_investigator'];

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Access token is required.' });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    if (user.accountStatus && user.accountStatus !== 'active') {
      return res.status(403).json({
        message:
          user.accountStatus === 'suspended'
            ? 'Your account has been suspended.'
            : 'Your account is no longer active.',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!ADMIN_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  return next();
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'You do not have permission to access this resource.' });
  }

  return next();
};

export const adminRoles = ADMIN_ROLES;
