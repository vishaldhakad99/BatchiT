const Streak = require('../models/Streak');
const Notification = require('../models/Notification');

const updateStreakOnSnap = async (senderId, recipientId) => {
  try {
    const s1 = senderId.toString();
    const s2 = recipientId.toString();
    const [user1, user2] = s1 < s2 ? [senderId, recipientId] : [recipientId, senderId];

    let streak = await Streak.findOne({ user1, user2 });
    const now = new Date();

    if (!streak) {
      streak = new Streak({
        user1,
        user2,
        count: 0,
        isActive: false
      });
    }

    const isUser1Sender = senderId.toString() === user1.toString();
    if (isUser1Sender) {
      streak.lastSnapSentUser1 = now;
    } else {
      streak.lastSnapSentUser2 = now;
    }

    // Check if streak was expired
    if (streak.expiresAt && now > streak.expiresAt) {
      streak.count = 0;
      streak.isActive = false;
    }

    // Check if both users sent snaps within the last 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const u1Active = streak.lastSnapSentUser1 && streak.lastSnapSentUser1 >= oneDayAgo;
    const u2Active = streak.lastSnapSentUser2 && streak.lastSnapSentUser2 >= oneDayAgo;

    if (u1Active && u2Active) {
      // Both users have participated: extend streak!
      if (!streak.isActive) {
        streak.count = (streak.count || 0) + 1;
        streak.isActive = true;
      }
      // Give 24 hours from the most recent snap
      streak.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Create streak milestone notification if streak >= 1
      await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type: 'streak',
        title: `🔥 ${streak.count} Day Streak!`,
        body: `You and your friend are on a ${streak.count} day snap streak! Keep it alive!`
      });
    }

    await streak.save();
    return streak;
  } catch (error) {
    console.error('Streak update error:', error);
    return null;
  }
};

module.exports = { updateStreakOnSnap };
