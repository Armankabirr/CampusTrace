import { Router } from 'express';
import {
  createClaim,
  getMyClaimsAsClaimant,
  getPendingClaimsForReport,
  verifyClaim,
  getClaimById,
  getClaimerContactInfo,
  getReporterContactInfo,
  submitClaimerFeedback,
  submitReporterFeedback,
} from '../controllers/claim.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Routes - More specific routes first (specific paths before generic :id routes)
router.post('/create', requireAuth, createClaim);
router.get('/my-claims', requireAuth, getMyClaimsAsClaimant);
router.get('/by-report/:reportId', requireAuth, getPendingClaimsForReport);

// Feedback routes must come before generic /:claimId routes
router.put('/:claimId/claimer-feedback', requireAuth, submitClaimerFeedback);
router.put('/:claimId/reporter-feedback', requireAuth, submitReporterFeedback);
router.put('/:claimId/verify', requireAuth, verifyClaim);

// Contact info routes
router.get('/:claimId/claimer-contact', requireAuth, getClaimerContactInfo);
router.get('/:claimId/reporter-contact', requireAuth, getReporterContactInfo);
router.get('/:claimId', requireAuth, getClaimById);

export default router;
