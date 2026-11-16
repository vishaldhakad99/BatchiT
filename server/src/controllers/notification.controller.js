const Notification = require('../models/Notification');

// Get notifications
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark notifications as read
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    if (notificationId === 'all') {
      await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() });
    } else {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
