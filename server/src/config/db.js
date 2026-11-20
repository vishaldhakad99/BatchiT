const mongoose = require('mongoose');
const config = require('./env');
const logger = require('./logger');

const connectDB = async () => {
  let targetUri = config.mongodbUri;
  // If targetUri contains an unconfigured placeholder like <db_username>, fallback to local MongoDB
  if (targetUri.includes('<') && targetUri.includes('>')) {
    logger.warn('Detected unconfigured placeholder in MONGODB_URI. Falling back to local MongoDB: mongodb://127.0.0.1:27017/batchit');
    targetUri = 'mongodb://127.0.0.1:27017/batchit';
  }

  try {
    const conn = await mongoose.connect(targetUri, {
      autoIndex: true
    });

    logger.info(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB primary connection error: ${error.message}`);
    if (targetUri !== 'mongodb://127.0.0.1:27017/batchit') {
      logger.info('Attempting fallback to local MongoDB: mongodb://127.0.0.1:27017/batchit ...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/batchit', { autoIndex: true });
        logger.info(`MongoDB Connected via local fallback: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        logger.error(`Local fallback also failed: ${localErr.message}`);
      }
    }
    if (config.nodeEnv === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB connection reconnected');
});

module.exports = connectDB;
