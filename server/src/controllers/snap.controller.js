const Snap = require('../models/Snap');
const Notification = require('../models/Notification');
const { updateStreakOnSnap } = require('../services/streak.service');

// Send snap to one or multiple recipients
const sendSnap = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const {
      recipients,
      mediaUrl,
      mediaType = 'photo',
      duration = 5,
      viewOnce = true,
      textOverlay = '',
      filter = 'normal',
      drawingData = ''
    } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient must be specified.'
      });
    }

    // Default 24-hour expiration for unopened snaps
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const recipientObjects = recipients.map((rId) => ({
      recipient: rId,
      status: 'SENT',
      openedAt: null,
      replayCount: 0
    }));

    const snap = await Snap.create({
      sender: senderId,
      recipients: recipientObjects,
      mediaUrl,
      mediaType,
      duration,
      viewOnce,
      textOverlay,
      filter,
      drawingData,
      expiresAt
    });

    // Update streak for each recipient and send notifications
    for (const rId of recipients) {
      await updateStreakOnSnap(senderId, rId);

      await Notification.create({
        recipient: rId,
        sender: senderId,
        type: 'snap',
        title: 'New Snap! ⚡',
        body: `${req.user.displayName} sent you a new snap!`,
        link: '/snaps'
      });
    }

    const io = req.app.get('io');
    if (io) {
      recipients.forEach((rId) => {
        io.to(`user:${rId.toString()}`).emit('snap_received', {
          snapId: snap._id,
          sender: {
            id: req.user._id,
            username: req.user.username,
            displayName: req.user.displayName,
            avatar: req.user.avatar
          },
          duration: snap.duration,
          mediaType: snap.mediaType,
          createdAt: snap.createdAt
        });
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Snap sent successfully!',
      data: snap
    });
  } catch (error) {
    next(error);
  }
};

// Get inbox snaps received by current user
const getReceivedSnaps = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const now = new Date();

    const snaps = await Snap.find({
      'recipients.recipient': currentUserId,
      expiresAt: { $gt: now },
      isExpired: false
    })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 });

    const filtered = snaps.map((s) => {
      const recipientStatus = s.recipients.find(
        (r) => r.recipient.toString() === currentUserId.toString()
      );

      return {
        id: s._id,
        sender: s.sender,
        mediaType: s.mediaType,
        duration: s.duration,
        viewOnce: s.viewOnce,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        status: recipientStatus?.status || 'SENT',
        openedAt: recipientStatus?.openedAt,
        // Only disclose mediaUrl if opened or when fetching snap detail
        mediaUrl: recipientStatus?.status === 'OPENED' ? '' : s.mediaUrl,
        textOverlay: s.textOverlay,
        filter: s.filter,
        drawingData: s.drawingData
      };
    });

    return res.status(200).json({
      success: true,
      data: filtered
    });
  } catch (error) {
    next(error);
  }
};

// Get snaps sent by current user
const getSentSnaps = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const snaps = await Snap.find({ sender: currentUserId })
      .populate('recipients.recipient', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      data: snaps
    });
  } catch (error) {
    next(error);
  }
};

// Open a snap (views it and updates status)
const openSnap = async (req, res, next) => {
  try {
    const { snapId } = req.params;
    const currentUserId = req.user._id;
    const now = new Date();

    const snap = await Snap.findById(snapId).populate('sender', 'username displayName avatar');

    if (!snap) {
      return res.status(404).json({ success: false, message: 'Snap not found.' });
    }

    if (now > snap.expiresAt || snap.isExpired) {
      snap.isExpired = true;
      await snap.save();
      return res.status(410).json({ success: false, message: 'This snap has expired.' });
    }

    const recipientRecord = snap.recipients.find(
      (r) => r.recipient.toString() === currentUserId.toString()
    );

    if (!recipientRecord) {
      return res.status(403).json({ success: false, message: 'You are not a recipient of this snap.' });
    }

    if (snap.viewOnce && recipientRecord.status === 'OPENED' && recipientRecord.replayCount > 0) {
      return res.status(410).json({ success: false, message: 'This snap was already opened.' });
    }

    // Mark opened
    recipientRecord.status = 'OPENED';
    recipientRecord.openedAt = now;
    recipientRecord.replayCount = (recipientRecord.replayCount || 0) + 1;

    // Check if all recipients have opened viewOnce snap
    const allOpened = snap.recipients.every((r) => r.status === 'OPENED');
    if (allOpened && snap.viewOnce) {
      snap.isExpired = true;
    }

    await snap.save();

    // Notify sender via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${snap.sender._id.toString()}`).emit('snap_opened', {
        snapId: snap._id,
        openedBy: {
          id: req.user._id,
          username: req.user.username,
          displayName: req.user.displayName
        },
        openedAt: now
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: snap._id,
        mediaUrl: snap.mediaUrl,
        mediaType: snap.mediaType,
        duration: snap.duration,
        textOverlay: snap.textOverlay,
        filter: snap.filter,
        drawingData: snap.drawingData,
        sender: snap.sender
      }
    });
  } catch (error) {
    next(error);
  }
};

// Report screenshot taken
const reportScreenshot = async (req, res, next) => {
  try {
    const { snapId } = req.params;
    const currentUserId = req.user._id;

    const snap = await Snap.findById(snapId);
    if (!snap) {
      return res.status(404).json({ success: false, message: 'Snap not found.' });
    }

    const recipientRecord = snap.recipients.find(
      (r) => r.recipient.toString() === currentUserId.toString()
    );

    if (recipientRecord) {
      recipientRecord.screenshotDetected = true;
      await snap.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${snap.sender.toString()}`).emit('snap_screenshot_alert', {
        snapId: snap._id,
        user: {
          id: req.user._id,
          username: req.user.username,
          displayName: req.user.displayName
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Screenshot reported.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendSnap,
  getReceivedSnaps,
  getSentSnaps,
  openSnap,
  reportScreenshot
};
