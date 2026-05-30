import User from '../models/user.model.js';
import Report from '../models/report.model.js';
import Claim from '../models/claim.model.js';
import Match from '../models/match.model.js';
import Notification from '../models/notification.model.js';
import AuditLog from '../models/auditLog.model.js';
import FraudReport from '../models/fraudReport.model.js';

const STATUS_FIELDS = {
  report: ['active', 'matched', 'resolved', 'archived'],
  claim: ['pending', 'verified', 'rejected', 'completed', 'returned'],
  match: ['pending', 'confirmed', 'rejected'],
};

const mapCounts = (rows) =>
  rows.reduce((accumulator, row) => {
    accumulator[row._id] = row.count;
    return accumulator;
  }, {});

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  accountStatus: user.accountStatus,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

const serializeReport = (report) => ({
  id: report._id,
  title: report.title,
  itemType: report.itemType,
  category: report.category,
  status: report.status,
  owner: report.userId
    ? {
        id: report.userId._id,
        name: report.userId.name,
        email: report.userId.email,
        role: report.userId.role,
      }
    : null,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const serializeClaim = (claim) => ({
  id: claim._id,
  status: claim.status,
  isVerified: claim.isVerified,
  report: claim.reportId
    ? {
        id: claim.reportId._id,
        title: claim.reportId.title,
        itemType: claim.reportId.itemType,
        category: claim.reportId.category,
      }
    : null,
  claimer: claim.claimerId
    ? {
        id: claim.claimerId._id,
        name: claim.claimerId.name,
        email: claim.claimerId.email,
        role: claim.claimerId.role,
      }
    : null,
  createdAt: claim.createdAt,
  updatedAt: claim.updatedAt,
});

const serializeMatch = (match) => ({
  id: match._id,
  status: match.status,
  matchScore: match.matchScore,
  lostItem: match.lostItemId
    ? {
        id: match.lostItemId._id,
        title: match.lostItemId.title,
        itemType: match.lostItemId.itemType,
        category: match.lostItemId.category,
      }
    : null,
  foundItem: match.foundItemId
    ? {
        id: match.foundItemId._id,
        title: match.foundItemId.title,
        itemType: match.foundItemId.itemType,
        category: match.foundItemId.category,
      }
    : null,
  createdAt: match.createdAt,
  updatedAt: match.updatedAt,
});

const serializeNotification = (notification) => ({
  id: notification._id,
  type: notification.type,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  user: notification.userId
    ? {
        id: notification.userId._id,
        name: notification.userId.name,
        email: notification.userId.email,
        role: notification.userId.role,
      }
    : null,
});

const serializeAuditLog = (log) => ({
  id: log._id,
  action: log.action,
  targetType: log.targetType,
  targetId: log.targetId,
  summary: log.summary,
  severity: log.severity,
  changes: log.changes,
  createdAt: log.createdAt,
  actor: log.actorUserId
    ? {
        id: log.actorUserId._id,
        name: log.actorUserId.name,
        email: log.actorUserId.email,
        role: log.actorUserId.role,
      }
    : null,
});

const countByField = async (model, field, allowedValues) => {
  const rows = await model.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  const counts = mapCounts(rows);

  return allowedValues.map((value) => ({ value, count: counts[value] || 0 }));
};

const ROLE_FIELDS = ['student', 'moderator', 'fraud_investigator', 'admin', 'super_admin'];
const ACCOUNT_STATUS_FIELDS = ['active', 'suspended', 'deleted'];

export const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      roleCounts,
      accountStatusCounts,
      totalReports,
      totalClaims,
      totalMatches,
      totalNotifications,
      unreadNotifications,
      totalAuditLogs,
      totalFraudReports,
      openFraudReports,
      reportStatusCounts,
      claimStatusCounts,
      matchStatusCounts,
      recentUsers,
      recentReports,
      recentClaims,
      recentMatches,
      recentNotifications,
      reportTypeCounts,
      reportCategoryRows,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: 'active' }),
      countByField(User, 'role', ROLE_FIELDS),
      countByField(User, 'accountStatus', ACCOUNT_STATUS_FIELDS),
      Report.countDocuments(),
      Claim.countDocuments(),
      Match.countDocuments(),
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
      countByField(Report, 'status', STATUS_FIELDS.report),
      countByField(Claim, 'status', STATUS_FIELDS.claim),
      countByField(Match, 'status', STATUS_FIELDS.match),
      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      Report.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Claim.find()
        .populate('reportId', 'title itemType category')
        .populate('claimerId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Match.find()
        .populate('lostItemId', 'title itemType category')
        .populate('foundItemId', 'title itemType category')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Notification.find()
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      AuditLog.find()
        .populate('actorUserId', 'name email role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      FraudReport.countDocuments(),
      FraudReport.countDocuments({ status: 'open' }),
      countByField(Report, 'itemType', ['lost', 'found']),
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 6 },
      ]),
    ]);

    return res.status(200).json({
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          byRole: roleCounts,
          byStatus: accountStatusCounts,
        },
        reports: {
          total: totalReports,
          byStatus: reportStatusCounts,
          byType: reportTypeCounts,
        },
        claims: {
          total: totalClaims,
          byStatus: claimStatusCounts,
        },
        matches: {
          total: totalMatches,
          byStatus: matchStatusCounts,
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
        },
        auditLogs: {
          total: totalAuditLogs,
        },
        fraudReports: {
          total: totalFraudReports,
          open: openFraudReports,
        },
      },
      recent: {
        users: recentUsers.map(serializeUser),
        reports: recentReports.map(serializeReport),
        claims: recentClaims.map(serializeClaim),
        matches: recentMatches.map(serializeMatch),
        notifications: recentNotifications.map(serializeNotification),
        activities: recentAuditLogs.map(serializeAuditLog),
      },
      topCategories: reportCategoryRows,
    });
  } catch (error) {
    console.error('Get admin dashboard summary error:', error);
    return res.status(500).json({ message: 'Failed to load admin dashboard.' });
  }
};