import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import configurations
import { config } from './config/index.ts';
import { logger } from './utils/logger.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { notFoundHandler } from './middleware/notFoundHandler.ts';
import { authMiddleware } from './middleware/auth.ts';

// Import routes
import authRoutes from './routes/auth.ts';
import userRoutes from './routes/users.ts';
import groupRoutes from './routes/groups.ts';
import transactionRoutes from './routes/transactions.ts';
import notificationRoutes from './routes/notifications.ts';
import adminRoutes from './routes/admin.ts';
import webhookRoutes from './routes/webhooks.ts';
import stripeRoutes from './routes/stripe.ts';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimiting.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
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
app.use(limiter);

// Body parsing middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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