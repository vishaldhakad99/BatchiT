const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const logAction = async ({ user, action, ipAddress = '', userAgent = '', details = {} }) => {
  try {
    await AuditLog.create({
      user,
      action,
      ipAddress,
      userAgent,
      details
    });
  } catch (error) {
    logger.error(`Failed to record audit log: ${error.message}`);
  }
};

module.exports = { logAction };
