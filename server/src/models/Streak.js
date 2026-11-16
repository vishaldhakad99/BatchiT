const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    // Canonical ordered user pair
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    count: {
      type: Number,
      default: 0
    },
    lastSnapSentUser1: {
      type: Date,
      default: null
    },
    lastSnapSentUser2: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

streakSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.models.Streak || mongoose.model('Streak', streakSchema);
