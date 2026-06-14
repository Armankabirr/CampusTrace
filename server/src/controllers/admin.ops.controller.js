import User from '../models/user.model.js';
import Report from '../models/report.model.js';
import Claim from '../models/claim.model.js';
import Match from '../models/match.model.js';
import Notification from '../models/notification.model.js';
import Session from '../models/session.model.js';
import AuditLog from '../models/auditLog.model.js';
import FraudReport from '../models/fraudReport.model.js';
import { deleteImageFromImageKit } from '../services/imagekit.service.js';
import { logAuditEvent } from '../services/auditLog.service.js';
import { notifyUser } from '../services/notificationService.js';
import { findMatches } from '../services/matchingService.js';

const ADMIN_ROLES = ['student', 'moderator', 'fraud_investigator', 'admin', 'super_admin'];
const FRAUD_STATUSES = ['open', 'under_review', 'resolved', 'dismissed'];
const USER_ACCOUNT_STATUSES = ['active', 'suspended', 'deleted'];
const REPORT_STATUSES = ['pending', 'active', 'matched', 'resolved', 'archived'];
const CLAIM_STATUSES = ['pending', 'verified', 'rejected', 'completed', 'returned'];
const MATCH_STATUSES = ['pending', 'confirmed', 'rejected'];
const NOTIFICATION_TYPES = ['system_announcement', 'system_warning', 'system_notification', 'report_approved', 'report_rejected'];

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit || '20', 10) || 20));
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildSearchFilter = (fieldNames, search) => {
  if (!search) return null;

  const regex = new RegExp(escapeRegExp(search), 'i');
  return { $or: fieldNames.map((fieldName) => ({ [fieldName]: regex })) };
};

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  studentId: user.studentId,
  email: user.email,
  phone: user.phone,
  role: user.role,
  accountStatus: user.accountStatus,
  lastLoginAt: user.lastLoginAt,
  suspendedAt: user.suspendedAt,
  suspensionReason: user.suspensionReason,
  deletedAt: user.deletedAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const serializeReport = (report) => ({
  id: report._id,
  itemType: report.itemType,
  category: report.category,
  title: report.title,
  description: report.description,
  lastSeenLocation: report.lastSeenLocation,
  status: report.status,
  views: report.views,
  imageUrl: report.imageUrl,
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
  verificationMessage: claim.verificationMessage,
  notes: claim.notes,
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
  matchReasons: match.matchReasons || [],
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

const serializeAuditLog = (log) => ({
  id: log._id,
  action: log.action,
  targetType: log.targetType,
  targetId: log.targetId,
  summary: log.summary,
  severity: log.severity,
  changes: log.changes,
  metadata: log.metadata,
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

const serializeFraudReport = (fraudReport) => ({
  id: fraudReport._id,
  category: fraudReport.category,
  summary: fraudReport.summary,
  evidence: fraudReport.evidence || [],
  riskScore: fraudReport.riskScore,
  status: fraudReport.status,
  investigationNotes: fraudReport.investigationNotes,
  resolution: fraudReport.resolution,
  resolvedAt: fraudReport.resolvedAt,
  assignedTo: fraudReport.assignedTo
    ? {
      id: fraudReport.assignedTo._id,
      name: fraudReport.assignedTo.name,
      email: fraudReport.assignedTo.email,
      role: fraudReport.assignedTo.role,
    }
    : null,
  reporter: fraudReport.reporterUserId
    ? {
      id: fraudReport.reporterUserId._id,
      name: fraudReport.reporterUserId.name,
      email: fraudReport.reporterUserId.email,
      role: fraudReport.reporterUserId.role,
    }
    : null,
  targetUser: fraudReport.targetUserId
    ? {
      id: fraudReport.targetUserId._id,
      name: fraudReport.targetUserId.name,
      email: fraudReport.targetUserId.email,
      role: fraudReport.targetUserId.role,
    }
    : null,
  targetReport: fraudReport.targetReportId
    ? {
      id: fraudReport.targetReportId._id,
      title: fraudReport.targetReportId.title,
      itemType: fraudReport.targetReportId.itemType,
      category: fraudReport.targetReportId.category,
    }
    : null,
  targetClaim: fraudReport.targetClaimId
    ? {
      id: fraudReport.targetClaimId._id,
      status: fraudReport.targetClaimId.status,
    }
    : null,
  createdAt: fraudReport.createdAt,
  updatedAt: fraudReport.updatedAt,
});

const getUserCounts = async (userId) => {
  const [reportCount, claimCount, matchCount, fraudCount, sessionCount] = await Promise.all([
    Report.countDocuments({ userId }),
    Claim.countDocuments({ claimerId: userId }),
    Match.countDocuments({ $or: [{ lostUserId: userId }, { foundUserId: userId }] }),
    FraudReport.countDocuments({ $or: [{ reporterUserId: userId }, { targetUserId: userId }] }),
    Session.countDocuments({ user: userId, revoked: false }),
  ]);

  return { reportCount, claimCount, matchCount, fraudCount, sessionCount };
};

const getRolesForUserQuery = (role) => {
  if (!role) return null;
  if (!ADMIN_ROLES.includes(role)) return null;
  return role;
};

export const getAdminUsers = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { search, role, accountStatus } = req.query;

    const filter = {};
    const normalizedRole = getRolesForUserQuery(role);

    if (normalizedRole) {
      filter.role = normalizedRole;
    }

    if (accountStatus && USER_ACCOUNT_STATUSES.includes(accountStatus)) {
      filter.accountStatus = accountStatus;
    }

    const searchFilter = buildSearchFilter(['name', 'email', 'studentId', 'phone'], search);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const items = await Promise.all(
      users.map(async (user) => ({
        ...serializeUser(user),
        ...(await getUserCounts(user._id)),
      }))
    );

    return res.status(200).json({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return res.status(500).json({ message: 'Failed to load users.' });
  }
};

export const getAdminUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const [counts, recentReports, recentClaims, recentMatches, recentFraudReports] = await Promise.all([
      getUserCounts(user._id),
      Report.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
      Claim.find({ claimerId: user._id }).populate('reportId', 'title itemType category').sort({ createdAt: -1 }).limit(10).lean(),
      Match.find({ $or: [{ lostUserId: user._id }, { foundUserId: user._id }] })
        .populate('lostItemId', 'title itemType category')
        .populate('foundItemId', 'title itemType category')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      FraudReport.find({ $or: [{ reporterUserId: user._id }, { targetUserId: user._id }] })
        .populate('targetUserId', 'name email role')
        .populate('targetReportId', 'title itemType category')
        .populate('targetClaimId', 'status')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return res.status(200).json({
      user: serializeUser(user),
      counts,
      history: {
        reports: recentReports.map((report) => serializeReport({ ...report, userId: user })),
        claims: recentClaims.map(serializeClaim),
        matches: recentMatches.map(serializeMatch),
        fraudReports: recentFraudReports.map(serializeFraudReport),
      },
    });
  } catch (error) {
    console.error('Get admin user error:', error);
    return res.status(500).json({ message: 'Failed to load user.' });
  }
};

export const updateAdminUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!ADMIN_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'user.role.updated',
      targetType: 'User',
      targetId: user._id,
      summary: `${req.user?.name || 'Admin'} updated ${user.email}'s role from ${previousRole} to ${role}.`,
      changes: { before: { role: previousRole }, after: { role } },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'User role updated successfully.',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Update admin user role error:', error);
    return res.status(500).json({ message: 'Failed to update user role.' });
  }
};

export const updateAdminUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus, reason } = req.body;

    if (!USER_ACCOUNT_STATUSES.includes(accountStatus)) {
      return res.status(400).json({ message: 'Invalid account status.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const before = {
      accountStatus: user.accountStatus,
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
      deletedAt: user.deletedAt,
    };

    user.accountStatus = accountStatus;

    if (accountStatus === 'suspended') {
      user.suspendedAt = new Date();
      user.suspensionReason = reason ? String(reason).trim() : null;
      user.deletedAt = null;
    } else if (accountStatus === 'deleted') {
      user.deletedAt = new Date();
      user.suspendedAt = null;
      user.suspensionReason = reason ? String(reason).trim() : null;
    } else {
      user.suspendedAt = null;
      user.suspensionReason = null;
      user.deletedAt = null;
    }

    await user.save();
    await Session.updateMany({ user: user._id, revoked: false }, { revoked: true });

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'user.status.updated',
      targetType: 'User',
      targetId: user._id,
      summary: `${req.user?.name || 'Admin'} changed ${user.email} to ${accountStatus}.`,
      changes: { before, after: serializeUser(user) },
      severity: accountStatus === 'deleted' ? 'high' : 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'User status updated successfully.',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Update admin user status error:', error);
    return res.status(500).json({ message: 'Failed to update user status.' });
  }
};

export const deleteAdminUser = async (req, res) => {
  req.body = { ...(req.body || {}), accountStatus: 'deleted', reason: req.body?.reason || 'Deleted by administrator.' };
  return updateAdminUserStatus(req, res);
};

export const getAdminReports = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { search, itemType, category, status, ownerId } = req.query;

    const filter = {};
    if (itemType && ['lost', 'found'].includes(itemType)) {
      filter.itemType = itemType;
    }
    if (category) {
      filter.category = category;
    }
    if (status && REPORT_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (ownerId) {
      filter.userId = ownerId;
    }

    const searchFilter = buildSearchFilter(['title', 'description', 'lastSeenLocation', 'contactName', 'contactEmail'], search);
    if (searchFilter) {
      Object.assign(filter, searchFilter);
    }

    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .populate('userId', 'name email role accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      items: reports.map(serializeReport),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin reports error:', error);
    return res.status(500).json({ message: 'Failed to load reports.' });
  }
};

