import { Router } from 'express';
import {
  createClaim,
  getMyClaimsAsClaimant,
  getPendingClaimsForReport,
  verifyClaim,
  getClaimById,
} from '../controllers/claim.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes
router.post('/create', requireAuth, createClaim);
router.get('/my-claims', requireAuth, getMyClaimsAsClaimant);
router.get('/by-report/:reportId', requireAuth, getPendingClaimsForReport);
router.get('/:claimId', requireAuth, getClaimById);
router.put('/verify/:claimId', requireAuth, verifyClaim);

export default router;
