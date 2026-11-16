const Report = require('../models/Report');

const createReport = async (req, res, next) => {
  try {
    const reporterId = req.user._id;
    const {
      reportedUserId,
      reportedMessageId,
      reportedSnapId,
      reportedStoryId,
      reason,
      description = ''
    } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Report reason is required.' });
    }

    const report = await Report.create({
      reporter: reporterId,
      reportedUser: reportedUserId || null,
      reportedMessage: reportedMessageId || null,
      reportedSnap: reportedSnapId || null,
      reportedStory: reportedStoryId || null,
      reason,
      description
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for keeping BatchiT safe. Our security team will review this report.',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport };
