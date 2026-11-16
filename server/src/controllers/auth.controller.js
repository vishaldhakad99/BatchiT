const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const Device = require('../models/Device');
const { generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies } = require('../services/token.service');
const { logAction } = require('../services/audit.service');
const config = require('../config/env');

// Register a new user
const register = async (req, res, next) => {
  try {
    const { username, email, displayName, password, publicKey } = req.body;

    // Check username collision
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      const field = existingUser.username.toLowerCase() === username.toLowerCase() ? 'Username' : 'Email';
      return res.status(409).json({
        success: false,
        message: `${field} is already registered.`
      });
    }

    const qrCode = `batchit://user/${username.toLowerCase()}`;

    const user = await User.create({
      username,
      email,
      displayName,
      password,
      publicKey: publicKey || null,
      qrCode,
      isOnline: true,
      lastSeen: new Date()
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save Device & Session
    const userAgent = req.headers['user-agent'] || 'Web Browser';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const deviceId = req.headers['x-device-id'] || crypto.randomUUID();

    const device = await Device.findOneAndUpdate(
      { user: user._id, deviceId },
      {
        user: user._id,
        deviceId,
        deviceName: req.headers['x-device-name'] || 'Web Client',
        platform: req.headers['x-platform'] || 'Web',
        ipAddress,
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    await Session.create({
      user: user._id,
      device: device._id,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    setTokenCookies(res, accessToken, refreshToken);

    await logAction({
      user: user._id,
      action: 'USER_REGISTERED',
      ipAddress,
      userAgent,
      details: { username: user.username }
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          qrCode: user.qrCode,
          publicKey: user.publicKey,
          isPrivateAccount: user.isPrivateAccount,
          themePreference: user.themePreference,
          accentColor: user.accentColor,
          vaultPinSet: user.vaultPinSet
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: identifier.toLowerCase() }, { email: identifier.toLowerCase() }]
    }).select('+password +vaultPin');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your username/email and password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Check your username/email and password.'
      });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const userAgent = req.headers['user-agent'] || 'Web Browser';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const deviceId = req.headers['x-device-id'] || crypto.randomUUID();

    const device = await Device.findOneAndUpdate(
      { user: user._id, deviceId },
      {
        user: user._id,
        deviceId,
        deviceName: req.headers['x-device-name'] || 'Web Client',
        platform: req.headers['x-platform'] || 'Web',
        ipAddress,
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    await Session.create({
      user: user._id,
      device: device._id,
      refreshToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    setTokenCookies(res, accessToken, refreshToken);

    await logAction({
      user: user._id,
      action: 'USER_LOGIN',
      ipAddress,
      userAgent,
      details: { username: user.username }
    });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          qrCode: user.qrCode,
          publicKey: user.publicKey,
          isPrivateAccount: user.isPrivateAccount,
          themePreference: user.themePreference,
          accentColor: user.accentColor,
          vaultPinSet: user.vaultPinSet
        },
        accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token session
const refreshSession = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const session = await Session.findOne({
      refreshToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      clearTokenCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please sign in again.'
      });
    }

    const user = await User.findById(session.user);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.'
      });
    }

    // Rotate refresh token
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await session.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// Logout
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      await Session.updateOne({ refreshToken }, { isRevoked: true });
    }

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        isOnline: false,
        lastSeen: new Date()
      });

      await logAction({
        user: req.user._id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    clearTokenCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Get current authenticated user
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        qrCode: user.qrCode,
        publicKey: user.publicKey,
        isPrivateAccount: user.isPrivateAccount,
        onlineStatusVisible: user.onlineStatusVisible,
        lastSeenVisible: user.lastSeenVisible,
        messagePrivacy: user.messagePrivacy,
        storyPrivacy: user.storyPrivacy,
        themePreference: user.themePreference,
        accentColor: user.accentColor,
        vaultPinSet: user.vaultPinSet,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change Password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    user.password = newPassword;
    await user.save();

    // Revoke other sessions for security
    await Session.updateMany({ user: user._id }, { isRevoked: true });

    await logAction({
      user: user._id,
      action: 'PASSWORD_CHANGED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please sign in with your new credentials.'
    });
  } catch (error) {
    next(error);
  }
};

// Forgot Password - Generates Reset Token
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't leak whether user exists
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, you will receive password reset instructions.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await logAction({
      user: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      // In development mode, return token for immediate testing!
      data: config.nodeEnv === 'development' ? { resetToken } : undefined
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password with Token
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.'
      });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    await Session.updateMany({ user: user._id }, { isRevoked: true });

    await logAction({
      user: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Delete account
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Session.deleteMany({ user: userId });
    await Device.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    clearTokenCookies(res);

    await logAction({
      user: userId,
      action: 'ACCOUNT_DELETED',
      ipAddress: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Account has been permanently deleted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshSession,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount
};