export const getAdminReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId).populate('userId', 'name email role accountStatus');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const [claims, matches] = await Promise.all([
      Claim.find({ reportId: report._id }).populate('claimerId', 'name email role accountStatus').sort({ createdAt: -1 }).lean(),
      Match.find({ $or: [{ lostItemId: report._id }, { foundItemId: report._id }] })
        .populate('lostItemId', 'title itemType category')
        .populate('foundItemId', 'title itemType category')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      report: serializeReport(report),
      claims: claims.map(serializeClaim),
      matches: matches.map(serializeMatch),
    });
  } catch (error) {
    console.error('Get admin report error:', error);
    return res.status(500).json({ message: 'Failed to load report.' });
  }
};

export const updateAdminReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const allowedFields = ['title', 'description', 'category', 'lastSeenLocation', 'contactName', 'contactEmail', 'contactPhone'];
    const updateData = {};

    for (const fieldName of allowedFields) {
      if (req.body[fieldName] !== undefined) {
        updateData[fieldName] = String(req.body[fieldName]).trim();
      }
    }

    const report = await Report.findById(reportId).populate('userId', 'name email role accountStatus');
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const before = serializeReport(report);
    Object.assign(report, updateData);
    await report.save();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'report.updated',
      targetType: 'Report',
      targetId: report._id,
      summary: `${req.user?.name || 'Admin'} edited report ${report.title}.`,
      changes: { before, after: serializeReport(report) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Report updated successfully.',
      report: serializeReport(report),
    });
  } catch (error) {
    console.error('Update admin report error:', error);
    return res.status(500).json({ message: 'Failed to update report.' });
  }
};

