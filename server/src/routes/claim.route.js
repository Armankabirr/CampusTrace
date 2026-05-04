import { Router } from 'express';
import multer from 'multer';
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
import config from '../config/config.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploadMaxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Routes - More specific routes first (specific paths before generic :id routes)
router.post('/create', requireAuth, upload.single('photo'), createClaim);
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

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        message: `Image too large. Maximum size is ${Math.round(config.uploadMaxFileSizeBytes / (1024 * 1024))}MB.`,
      });
    }

    return res.status(400).json({ message: error.message });
  }

  if (error?.message === 'Only image files are allowed') {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

export default router;
