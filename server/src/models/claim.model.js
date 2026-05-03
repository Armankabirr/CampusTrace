import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    claimerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    claimerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    claimerPhone: {
      type: String,
      required: true,
    },
    claimerName: {
      type: String,
      required: true,
    },
    // For lost items: the secret identifier provided by claimer
    secretIdentifierProvided: {
      type: String,
      default: null,
    },
    // For found items: array of answers provided by claimer
    answersProvided: [
      {
        type: String,
        default: null,
      },
    ],
    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMessage: {
      type: String,
      default: null,
    },
    // Status of the claim
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'completed'],
      default: 'pending',
    },
    // Additional notes from reporter/claimer
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Claim = mongoose.model('Claim', claimSchema);

export default Claim;
