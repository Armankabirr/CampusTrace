import { Router } from 'express';
import multer from 'multer';
import config from '../config/config.js';
import {
  createReport,
  getReports,
  getReportById,
  getUserReports,
  updateReportStatus,
  deleteReport,
} from '../controllers/report.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Configure multer for file uploads (stored in memory)
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

// Routes
router.post('/create', requireAuth, upload.single('image'), createReport);
router.get('/get-all', getReports);
router.get('/get/:id', getReportById);
router.get('/my-reports', requireAuth, getUserReports);
router.put('/update-status/:id', requireAuth, updateReportStatus);
router.delete('/delete/:id', requireAuth, deleteReport);

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
