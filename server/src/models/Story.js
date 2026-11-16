const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
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
      enum: ['image', 'video'],
      default: 'image'
    },
    caption: {
      type: String,
      default: '',
      maxlength: 300
    },
    audience: {
      type: String,
      enum: ['everyone', 'friends', 'close_friends'],
      default: 'friends'
    },
    duration: {
      type: Number,
      default: 5
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

storySchema.index({ user: 1, expiresAt: 1 });

module.exports = mongoose.models.Story || mongoose.model('Story', storySchema);
