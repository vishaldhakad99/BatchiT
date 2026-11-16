const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    reportedMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    reportedSnap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Snap',
      default: null
    },
    reportedStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Story',
      default: null
    },
    reason: {
      type: String,
      enum: ['harassment', 'spam', 'inappropriate_content', 'impersonation', 'violence', 'other'],
      required: true
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Report || mongoose.model('Report', reportSchema);
