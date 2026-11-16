const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// Get messages for a conversation
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Verify participant authorization
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation.'
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      conversation: conversationId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
    })
      .populate('sender', 'username displayName avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type mediaUrl isDeleted',
        populate: { path: 'sender', select: 'username displayName' }
      })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// Send a new message
const sendMessage = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const {
      conversationId,
      recipientId,
      type = 'text',
      content = '',
      mediaUrl = '',
      mediaThumbnail = '',
      mediaSize = 0,
      mediaMime = '',
      isEncrypted = false,
      iv = '',
      replyTo = null
    } = req.body;

    let targetConversationId = conversationId;

    if (!targetConversationId) {
      if (!recipientId) {
        return res.status(400).json({
          success: false,
          message: 'Either conversationId or recipientId must be provided.'
        });
      }

      let conv = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, recipientId], $size: 2 }
      });

      if (!conv) {
        conv = await Conversation.create({
          isGroup: false,
          participants: [currentUserId, recipientId]
        });
      }
      targetConversationId = conv._id;
    }

    const conversation = await Conversation.findOne({
      _id: targetConversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to post messages in this conversation.'
      });
    }

    // Handle disappearing messages
    let expiresAt = null;
    if (conversation.disappearingDuration > 0) {
      expiresAt = new Date(Date.now() + conversation.disappearingDuration * 1000);
    }

    const message = await Message.create({
      conversation: targetConversationId,
      sender: currentUserId,
      type,
      content,
      mediaUrl,
      mediaThumbnail,
      mediaSize,
      mediaMime,
      isEncrypted,
      iv,
      replyTo: replyTo || null,
      status: 'SENT',
      expiresAt
    });

    // Update conversation lastMessage
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .populate({
        path: 'replyTo',
        select: 'content sender type mediaUrl isDeleted',
        populate: { path: 'sender', select: 'username displayName' }
      });

    // Create notifications for other participants
    const otherParticipants = conversation.participants.filter(
      (p) => p.toString() !== currentUserId.toString()
    );

    for (const recipient of otherParticipants) {
      await Notification.create({
        recipient,
        sender: currentUserId,
        type: 'message',
        title: req.user.displayName,
        body: type === 'text' ? (isEncrypted ? '🔒 Encrypted message' : content.slice(0, 50)) : `Sent a ${type}`,
        link: `/chat/${conversation._id}`
      });
    }

    // Socket notification will be handled via req.app.get('io')
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${targetConversationId}`).emit('new_message', populatedMessage);
      otherParticipants.forEach((p) => {
        io.to(`user:${p.toString()}`).emit('conversation_updated', {
          conversationId: targetConversationId,
          lastMessage: populatedMessage
        });
      });
    }

    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
};

// React to a message
const reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    // Check if user already reacted with this emoji
    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === currentUserId.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Toggle off
      message.reactions.splice(existingIndex, 1);
    } else {
      // Remove any previous reaction from this user or append
      message.reactions = message.reactions.filter((r) => r.user.toString() !== currentUserId.toString());
      message.reactions.push({
        user: currentUserId,
        emoji,
        createdAt: new Date()
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversation}`).emit('message_reaction_updated', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    return res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    next(error);
  }
};

// Edit message
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own messages.' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit a deleted message.' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversation}`).emit('message_edited', {
        messageId: message._id,
        content: message.content,
        isEdited: true,
        editedAt: message.editedAt
      });
    }

    return res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// Delete message
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    message.mediaUrl = '';
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversation}`).emit('message_deleted', {
        messageId: message._id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted.'
    });
  } catch (error) {
    next(error);
  }
};

// Mark conversation messages as read
const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: currentUserId },
        'readBy.user': { $ne: currentUserId }
      },
      {
        $set: { status: 'READ' },
        $push: { readBy: { user: currentUserId, at: new Date() } }
      }
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        readByUserId: currentUserId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  sendMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  markAsRead
};
