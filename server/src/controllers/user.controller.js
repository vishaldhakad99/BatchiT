const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Friendship = require('../models/Friendship');
const FriendRequest = require('../models/FriendRequest');
const { logAction } = require('../services/audit.service');

// Search users by username or displayName
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    if (!q || q.trim().length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    const users = await User.find({
      _id: { $ne: currentUserId, $nin: req.user.blockedUsers || [] },
      $or: [{ username: regex }, { displayName: regex }]
    })
      .select('username displayName avatar bio isOnline lastSeen isPrivateAccount publicKey')
      .limit(20);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// Get a user profile by username
const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    const targetUser = await User.findOne({ username: username.toLowerCase() });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check if blocked
    if (targetUser.blockedUsers?.includes(currentUserId) || req.user.blockedUsers?.includes(targetUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'This profile is unavailable.'
      });
    }

    // Check friendship status
    const [u1, u2] = Friendship.getOrderedUsers(currentUserId, targetUser._id);
    const friendship = await Friendship.findOne({ user1: u1, user2: u2, status: 'active' });
    const isFriend = !!friendship;

    // Check pending request
    let friendRequestStatus = null;
    const sentReq = await FriendRequest.findOne({
      sender: currentUserId,
      recipient: targetUser._id,
      status: 'pending'
    });
    if (sentReq) friendRequestStatus = 'sent';

    const receivedReq = await FriendRequest.findOne({
      sender: targetUser._id,
      recipient: currentUserId,
      status: 'pending'
    });
    if (receivedReq) friendRequestStatus = 'received';

    // Count friends
    const friendCount = await Friendship.countDocuments({
      $or: [{ user1: targetUser._id }, { user2: targetUser._id }],
      status: 'active'
    });

    const isSelf = currentUserId.toString() === targetUser._id.toString();

    const profileData = {
      id: targetUser._id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      avatar: targetUser.avatar,
      bio: targetUser.bio,
      qrCode: targetUser.qrCode,
      publicKey: targetUser.publicKey,
      createdAt: targetUser.createdAt,
      friendCount,
      isFriend,
      friendRequestStatus,
      isSelf,
      isOnline: targetUser.onlineStatusVisible ? targetUser.isOnline : false,
      lastSeen: targetUser.lastSeenVisible ? targetUser.lastSeen : null,
      isPrivateAccount: targetUser.isPrivateAccount
    };

    return res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const allowedUpdates = [
      'displayName',
      'bio',
      'avatar',
      'publicKey',
      'isPrivateAccount',
      'onlineStatusVisible',
      'lastSeenVisible',
      'messagePrivacy',
      'storyPrivacy',
      'themePreference',
      'accentColor'
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// Set Private Vault PIN (4 digits)
const setVaultPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);

    const salt = await bcrypt.genSalt(10);
    user.vaultPin = await bcrypt.hash(pin, salt);
    user.vaultPinSet = true;
    await user.save();

    await logAction({
      user: user._id,
      action: 'VAULT_PIN_SET',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Private Vault PIN configured successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify Private Vault PIN
const verifyVaultPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id).select('+vaultPin');

    if (!user.vaultPin) {
      return res.status(400).json({
        success: false,
        message: 'No vault PIN has been set up yet. Please create a PIN first.'
      });
    }

    const isMatch = await user.compareVaultPin(pin);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect PIN.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PIN verified. Vault unlocked.'
    });
  } catch (error) {
    next(error);
  }
};

// Block a user
const blockUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself.'
      });
    }

    // Add to blockedUsers
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: targetUserId }
    });

    // Remove active friendship if exists
    const [u1, u2] = Friendship.getOrderedUsers(currentUserId, targetUserId);
    await Friendship.findOneAndDelete({ user1: u1, user2: u2 });

    // Cancel pending requests
    await FriendRequest.deleteMany({
      $or: [
        { sender: currentUserId, recipient: targetUserId },
        { sender: targetUserId, recipient: currentUserId }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'User has been blocked.'
    });
  } catch (error) {
    next(error);
  }
};

// Unblock a user
const unblockUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: targetUserId }
    });

    return res.status(200).json({
      success: true,
      message: 'User has been unblocked.'
    });
  } catch (error) {
    next(error);
  }
};

// Get list of blocked users
const getBlockedUsers = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'username displayName avatar');
    return res.status(200).json({
      success: true,
      data: user.blockedUsers || []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUsers,
  getUserProfile,
  updateProfile,
  setVaultPin,
  verifyVaultPin,
  blockUser,
  unblockUser,
  getBlockedUsers
};
