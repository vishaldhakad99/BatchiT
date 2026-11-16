const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const friendRoutes = require('./friend.routes');
const conversationRoutes = require('./conversation.routes');
const messageRoutes = require('./message.routes');
const snapRoutes = require('./snap.routes');
const storyRoutes = require('./story.routes');
const callRoutes = require('./call.routes');
const groupRoutes = require('./group.routes');
const notificationRoutes = require('./notification.routes');
const memoryRoutes = require('./memory.routes');
const deviceRoutes = require('./device.routes');
const reportRoutes = require('./report.routes');
const mediaRoutes = require('./media.routes');

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'BatchiT API',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/friends', friendRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/snaps', snapRoutes);
router.use('/stories', storyRoutes);
router.use('/calls', callRoutes);
router.use('/groups', groupRoutes);
router.use('/notifications', notificationRoutes);
router.use('/memories', memoryRoutes);
router.use('/devices', deviceRoutes);
router.use('/reports', reportRoutes);
router.use('/media', mediaRoutes);

module.exports = router;
