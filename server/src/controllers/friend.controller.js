const User = require('../models/User');
const Friendship = require('../models/Friendship');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const Streak = require('../models/Streak');
const Conversation = require('../models/Conversation');

// Send friend request
const sendFriendRequest = async (req, res, next) => {
  try {
    const { recipientId, username } = req.body;
    const senderId = req.user._id;

    let targetUser = null;
    if (recipientId) {
      targetUser = await User.findById(recipientId);
    } else if (username) {
      targetUser = await User.findOne({ username: username.toLowerCase() });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (targetUser._id.toString() === senderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself.'
      });
    }

    // Check if blocked
    if (targetUser.blockedUsers?.includes(senderId) || req.user.blockedUsers?.includes(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send friend request to this user.'
      });
    }

    // Check if already friends
    const [u1, u2] = Friendship.getOrderedUsers(senderId, targetUser._id);
    const existingFriendship = await Friendship.findOne({ user1: u1, user2: u2, status: 'active' });
    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user.'
      });
    }

    // Check existing pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: targetUser._id, status: 'pending' },
        { sender: targetUser._id, recipient: senderId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      if (existingRequest.sender.toString() === senderId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Friend request is already pending.'
        });
      } else {
        // Reverse request exists, auto-accept it!
        existingRequest.status = 'accepted';
        await existingRequest.save();

        await Friendship.create({ user1: u1, user2: u2, status: 'active' });

        return res.status(200).json({
          success: true,
          message: 'Friend request accepted! You are now friends.'
        });
      }
    }

    const newRequest = await FriendRequest.create({
      sender: senderId,
      recipient: targetUser._id,
      status: 'pending'
    });

    // Create Notification
    await Notification.create({
      recipient: targetUser._id,
      sender: senderId,
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${req.user.displayName} (@${req.user.username}) sent you a friend request.`,
      link: '/friends'
    });

    return res.status(201).json({
      success: true,
      message: 'Friend request sent.',
      data: newRequest
    });
  } catch (error) {
    next(error);
  }
};

// Accept friend request
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const friendRequest = await FriendRequest.findById(requestId).populate('sender', 'username displayName avatar');

    if (!friendRequest || friendRequest.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already handled.'
      });
    }

    if (friendRequest.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this friend request.'
      });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    const [u1, u2] = Friendship.getOrderedUsers(friendRequest.sender._id, currentUserId);
    await Friendship.findOneAndUpdate(
      { user1: u1, user2: u2 },
      { user1: u1, user2: u2, status: 'active' },
      { upsert: true, new: true }
    );

    // Ensure 1-to-1 conversation exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [u1, u2], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroup: false,
        participants: [u1, u2]
      });
    }

    // Create Notification for the sender
    await Notification.create({
      recipient: friendRequest.sender._id,
      sender: currentUserId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      body: `${req.user.displayName} accepted your friend request!`,
      link: `/chat/${conversation._id}`
    });

    return res.status(200).json({
      success: true,
      message: 'Friend request accepted.',
      data: { conversationId: conversation._id }
    });
  } catch (error) {
    next(error);
  }
};

// Reject friend request
const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request || request.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    if (request.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized.'
      });
    }

    request.status = 'rejected';
    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Friend request rejected.'
    });
  } catch (error) {
    next(error);
  }
};

// Cancel friend request
const cancelFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const currentUserId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.'
      });
    }

    if (request.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this request.'
      });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.status(200).json({
      success: true,
      message: 'Friend request cancelled.'
    });
  } catch (error) {
    next(error);
  }
};

// Get all friends with status and streak info
const getFriends = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const friendships = await Friendship.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
      status: 'active'
    })
      .populate('user1', 'username displayName avatar bio isOnline lastSeen onlineStatusVisible lastSeenVisible publicKey')
      .populate('user2', 'username displayName avatar bio isOnline lastSeen onlineStatusVisible lastSeenVisible publicKey');

    const friendsList = await Promise.all(
      friendships.map(async (f) => {
        const friend = f.user1._id.toString() === currentUserId.toString() ? f.user2 : f.user1;
        if (!friend) return null;

        // Fetch streak
        const [u1, u2] = Friendship.getOrderedUsers(currentUserId, friend._id);
        const streak = await Streak.findOne({ user1: u1, user2: u2 });

        return {
          id: friend._id,
          username: friend.username,
          displayName: friend.displayName,
          avatar: friend.avatar,
          bio: friend.bio,
          publicKey: friend.publicKey,
          isOnline: friend.onlineStatusVisible ? friend.isOnline : false,
          lastSeen: friend.lastSeenVisible ? friend.lastSeen : null,
          streak: streak
            ? {
                count: streak.count,
                isActive: streak.isActive,
                expiresAt: streak.expiresAt
              }
            : null,
          friendsSince: f.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: friendsList.filter(Boolean)
    });
  } catch (error) {
    next(error);
  }
};

// Get pending incoming and outgoing friend requests
const getPendingRequests = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const incoming = await FriendRequest.find({
      recipient: currentUserId,
      status: 'pending'
    })
      .populate('sender', 'username displayName avatar bio')
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({
      sender: currentUserId,
      status: 'pending'
    })
      .populate('recipient', 'username displayName avatar bio')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        incoming,
        outgoing
      }
    });
  } catch (error) {
    next(error);
  }
};

// Remove a friend
const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user._id;

    const [u1, u2] = Friendship.getOrderedUsers(currentUserId, friendId);
    await Friendship.findOneAndDelete({ user1: u1, user2: u2 });

    return res.status(200).json({
      success: true,
      message: 'Friend removed.'
    });
  } catch (error) {
    next(error);
  }
};

// Friend suggestions (other users on the platform not yet friended or requested)
const getFriendSuggestions = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const activeFriendships = await Friendship.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }]
    });

    const friendIds = activeFriendships.map((f) =>
      f.user1.toString() === currentUserId.toString() ? f.user2 : f.user1
    );

    const pendingRequests = await FriendRequest.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
      status: 'pending'
    });

    const pendingIds = pendingRequests.map((r) =>
      r.sender.toString() === currentUserId.toString() ? r.recipient : r.sender
    );

    const excludedIds = [...friendIds, ...pendingIds, currentUserId, ...(req.user.blockedUsers || [])];

    const suggestions = await User.find({
      _id: { $nin: excludedIds }
    })
      .select('username displayName avatar bio')
      .limit(10);

    return res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend,
  getFriendSuggestions
};
