import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    lostItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    foundItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    lostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foundUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    matchReasons: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending',
    },
    notifiedLostUser: {
      type: Boolean,
      default: false,
    },
    notifiedFoundUser: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });
matchSchema.index({ lostUserId: 1, createdAt: -1 });
matchSchema.index({ foundUserId: 1, createdAt: -1 });

const Match = mongoose.model('Match', matchSchema);

export default Match;