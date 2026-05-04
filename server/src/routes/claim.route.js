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

console.log('[CLAIM.ROUTE] Importing claim routes');
console.log('[CLAIM.ROUTE] submitClaimerFeedback is:', typeof submitClaimerFeedback);
console.log('[CLAIM.ROUTE] submitReporterFeedback is:', typeof submitReporterFeedback);

const router = Router();

// Routes - More specific routes first
router.post('/create', requireAuth, createClaim);
router.get('/my-claims', requireAuth, getMyClaimsAsClaimant);
router.get('/by-report/:reportId', requireAuth, getPendingClaimsForReport);
router.get('/:claimId/claimer-contact', requireAuth, getClaimerContactInfo);
router.get('/:claimId/reporter-contact', requireAuth, getReporterContactInfo);

// TEST ROUTE - temporary for debugging
router.get('/:claimId/test-route', (req, res) => {
  console.log('[TEST-ROUTE] Request received for test route');
  res.json({ message: 'Test route works', claimId: req.params.claimId });
});

router.put('/:claimId/claimer-feedback', requireAuth, submitClaimerFeedback);
router.put('/:claimId/reporter-feedback', requireAuth, submitReporterFeedback);
router.put('/:claimId/verify', requireAuth, verifyClaim);
router.get('/:claimId', requireAuth, getClaimById);

export default router;
