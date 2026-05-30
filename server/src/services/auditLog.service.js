import AuditLog from '../models/auditLog.model.js';

export const logAuditEvent = async ({
  actorUserId = null,
  actorRole = null,
  action,
  targetType,
  targetId = null,
  summary,
  changes = null,
  metadata = null,
  severity = 'low',
  ip = null,
  userAgent = null,
}) => {
  if (!action || !targetType || !summary) {
    return null;
  }

  try {
    return await AuditLog.create({
      actorUserId,
      actorRole,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      summary,
      changes,
      metadata,
      severity,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error('Audit log write failed:', error);
    return null;
  }
};