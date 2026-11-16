const mongoose = require('mongoose');

const snapRecipientSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['SENT', 'DELIVERED', 'OPENED', 'EXPIRED'],
    default: 'SENT',
    index: true
  },
  openedAt: {
    type: Date,
    default: null
  },
  replayCount: {
    type: Number,
    default: 0
  },
  screenshotDetected: {
    type: Boolean,
    default: false
  }
});

const snapSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    recipients: [snapRecipientSchema],
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['photo', 'video'],
      default: 'photo'
    },
    duration: {
      type: Number,
      default: 5,
      min: 1,
      max: 60
    },
    viewOnce: {
      type: Boolean,
      default: true
    },
    textOverlay: {
      type: String,
      default: ''
    },
    filter: {
      type: String,
      default: 'normal'
    },
    drawingData: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isExpired: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

snapSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.models.Snap || mongoose.model('Snap', snapSchema);
