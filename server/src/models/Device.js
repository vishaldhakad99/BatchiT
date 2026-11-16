const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true
    },
    deviceName: {
      type: String,
      default: 'Unknown Device'
    },
    platform: {
      type: String,
      default: 'Web'
    },
    browser: {
      type: String,
      default: 'Browser'
    },
    ipAddress: {
      type: String,
      default: ''
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    pushSubscription: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

deviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });

module.exports = mongoose.models.Device || mongoose.model('Device', deviceSchema);
