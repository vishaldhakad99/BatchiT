const Device = require('../models/Device');
const Session = require('../models/Session');
const { logAction } = require('../services/audit.service');

// Get active devices and sessions
const getDevicesAndSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await Session.find({ user: userId, isRevoked: false })
      .populate('device')
      .sort({ updatedAt: -1 });

    const currentRefreshToken = req.cookies?.refreshToken;

    const formatted = sessions.map((s) => ({
      sessionId: s._id,
      device: s.device,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastActive: s.updatedAt,
      isCurrent: s.refreshToken === currentRefreshToken
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Revoke a session
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    session.isRevoked = true;
    await session.save();

    await logAction({
      user: userId,
      action: 'SESSION_REVOKED',
      ipAddress: req.ip,
      details: { sessionId }
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDevicesAndSessions,
  revokeSession
};
