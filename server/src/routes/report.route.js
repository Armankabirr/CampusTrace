import { Router } from 'express';
import multer from 'multer';
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

export default router;
