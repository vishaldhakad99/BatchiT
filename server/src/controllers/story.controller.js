const Story = require('../models/Story');
const StoryView = require('../models/StoryView');
const Friendship = require('../models/Friendship');
const User = require('../models/User');

// Create a new story
const createStory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      mediaUrl,
      mediaType = 'image',
      caption = '',
      audience = 'friends',
      duration = 5
    } = req.body;

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: userId,
      mediaUrl,
      mediaType,
      caption,
      audience,
      duration,
      expiresAt
    });

    const populatedStory = await Story.findById(story._id).populate(
      'user',
      'username displayName avatar'
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('new_story', {
        story: populatedStory
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Story published successfully.',
      data: populatedStory
    });
  } catch (error) {
    next(error);
  }
};

// Get feed stories from friends and self
const getFeedStories = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const now = new Date();

    // 1. Get friend IDs
    const friendships = await Friendship.find({
      $or: [{ user1: currentUserId }, { user2: currentUserId }],
      status: 'active'
    });

    const friendIds = friendships.map((f) =>
      f.user1.toString() === currentUserId.toString() ? f.user2 : f.user1
    );

    // Also include self
    const authorIds = [...friendIds, currentUserId];

    // 2. Fetch active stories
    const stories = await Story.find({
      user: { $in: authorIds },
      expiresAt: { $gt: now },
      isArchived: false
    })
      .populate('user', 'username displayName avatar closeFriends')
      .sort({ createdAt: 1 });

    // 3. Filter close friends audience
    const visibleStories = stories.filter((s) => {
      if (s.user._id.toString() === currentUserId.toString()) return true;
      if (s.audience === 'everyone' || s.audience === 'friends') return true;
      if (s.audience === 'close_friends') {
        return s.user.closeFriends?.some((id) => id.toString() === currentUserId.toString());
      }
      return false;
    });

    // 4. Group stories by user
    const groupedByUser = {};
    for (const s of visibleStories) {
      const uId = s.user._id.toString();
      if (!groupedByUser[uId]) {
        groupedByUser[uId] = {
          user: {
            id: s.user._id,
            username: s.user.username,
            displayName: s.user.displayName,
            avatar: s.user.avatar
          },
          stories: []
        };
      }

      // Check if current user viewed this story
      const viewed = await StoryView.findOne({ story: s._id, viewer: currentUserId });

      groupedByUser[uId].stories.push({
        id: s._id,
        mediaUrl: s.mediaUrl,
        mediaType: s.mediaType,
        caption: s.caption,
        duration: s.duration,
        audience: s.audience,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        hasViewed: !!viewed
      });
    }

    return res.status(200).json({
      success: true,
      data: Object.values(groupedByUser)
    });
  } catch (error) {
    next(error);
  }
};

// Record view on a story and optionally react or reply
const viewStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const { reaction, reply } = req.body;
    const currentUserId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    const storyView = await StoryView.findOneAndUpdate(
      { story: storyId, viewer: currentUserId },
      {
        story: storyId,
        viewer: currentUserId,
        reaction: reaction || '',
        reply: reply || '',
        viewedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Notify story owner if reacted or replied
    if (reaction || reply) {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${story.user.toString()}`).emit('story_interaction', {
          storyId,
          viewer: {
            id: req.user._id,
            username: req.user.username,
            displayName: req.user.displayName
          },
          reaction,
          reply
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: storyView
    });
  } catch (error) {
    next(error);
  }
};

// Get viewers for a story (owner only)
const getStoryViewers = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const currentUserId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    if (story.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this story analytics.' });
    }

    const views = await StoryView.find({ story: storyId })
      .populate('viewer', 'username displayName avatar')
      .sort({ viewedAt: -1 });

    return res.status(200).json({
      success: true,
      data: views
    });
  } catch (error) {
    next(error);
  }
};

// Delete story
const deleteStory = async (req, res, next) => {
  try {
    const { storyId } = req.params;
    const currentUserId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    if (story.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this story.' });
    }

    await Story.findByIdAndDelete(storyId);
    await StoryView.deleteMany({ story: storyId });

    return res.status(200).json({
      success: true,
      message: 'Story deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStory,
  getFeedStories,
  viewStory,
  getStoryViewers,
  deleteStory
};
