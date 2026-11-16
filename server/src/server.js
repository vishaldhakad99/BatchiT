const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');

const config = require('./config/env');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { initSocket } = require('./sockets/socket');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Attach io instance to express app
app.set('io', io);
initSocket(io);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration (allow local IP, mobile and web origins)
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Id', 'X-Device-Name', 'X-Platform']
  })
);

// Standard Body Parsers & Cookies
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Static Media Files serving
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Apply general API Rate Limiting to /api
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', routes);

// Centralized error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      logger.info(`⚡ BatchiT Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`🚀 API Endpoint: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    logger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
