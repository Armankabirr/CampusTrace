import mongoose from 'mongoose';

// Sub-schema for proof questions (only used for found items)
const proofQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['ID Card', 'Wallet', 'Keys', 'Phone', 'Bag', 'Laptop', 'Accessories', 'Other'],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1000,
    },
    lastSeenLocation: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imageFileId: {
      type: String,
      default: null,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    verificationDetails: {
      privateIdentifier: {
        type: String,
        default: '',
      },
      proofQuestions: {
        type: [proofQuestionSchema],
        default: [],
      },
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'matched', 'resolved', 'archived'],
      default: 'pending',
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
