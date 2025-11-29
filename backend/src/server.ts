import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

import { setupRoutes } from './routes';
import { setupWebSocket } from './services/websocket.service';
import { connectToDatabase, closeDatabaseConnection } from './services/database.service';
import { connectToRedis, closeRedisConnection } from './services/redis.service';
import { setupJobQueue } from './services/job-queue.service';
import { logger } from './utils/logger';
import { errorHandler } from './utils/error-handler';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '100mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '100mb' }));

// API routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, setupRoutes());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'lokaaudit-backend',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

async function startServer() {
  try {
    // Initialize services
    logger.info('🚀 Starting LokaAudit Backend Service...');
    
    // Connect to databases
    await connectToDatabase();
    await connectToRedis();
    
    // Setup job queue
    await setupJobQueue();
    
    // Setup WebSocket
    setupWebSocket(wss);
    
    // Start HTTP server
    const port = process.env.PORT || 4000;
    server.listen(port, () => {
      logger.info(`🌐 HTTP Server running on port ${port}`);
      logger.info(`📡 WebSocket Server running on same port ${port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('✅ LokaAudit Backend Service is ready!');
    });

    // Graceful shutdown handling
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);
  
  // Close server
  server.close(() => {
    logger.info('✅ HTTP Server closed');
  });
  
  // Close WebSocket server
  wss.close(() => {
    logger.info('✅ WebSocket Server closed');
  });
  
  // Close database connections
  try {
    await closeDatabaseConnection();
    await closeRedisConnection();
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  logger.info('👋 Graceful shutdown complete');
  process.exit(0);
}

// Start the server
startServer();

export { app, server, wss };