export const updateAdminReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, reason } = req.body;

    if (!REPORT_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid report status.' });
    }

    const report = await Report.findById(reportId).populate('userId', 'name email role accountStatus');
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const before = serializeReport(report);
    report.status = status;
    await report.save();

    if (before.status === 'pending' && report.userId) {
      if (status === 'active') {
        await Notification.create({
          userId: report.userId._id || report.userId,
          type: 'report_approved',
          reportId: report._id,
          message: 'Your report has been approved and is now visible to other students.',
        });

        findMatches(report).catch((error) => {
          console.error('Approved report matching error:', error);
        });
      }

      if (status === 'archived') {
        const trimmedReason = String(reason || '').trim();
        await Notification.create({
          userId: report.userId._id || report.userId,
          type: 'report_rejected',
          reportId: report._id,
          message: trimmedReason
            ? `Your report was rejected by the admin team. Reason: ${trimmedReason}`
            : 'Your report was rejected by the admin team. Please review and resubmit if needed.',
        });
      }
    }

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'report.status.updated',
      targetType: 'Report',
      targetId: report._id,
      summary: `${req.user?.name || 'Admin'} changed report ${report.title} to ${status}.`,
      changes: { before, after: serializeReport(report) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Report status updated successfully.',
      report: serializeReport(report),
    });
  } catch (error) {
    console.error('Update admin report status error:', error);
    return res.status(500).json({ message: 'Failed to update report status.' });
  }
};

export const deleteAdminReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId).populate('userId', 'name email role accountStatus');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (report.imageFileId) {
      try {
        await deleteImageFromImageKit(report.imageFileId);
      } catch (error) {
        console.error('Admin report image delete error:', error);
      }
    }

    await Report.findByIdAndDelete(report._id);

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'report.deleted',
      targetType: 'Report',
      targetId: report._id,
      summary: `${req.user?.name || 'Admin'} deleted report ${report.title}.`,
      changes: { before: serializeReport(report), after: null },
      severity: 'high',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({ message: 'Report deleted successfully.' });
  } catch (error) {
    console.error('Delete admin report error:', error);
    return res.status(500).json({ message: 'Failed to delete report.' });
  }
};

