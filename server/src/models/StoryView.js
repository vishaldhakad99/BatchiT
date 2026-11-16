const mongoose = require('mongoose');

const storyViewSchema = new mongoose.Schema(
  {
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
      index: true
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reaction: {
      type: String,
      default: ''
    },
    reply: {
      type: String,
      default: ''
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

storyViewSchema.index({ story: 1, viewer: 1 }, { unique: true });

module.exports = mongoose.models.StoryView || mongoose.model('StoryView', storyViewSchema);
