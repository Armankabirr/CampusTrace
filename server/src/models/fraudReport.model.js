import mongoose from 'mongoose';

const fraudReportSchema = new mongoose.Schema(
  {
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      default: null,
      index: true,
    },
    targetClaimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['spam', 'impersonation', 'fake_claim', 'duplicate_report', 'abuse', 'other'],
      default: 'other',
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    evidence: {
      type: [String],
      default: [],
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    investigationNotes: {
      type: String,
      default: null,
    },
    resolution: {
      type: String,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

fraudReportSchema.index({ createdAt: -1, status: 1, riskScore: -1 });

const FraudReport = mongoose.model('FraudReport', fraudReportSchema);

export default FraudReport;