export const getAdminClaims = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { search, status, reportId, claimerId } = req.query;

    const filter = {};
    if (status && CLAIM_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (reportId) {
      filter.reportId = reportId;
    }
    if (claimerId) {
      filter.claimerId = claimerId;
    }

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { verificationMessage: regex },
        { notes: regex },
        { claimerName: regex },
        { claimerEmail: regex },
      ];
    }

    const claims = await Claim.find(filter)
      .populate('reportId', 'title itemType category')
      .populate('claimerId', 'name email role accountStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Claim.countDocuments(filter);

    return res.status(200).json({
      items: claims.map(serializeClaim),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin claims error:', error);
    return res.status(500).json({ message: 'Failed to load claims.' });
  }
};

export const updateAdminClaimStatus = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { status, notes, isVerified } = req.body;

    if (!CLAIM_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid claim status.' });
    }

    const claim = await Claim.findById(claimId).populate('reportId').populate('claimerId', 'name email role');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const before = serializeClaim(claim);
    claim.status = status;

    if (typeof isVerified === 'boolean') {
      claim.isVerified = isVerified;
    }

    if (notes !== undefined) {
      claim.notes = notes ? String(notes).trim() : null;
    }

    if (status === 'completed') {
      await Report.findByIdAndUpdate(claim.reportId._id, { status: 'matched' });
    }

    if (status === 'returned') {
      await Report.findByIdAndUpdate(claim.reportId._id, { status: 'resolved' });
    }

    await claim.save();

    if (claim.claimerId?.email) {
      await Notification.create({
        userId: claim.claimerId._id,
        type: status === 'rejected' ? 'claim_rejected' : 'claim_accepted',
        claimId: claim._id,
        reportId: claim.reportId._id,
        message: `Your claim for ${claim.reportId.title} was updated to ${status}.`,
        relatedUserId: req.user?._id || null,
      });
    }

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'claim.status.updated',
      targetType: 'Claim',
      targetId: claim._id,
      summary: `${req.user?.name || 'Admin'} changed claim ${claim._id} to ${status}.`,
      changes: { before, after: serializeClaim(claim) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Claim updated successfully.',
      claim: serializeClaim(claim),
    });
  } catch (error) {
    console.error('Update admin claim status error:', error);
    return res.status(500).json({ message: 'Failed to update claim.' });
  }
};

export const getAdminClaimById = async (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = await Claim.findById(claimId)
      .populate('reportId')
      .populate('claimerId', 'name email role accountStatus')
      .lean();

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    return res.status(200).json({ claim: serializeClaim(claim) });
  } catch (error) {
    console.error('Get admin claim error:', error);
    return res.status(500).json({ message: 'Failed to load claim.' });
  }
};

export const getAdminMatches = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { status, search } = req.query;
    const filter = {};

    if (status && MATCH_STATUSES.includes(status)) {
      filter.status = status;
    }

    const matches = await Match.find(filter)
      .populate('lostItemId', 'title itemType category description lastSeenLocation')
      .populate('foundItemId', 'title itemType category description lastSeenLocation')
      .populate('lostUserId', 'name email role accountStatus')
      .populate('foundUserId', 'name email role accountStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const items = search
      ? matches.filter((match) => {
        const haystack = [match.lostItemId?.title, match.foundItemId?.title, match.lostItemId?.category, match.foundItemId?.category]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return String(search).toLowerCase().split(' ').every((term) => haystack.includes(term));
      })
      : matches;

    const total = await Match.countDocuments(filter);

    return res.status(200).json({
      items: items.map(serializeMatch),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin matches error:', error);
    return res.status(500).json({ message: 'Failed to load matches.' });
  }
};

export const getAdminMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId)
      .populate('lostItemId', 'title itemType category description lastSeenLocation')
      .populate('foundItemId', 'title itemType category description lastSeenLocation')
      .populate('lostUserId', 'name email role accountStatus')
      .populate('foundUserId', 'name email role accountStatus')
      .lean();

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    return res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('Get admin match error:', error);
    return res.status(500).json({ message: 'Failed to load match.' });
  }
};

