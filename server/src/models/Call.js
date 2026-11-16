const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    isGroupCall: {
      type: Boolean,
      default: false
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    type: {
      type: String,
      enum: ['audio', 'video'],
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'accepted', 'rejected', 'missed', 'ended', 'busy'],
      default: 'initiated',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: 0 // Duration in seconds
    }
  },
  {
    timestamps: true
  }
);

callSchema.index({ caller: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.models.Call || mongoose.model('Call', callSchema);
