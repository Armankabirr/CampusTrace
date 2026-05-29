import { Router } from 'express';
import { getDashboardSummary } from '../controllers/admin.controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', requireAuth, requireAdmin, getDashboardSummary);

export default router;