export const createManualMatch = async (req, res) => {
  try {
    const { lostItemId, foundItemId, matchScore = 100, matchReasons = ['Manual admin pairing'] } = req.body;

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({ message: 'lostItemId and foundItemId are required.' });
    }

    const [lostItem, foundItem] = await Promise.all([
      Report.findById(lostItemId),
      Report.findById(foundItemId),
    ]);

    if (!lostItem || !foundItem) {
      return res.status(404).json({ message: 'One or both reports were not found.' });
    }

    const existingMatch = await Match.findOne({ lostItemId: lostItem._id, foundItemId: foundItem._id });
    if (existingMatch) {
      return res.status(409).json({ message: 'A match already exists for this pair.' });
    }

    const match = await Match.create({
      lostItemId: lostItem._id,
      foundItemId: foundItem._id,
      lostUserId: lostItem.userId,
      foundUserId: foundItem.userId,
      matchScore: Math.max(0, Math.min(100, Number(matchScore) || 100)),
      matchReasons: Array.isArray(matchReasons) ? matchReasons.map((value) => String(value).trim()).filter(Boolean) : ['Manual admin pairing'],
      status: 'pending',
    });

    try {
      await notifyUser(match.lostUserId, match._id);
      match.notifiedLostUser = true;
      await match.save();
    } catch (error) {
      console.error('Manual match lost-user notification error:', error);
    }

    try {
      await notifyUser(match.foundUserId, match._id);
      match.notifiedFoundUser = true;
      await match.save();
    } catch (error) {
      console.error('Manual match found-user notification error:', error);
    }

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'match.manual.created',
      targetType: 'Match',
      targetId: match._id,
      summary: `${req.user?.name || 'Admin'} manually created a match between ${lostItem.title} and ${foundItem.title}.`,
      changes: { before: null, after: serializeMatch(match) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(201).json({
      message: 'Manual match created successfully.',
      match: serializeMatch(match),
    });
  } catch (error) {
    console.error('Create manual match error:', error);
    return res.status(500).json({ message: 'Failed to create match.' });
  }
};

