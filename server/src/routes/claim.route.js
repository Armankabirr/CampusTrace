import { Router } from 'express';
import {
  createClaim,
  getMyClaimsAsClaimant,
  getPendingClaimsForReport,
  verifyClaim,
  getClaimById,
  getClaimerContactInfo,
  getReporterContactInfo,
} from '../controllers/claim.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes - More specific routes first
router.post('/create', requireAuth, createClaim);
router.get('/my-claims', requireAuth, getMyClaimsAsClaimant);
router.get('/by-report/:reportId', requireAuth, getPendingClaimsForReport);
router.get('/:claimId/claimer-contact', requireAuth, getClaimerContactInfo);
router.get('/:claimId/reporter-contact', requireAuth, getReporterContactInfo);
router.put('/:claimId/verify', requireAuth, verifyClaim);
router.get('/:claimId', requireAuth, getClaimById);

export default router;
