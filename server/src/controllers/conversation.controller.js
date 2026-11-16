const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all conversations for current user
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'username displayName avatar isOnline lastSeen onlineStatusVisible lastSeenVisible publicKey')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName' }
      })
      .populate('group', 'name avatar description')
      .sort({ lastMessageAt: -1 });

    const formatted = conversations.map((conv) => {
      const isPinned = conv.pinnedBy?.some((id) => id.toString() === currentUserId.toString());
      const isArchived = conv.archivedBy?.some((id) => id.toString() === currentUserId.toString());

      return {
        id: conv._id,
        isGroup: conv.isGroup,
        participants: conv.participants,
        group: conv.group,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        isPinned,
        isArchived,
        theme: conv.theme,
        disappearingDuration: conv.disappearingDuration,
        isE2EE: conv.isE2EE
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Get or create 1-to-1 conversation
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required.'
      });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, recipientId], $size: 2 }
    })
      .populate('participants', 'username displayName avatar isOnline lastSeen onlineStatusVisible lastSeenVisible publicKey')
      .populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [currentUserId, recipientId],
        isE2EE: true
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        'username displayName avatar isOnline lastSeen onlineStatusVisible lastSeenVisible publicKey'
      );
    }

    return res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Pin
const togglePinConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isPinned = conversation.pinnedBy?.includes(currentUserId);
    if (isPinned) {
      conversation.pinnedBy = conversation.pinnedBy.filter((id) => id.toString() !== currentUserId.toString());
    } else {
      conversation.pinnedBy.push(currentUserId);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: isPinned ? 'Unpinned conversation.' : 'Pinned conversation.',
      data: { isPinned: !isPinned }
    });
  } catch (error) {
    next(error);
  }
};

// Toggle Archive
const toggleArchiveConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    const isArchived = conversation.archivedBy?.includes(currentUserId);
    if (isArchived) {
      conversation.archivedBy = conversation.archivedBy.filter((id) => id.toString() !== currentUserId.toString());
    } else {
      conversation.archivedBy.push(currentUserId);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: isArchived ? 'Unarchived conversation.' : 'Archived conversation.',
      data: { isArchived: !isArchived }
    });
  } catch (error) {
    next(error);
  }
};

// Update conversation theme & disappearing messages timer
const updateConversationSettings = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { theme, disappearingDuration } = req.body;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or unauthorized.' });
    }

    if (theme !== undefined) conversation.theme = theme;
    if (disappearingDuration !== undefined) conversation.disappearingDuration = disappearingDuration;

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: 'Conversation settings updated.',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  togglePinConversation,
  toggleArchiveConversation,
  updateConversationSettings
};
