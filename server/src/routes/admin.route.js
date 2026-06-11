import { Router } from 'express';
import { getDashboardSummary } from '../controllers/admin.controller.js';
import {
	broadcastAdminNotification,
	createFraudReport,
	createManualMatch,
	deleteAdminReport,
	deleteAdminUser,
	getAdminClaims,
	getAdminClaimById,
	getAdminMatchById,
	getAdminMatches,
	getAdminNotificationHistory,
	getAdminReportById,
	getAdminReports,
	getAdminUserById,
	getAdminUsers,
	getAuditLogs,
	getFraudReports,
	updateAdminClaimStatus,
	updateAdminMatchStatus,
	updateAdminReport,
	updateAdminReportStatus,
	updateAdminUserRole,
	updateAdminUserStatus,
	updateFraudReport,
	getAdminReviews,
	getAdminReviewsAnalytics,
	moderateAdminReview,
	removeAdminReview,
} from '../controllers/admin.ops.controller.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/dashboard', requireAuth, requireAdmin, getDashboardSummary);

router.get('/users', requireAuth, requireAdmin, getAdminUsers);
router.get('/users/:userId', requireAuth, requireAdmin, getAdminUserById);
router.patch('/users/:userId/role', requireAuth, requireAdmin, updateAdminUserRole);
router.patch('/users/:userId/status', requireAuth, requireAdmin, updateAdminUserStatus);
router.delete('/users/:userId', requireAuth, requireAdmin, deleteAdminUser);

router.get('/reports', requireAuth, requireAdmin, getAdminReports);
router.get('/reports/:reportId', requireAuth, requireAdmin, getAdminReportById);
router.patch('/reports/:reportId', requireAuth, requireAdmin, updateAdminReport);
router.patch('/reports/:reportId/status', requireAuth, requireAdmin, updateAdminReportStatus);
router.delete('/reports/:reportId', requireAuth, requireAdmin, deleteAdminReport);

router.get('/claims', requireAuth, requireAdmin, getAdminClaims);
router.get('/claims/:claimId', requireAuth, requireAdmin, getAdminClaimById);
router.patch('/claims/:claimId/status', requireAuth, requireAdmin, updateAdminClaimStatus);

router.get('/matches', requireAuth, requireAdmin, getAdminMatches);
router.get('/matches/:matchId', requireAuth, requireAdmin, getAdminMatchById);
router.post('/matches/manual', requireAuth, requireAdmin, createManualMatch);
router.patch('/matches/:matchId/status', requireAuth, requireAdmin, updateAdminMatchStatus);

router.get('/audit-logs', requireAuth, requireAdmin, getAuditLogs);

router.get('/reviews/analytics', requireAuth, requireAdmin, getAdminReviewsAnalytics);
router.get('/reviews', requireAuth, requireAdmin, getAdminReviews);
router.patch('/reviews/:claimId/:reviewType/moderate', requireAuth, requireAdmin, moderateAdminReview);
router.delete('/reviews/:claimId/:reviewType', requireAuth, requireAdmin, removeAdminReview);

router.get('/fraud-reports', requireAuth, requireAdmin, getFraudReports);
router.post('/fraud-reports', requireAuth, requireAdmin, createFraudReport);
router.patch('/fraud-reports/:fraudReportId', requireAuth, requireAdmin, updateFraudReport);

router.get('/notifications', requireAuth, requireAdmin, getAdminNotificationHistory);
router.post('/notifications/broadcast', requireAuth, requireAdmin, broadcastAdminNotification);

export default router;