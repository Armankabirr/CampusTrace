import { Router } from 'express';
import {
  getMe,
  login,
  logout,
  logoutAll,
  refreshToken,
  register,
  updateProfile,
  verifyEmail,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/get-me', requireAuth, getMe);
router.put('/update-profile', requireAuth, updateProfile);
router.get('/refresh-token', refreshToken);
router.get('/logout', logout);
router.get('/logout-all', logoutAll);

export default router;
