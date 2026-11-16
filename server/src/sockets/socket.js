const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const logger = require('../config/logger');

// Map of userId -> Set of socket IDs for multi-device/multi-tab support
const userSockets = new Map();

const initSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, val] = cookie.trim().split('=');
          if (name === 'accessToken') {
            token = decodeURIComponent(val);
            break;
          }
        }
      }

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    logger.info(`User connected to socket: ${socket.user.username} (${socket.id})`);

    // Track user socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);

    // Join personal user room
    socket.join(`user:${userId}`);

    // Update DB online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Notify user's friends of presence
    const notifyFriendsPresence = async (isOnline) => {
      try {
        const friendships = await Friendship.find({
          $or: [{ user1: userId }, { user2: userId }],
          status: 'active'
        });

        const friendIds = friendships.map((f) =>
          f.user1.toString() === userId ? f.user2.toString() : f.user1.toString()
        );

        friendIds.forEach((fId) => {
          io.to(`user:${fId}`).emit(isOnline ? 'user_online' : 'user_offline', {
            userId,
            lastSeen: new Date()
          });
        });
      } catch (err) {
        logger.error(`Presence notification error: ${err.message}`);
      }
    };

    notifyFriendsPresence(true);

    // ==========================================
    // CHAT ROOMS & REAL-TIME MESSAGING
    // ==========================================

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        username: socket.user.username
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      });
    });

    // ==========================================
    // WEBRTC CALL SIGNALING (AUDIO & VIDEO)
    // ==========================================

    // Caller offers call to recipient
    socket.on('call_initiate', ({ callId, recipientId, type, offer }) => {
      io.to(`user:${recipientId}`).emit('incoming_call', {
        callId,
        caller: {
          id: socket.user._id,
          username: socket.user.username,
          displayName: socket.user.displayName,
          avatar: socket.user.avatar
        },
        type,
        offer
      });
    });

    // Recipient accepts call and sends answer back to caller
    socket.on('call_accept', ({ callId, callerId, answer }) => {
      io.to(`user:${callerId}`).emit('call_answered', {
        callId,
        responderId: userId,
        answer
      });
    });

    // Exchange ICE candidate between caller & recipient
    socket.on('ice_candidate', ({ callId, targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('ice_candidate', {
        callId,
        candidate,
        fromUserId: userId
      });
    });

    // Call rejected
    socket.on('call_reject', ({ callId, callerId }) => {
      io.to(`user:${callerId}`).emit('call_declined', {
        callId,
        userId
      });
    });

    // Call ended
    socket.on('call_end', ({ callId, targetUserId }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('call_terminated', { callId });
      }
    });

    // Camera / Mic toggle alert
    socket.on('call_toggle_track', ({ targetUserId, kind, enabled }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit('peer_track_toggled', { kind, enabled });
      }
    });

    // ==========================================
    // DISCONNECTION & CLEANUP
    // ==========================================

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.id} (user: ${socket.user.username})`);

      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          const now = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: now });
          notifyFriendsPresence(false);
        }
      }
    });
  });
};

module.exports = { initSocket };
