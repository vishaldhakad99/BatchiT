const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// Create group
const createGroup = async (req, res, next) => {
  try {
    const creatorId = req.user._id;
    const { name, description = '', avatar = '', memberIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    const uniqueMembers = Array.from(new Set([...memberIds, creatorId.toString()]));

    // Create Group conversation
    const conversation = await Conversation.create({
      isGroup: true,
      participants: uniqueMembers
    });

    const group = await Group.create({
      name,
      description,
      avatar,
      creator: creatorId,
      conversation: conversation._id
    });

    conversation.group = group._id;
    await conversation.save();

    // Create GroupMember entries
    const memberDocs = uniqueMembers.map((mId) => ({
      group: group._id,
      user: mId,
      role: mId === creatorId.toString() ? 'admin' : 'member'
    }));

    await GroupMember.insertMany(memberDocs);

    // Notify members
    for (const mId of memberIds) {
      if (mId !== creatorId.toString()) {
        await Notification.create({
          recipient: mId,
          sender: creatorId,
          type: 'group_invite',
          title: 'Added to Group',
          body: `You were added to the group "${name}"`,
          link: `/chat/${conversation._id}`
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        group,
        conversationId: conversation._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user groups
const getGroups = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const memberships = await GroupMember.find({ user: currentUserId })
      .populate({
        path: 'group',
        populate: { path: 'creator', select: 'username displayName avatar' }
      })
      .sort({ createdAt: -1 });

    const groups = memberships.map((m) => ({
      ...m.group.toObject(),
      userRole: m.role
    }));

    return res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
};

// Get group details
const getGroupDetails = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user._id;

    const membership = await GroupMember.findOne({ group: groupId, user: currentUserId });
    if (!membership) {
      return res.status(403).json({ success: false, message: 'You are not a member of this group.' });
    }

    const group = await Group.findById(groupId).populate('creator', 'username displayName avatar');
    const members = await GroupMember.find({ group: groupId })
      .populate('user', 'username displayName avatar isOnline lastSeen')
      .sort({ role: 1 });

    return res.status(200).json({
      success: true,
      data: {
        group,
        members,
        currentUserRole: membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add members to group
const addMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const currentUserId = req.user._id;

    const myMembership = await GroupMember.findOne({ group: groupId, user: currentUserId });
    if (!myMembership || (myMembership.role !== 'admin' && myMembership.role !== 'moderator')) {
      return res.status(403).json({ success: false, message: 'Only admins and moderators can add members.' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    for (const mId of memberIds) {
      await GroupMember.findOneAndUpdate(
        { group: groupId, user: mId },
        { group: groupId, user: mId, role: 'member' },
        { upsert: true }
      );

      // Add to conversation
      await Conversation.findByIdAndUpdate(group.conversation, {
        $addToSet: { participants: mId }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Members added successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Remove member or leave group
const removeMember = async (req, res, next) => {
  try {
    const { groupId, memberId } = req.params;
    const currentUserId = req.user._id;

    const myMembership = await GroupMember.findOne({ group: groupId, user: currentUserId });
    if (!myMembership) {
      return res.status(403).json({ success: false, message: 'Not a member.' });
    }

    const isSelf = memberId === currentUserId.toString();

    if (!isSelf && myMembership.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required to remove members.' });
    }

    await GroupMember.findOneAndDelete({ group: groupId, user: memberId });

    const group = await Group.findById(groupId);
    if (group && group.conversation) {
      await Conversation.findByIdAndUpdate(group.conversation, {
        $pull: { participants: memberId }
      });
    }

    return res.status(200).json({
      success: true,
      message: isSelf ? 'You have left the group.' : 'Member removed.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupDetails,
  addMembers,
  removeMember
};
