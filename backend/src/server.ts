import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import configurations
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { generalRateLimit } from './middleware/rateLimiting.js';
import { auditMiddleware } from './middleware/auditLogger.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { inputSanitization } from './middleware/inputSanitization.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import transactionRoutes from './routes/transactions.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import stripeRoutes from './routes/stripe.js';
import webhookRoutes from './routes/webhooks.js';
import healthRoutes from './routes/health.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Rate limiting is now handled by specific middlewares in routes

// Enhanced security middleware
app.use(securityHeaders);

// Content Security Policy and security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(generalRateLimit);

// Audit logging middleware - track all requests
app.use(auditMiddleware('REQUEST'));

// Body parsing middleware with input sanitization
app.use('/api/webhooks', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(inputSanitization);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion
  });
});

// API routes
app.use(`/api/${config.apiVersion}/health`, healthRoutes);
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/users`, authMiddleware, userRoutes);
app.use(`/api/${config.apiVersion}/groups`, authMiddleware, groupRoutes);
app.use(`/api/${config.apiVersion}/transactions`, authMiddleware, transactionRoutes);
app.use(`/api/${config.apiVersion}/notifications`, authMiddleware, notificationRoutes);
app.use(`/api/${config.apiVersion}/admin`, authMiddleware, adminRoutes);
app.use(`/api/${config.apiVersion}/stripe`, stripeRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = config.port || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 KIXIKILA Backend Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 API Version: ${config.apiVersion}`);
  logger.info(`🌐 CORS Origin: ${config.cors.origin}`);
});

export default app;