const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema(
  {
    // user1 is always stored as smaller ObjectId string to enforce canonical pair uniqueness
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
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Static helper to order users
friendshipSchema.statics.getOrderedUsers = function (id1, id2) {
  const s1 = id1.toString();
  const s2 = id2.toString();
  return s1 < s2 ? [id1, id2] : [id2, id1];
};

module.exports = mongoose.models.Friendship || mongoose.model('Friendship', friendshipSchema);
