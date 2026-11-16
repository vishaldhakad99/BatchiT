const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mediaUrl: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['photo', 'video'],
      default: 'photo'
    },
    title: {
      type: String,
      default: ''
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    album: {
      type: String,
      default: 'Snaps'
    },
    isVault: {
      type: Boolean,
      default: false,
      index: true
    },
    fileSize: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

memorySchema.index({ user: 1, isVault: 1, createdAt: -1 });

module.exports = mongoose.models.Memory || mongoose.model('Memory', memorySchema);