export const updateAdminMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;

    if (!MATCH_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid match status.' });
    }

    const match = await Match.findById(matchId)
      .populate('lostItemId', 'title itemType category')
      .populate('foundItemId', 'title itemType category');

    if (!match) {
      return res.status(404).json({ message: 'Match not found.' });
    }

    const before = serializeMatch(match);
    match.status = status;
    await match.save();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'match.status.updated',
      targetType: 'Match',
      targetId: match._id,
      summary: `${req.user?.name || 'Admin'} changed match ${match._id} to ${status}.`,
      changes: { before, after: serializeMatch(match) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Match status updated successfully.',
      match: serializeMatch(match),
    });
  } catch (error) {
    console.error('Update admin match status error:', error);
    return res.status(500).json({ message: 'Failed to update match.' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { action, targetType, severity, actorUserId, search } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (severity) filter.severity = severity;
    if (actorUserId) filter.actorUserId = actorUserId;

    if (search) {
      filter.summary = { $regex: escapeRegExp(search), $options: 'i' };
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate('actorUserId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      items: logs.map(serializeAuditLog),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin audit logs error:', error);
    return res.status(500).json({ message: 'Failed to load audit logs.' });
  }
};

export const getFraudReports = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { status, category, targetUserId, search } = req.query;

    const filter = {};
    if (status && FRAUD_STATUSES.includes(status)) filter.status = status;
    if (category) filter.category = category;
    if (targetUserId) filter.targetUserId = targetUserId;
    if (search) filter.summary = { $regex: escapeRegExp(search), $options: 'i' };

    const [total, fraudReports] = await Promise.all([
      FraudReport.countDocuments(filter),
      FraudReport.find(filter)
        .populate('reporterUserId', 'name email role accountStatus')
        .populate('targetUserId', 'name email role accountStatus')
        .populate('targetReportId', 'title itemType category status')
        .populate('targetClaimId', 'status isVerified')
        .populate('assignedTo', 'name email role accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      items: fraudReports.map(serializeFraudReport),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get fraud reports error:', error);
    return res.status(500).json({ message: 'Failed to load fraud reports.' });
  }
};

export const createFraudReport = async (req, res) => {
  try {
    const {
      targetUserId = null,
      targetReportId = null,
      targetClaimId = null,
      category = 'other',
      summary,
      evidence = [],
      riskScore = 0,
      assignedTo = null,
    } = req.body;

    if (!summary) {
      return res.status(400).json({ message: 'Summary is required.' });
    }

    const fraudReport = await FraudReport.create({
      reporterUserId: req.user?._id || null,
      targetUserId: targetUserId || null,
      targetReportId: targetReportId || null,
      targetClaimId: targetClaimId || null,
      category,
      summary: String(summary).trim(),
      evidence: Array.isArray(evidence) ? evidence.map((entry) => String(entry).trim()).filter(Boolean) : [],
      riskScore: Math.max(0, Math.min(100, Number(riskScore) || 0)),
      assignedTo: assignedTo || null,
      status: 'open',
    });

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'fraud.created',
      targetType: 'FraudReport',
      targetId: fraudReport._id,
      summary: `${req.user?.name || 'Admin'} created a fraud report.`,
      changes: { before: null, after: serializeFraudReport(fraudReport) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(201).json({
      message: 'Fraud report created successfully.',
      fraudReport: serializeFraudReport(fraudReport),
    });
  } catch (error) {
    console.error('Create fraud report error:', error);
    return res.status(500).json({ message: 'Failed to create fraud report.' });
  }
};

export const updateFraudReport = async (req, res) => {
  try {
    const { fraudReportId } = req.params;
    const fraudReport = await FraudReport.findById(fraudReportId);

    if (!fraudReport) {
      return res.status(404).json({ message: 'Fraud report not found.' });
    }

    const before = serializeFraudReport(await FraudReport.findById(fraudReportId)
      .populate('reporterUserId', 'name email role accountStatus')
      .populate('targetUserId', 'name email role accountStatus')
      .populate('targetReportId', 'title itemType category status')
      .populate('targetClaimId', 'status isVerified')
      .populate('assignedTo', 'name email role accountStatus')
      .lean());

    const { status, investigationNotes, resolution, riskScore, assignedTo } = req.body;

    if (status && FRAUD_STATUSES.includes(status)) {
      fraudReport.status = status;
    }
    if (investigationNotes !== undefined) {
      fraudReport.investigationNotes = investigationNotes ? String(investigationNotes).trim() : null;
    }
    if (resolution !== undefined) {
      fraudReport.resolution = resolution ? String(resolution).trim() : null;
    }
    if (riskScore !== undefined) {
      fraudReport.riskScore = Math.max(0, Math.min(100, Number(riskScore) || 0));
    }
    if (assignedTo !== undefined) {
      fraudReport.assignedTo = assignedTo || null;
    }
    if (status === 'resolved' || status === 'dismissed') {
      fraudReport.resolvedAt = new Date();
    }

    await fraudReport.save();

    const populatedFraudReport = await FraudReport.findById(fraudReport._id)
      .populate('reporterUserId', 'name email role accountStatus')
      .populate('targetUserId', 'name email role accountStatus')
      .populate('targetReportId', 'title itemType category status')
      .populate('targetClaimId', 'status isVerified')
      .populate('assignedTo', 'name email role accountStatus')
      .lean();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'fraud.updated',
      targetType: 'FraudReport',
      targetId: fraudReport._id,
      summary: `${req.user?.name || 'Admin'} updated fraud report ${fraudReport._id}.`,
      changes: { before, after: serializeFraudReport(populatedFraudReport) },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({
      message: 'Fraud report updated successfully.',
      fraudReport: serializeFraudReport(populatedFraudReport),
    });
  } catch (error) {
    console.error('Update fraud report error:', error);
    return res.status(500).json({ message: 'Failed to update fraud report.' });
  }
};

export const broadcastAdminNotification = async (req, res) => {
  try {
    const { message, type = 'system_notification', role, userIds = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
      return res.status(400).json({ message: 'Invalid broadcast type.' });
    }

    const filter = { accountStatus: 'active' };
    if (role && ADMIN_ROLES.includes(role)) {
      filter.role = role;
    }
    if (Array.isArray(userIds) && userIds.length > 0) {
      filter._id = { $in: userIds };
    }

    const users = await User.find(filter).select('_id name email role');
    if (!users.length) {
      return res.status(404).json({ message: 'No users matched the broadcast filters.' });
    }

    const notifications = users.map((user) => ({
      userId: user._id,
      type,
      message: String(message).trim(),
      relatedUserId: req.user?._id || null,
    }));

    await Notification.insertMany(notifications, { ordered: false });

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'notification.broadcast',
      targetType: 'Notification',
      targetId: null,
      summary: `${req.user?.name || 'Admin'} broadcasted a ${type} to ${users.length} users.`,
      changes: { message, type, role: role || null, userCount: users.length },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(201).json({
      message: 'Notification broadcast sent successfully.',
      count: users.length,
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return res.status(500).json({ message: 'Failed to broadcast notification.' });
  }
};

export const getAdminNotificationHistory = async (req, res) => {
  try {
    const { page, limit, skip } = buildPagination(req.query);
    const { type, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (search) filter.message = { $regex: escapeRegExp(search), $options: 'i' };

    const [total, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.find(filter)
        .populate('userId', 'name email role accountStatus')
        .populate('relatedUserId', 'name email role accountStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return res.status(200).json({
      items: notifications,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Get admin notification history error:', error);
    return res.status(500).json({ message: 'Failed to load notifications.' });
  }
};

export const getAdminReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, flagged, reviewType, rating } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const dbQuery = {
      $or: [
        { 'claimerReview.createdAt': { $ne: null } },
        { 'reporterReview.createdAt': { $ne: null } }
      ]
    };

    const claims = await Claim.find(dbQuery)
      .populate({
        path: 'reportId',
        select: 'title itemType category userId',
        populate: { path: 'userId', select: 'name email role' }
      })
      .populate('claimerId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    let reviewsList = [];
    for (const claim of claims) {
      if (claim.claimerReview && claim.claimerReview.createdAt) {
        reviewsList.push({
          claimId: claim._id,
          reviewType: 'claimer',
          rating: claim.claimerReview.rating,
          comment: claim.claimerReview.comment,
          createdAt: claim.claimerReview.createdAt,
          flagged: !!claim.claimerReview.flagged,
          moderated: !!claim.claimerReview.moderated,
          reviewer: {
            id: claim.claimerId?._id || claim.claimerId,
            name: claim.claimerId?.name || 'Unknown User',
            email: claim.claimerId?.email || '',
            role: claim.claimerId?.role || 'student'
          },
          report: {
            id: claim.reportId?._id || claim.reportId,
            title: claim.reportId?.title || 'Unknown Item',
            itemType: claim.reportId?.itemType || '',
            category: claim.reportId?.category || ''
          }
        });
      }

      if (claim.reporterReview && claim.reporterReview.createdAt) {
        const reporterUser = claim.reportId?.userId;
        reviewsList.push({
          claimId: claim._id,
          reviewType: 'reporter',
          rating: claim.reporterReview.rating,
          comment: claim.reporterReview.comment,
          createdAt: claim.reporterReview.createdAt,
          flagged: !!claim.reporterReview.flagged,
          moderated: !!claim.reporterReview.moderated,
          reviewer: {
            id: reporterUser?._id || reporterUser,
            name: reporterUser?.name || 'Unknown User',
            email: reporterUser?.email || '',
            role: reporterUser?.role || 'student'
          },
          report: {
            id: claim.reportId?._id || claim.reportId,
            title: claim.reportId?.title || 'Unknown Item',
            itemType: claim.reportId?.itemType || '',
            category: claim.reportId?.category || ''
          }
        });
      }
    }

    if (reviewType) {
      reviewsList = reviewsList.filter(r => r.reviewType === reviewType);
    }

    if (flagged !== undefined && flagged !== '') {
      const isFlagged = flagged === 'true';
      reviewsList = reviewsList.filter(r => r.flagged === isFlagged);
    }

    if (rating) {
      const ratingVal = parseInt(rating, 10);
      reviewsList = reviewsList.filter(r => r.rating === ratingVal);
    }

    if (search) {
      const s = search.toLowerCase();
      reviewsList = reviewsList.filter(r =>
        (r.comment && r.comment.toLowerCase().includes(s)) ||
        (r.reviewer.name && r.reviewer.name.toLowerCase().includes(s)) ||
        (r.reviewer.email && r.reviewer.email.toLowerCase().includes(s)) ||
        (r.report.title && r.report.title.toLowerCase().includes(s))
      );
    }

    reviewsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = reviewsList.length;
    const items = reviewsList.slice(skip, skip + limitNum);

    return res.status(200).json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (error) {
    console.error('Get admin reviews error:', error);
    return res.status(500).json({ message: 'Failed to load reviews.' });
  }
};

export const moderateAdminReview = async (req, res) => {
  try {
    const { claimId, reviewType } = req.params;
    const { flagged, moderated } = req.body;

    if (reviewType !== 'claimer' && reviewType !== 'reporter') {
      return res.status(400).json({ message: 'Invalid review type.' });
    }

    const claim = await Claim.findById(claimId).populate('reportId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const before = {
      claimerReview: { ...claim.claimerReview },
      reporterReview: { ...claim.reporterReview }
    };

    if (reviewType === 'claimer') {
      if (flagged !== undefined) claim.claimerReview.flagged = flagged;
      if (moderated !== undefined) claim.claimerReview.moderated = moderated;
    } else {
      if (flagged !== undefined) claim.reporterReview.flagged = flagged;
      if (moderated !== undefined) claim.reporterReview.moderated = moderated;
    }

    await claim.save();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'review.moderate',
      targetType: 'Claim',
      targetId: claim._id,
      summary: `${req.user?.name || 'Admin'} moderated ${reviewType} review on claim for report ${claim.reportId?.title || claim.reportId}.`,
      changes: { before, after: { claimerReview: claim.claimerReview, reporterReview: claim.reporterReview } },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({ message: 'Review updated successfully.' });
  } catch (error) {
    console.error('Moderate review error:', error);
    return res.status(500).json({ message: 'Failed to update review moderation status.' });
  }
};

export const removeAdminReview = async (req, res) => {
  try {
    const { claimId, reviewType } = req.params;

    if (reviewType !== 'claimer' && reviewType !== 'reporter') {
      return res.status(400).json({ message: 'Invalid review type.' });
    }

    const claim = await Claim.findById(claimId).populate('reportId');
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found.' });
    }

    const before = {
      claimerReview: { ...claim.claimerReview },
      reporterReview: { ...claim.reporterReview }
    };

    if (reviewType === 'claimer') {
      claim.claimerReview.comment = null;
      claim.claimerReview.moderated = true;
      claim.claimerReview.flagged = false;
    } else {
      claim.reporterReview.comment = null;
      claim.reporterReview.moderated = true;
      claim.reporterReview.flagged = false;
    }

    await claim.save();

    await logAuditEvent({
      actorUserId: req.user?._id || null,
      actorRole: req.user?.role || null,
      action: 'review.delete',
      targetType: 'Claim',
      targetId: claim._id,
      summary: `${req.user?.name || 'Admin'} removed inappropriate comment from ${reviewType} review on claim for report ${claim.reportId?.title || claim.reportId}.`,
      changes: { before, after: { claimerReview: claim.claimerReview, reporterReview: claim.reporterReview } },
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.status(200).json({ message: 'Review comment removed successfully.' });
  } catch (error) {
    console.error('Remove review error:', error);
    return res.status(500).json({ message: 'Failed to remove review comment.' });
  }
};

export const getAdminReviewsAnalytics = async (req, res) => {
  try {
    const claims = await Claim.find({
      $or: [
        { 'claimerReview.createdAt': { $ne: null } },
        { 'reporterReview.createdAt': { $ne: null } }
      ]
    }).lean();

    let totalRating = 0;
    let totalReviews = 0;
    let claimerRating = 0;
    let claimerCount = 0;
    let reporterRating = 0;
    let reporterCount = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let flaggedCount = 0;
    let moderatedCount = 0;

    for (const claim of claims) {
      if (claim.claimerReview && claim.claimerReview.createdAt) {
        const rating = claim.claimerReview.rating || 0;
        if (rating) {
          totalRating += rating;
          claimerRating += rating;
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        }
        totalReviews++;
        claimerCount++;
        if (claim.claimerReview.flagged) flaggedCount++;
        if (claim.claimerReview.moderated) moderatedCount++;
      }
      if (claim.reporterReview && claim.reporterReview.createdAt) {
        const rating = claim.reporterReview.rating || 0;
        if (rating) {
          totalRating += rating;
          reporterRating += rating;
          ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
        }
        totalReviews++;
        reporterCount++;
        if (claim.reporterReview.flagged) flaggedCount++;
        if (claim.reporterReview.moderated) moderatedCount++;
      }
    }

    return res.status(200).json({
      totalReviews,
      averageRating: totalReviews ? Number((totalRating / totalReviews).toFixed(1)) : 0,
      claimerAverage: claimerCount ? Number((claimerRating / claimerCount).toFixed(1)) : 0,
      reporterAverage: reporterCount ? Number((reporterRating / reporterCount).toFixed(1)) : 0,
      ratingDistribution,
      flaggedCount,
      moderatedCount
    });
  } catch (error) {
    console.error('Reviews analytics error:', error);
    return res.status(500).json({ message: 'Failed to compute reviews analytics.' });
  }
};
