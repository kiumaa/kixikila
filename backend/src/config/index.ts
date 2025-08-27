import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
  bulkSms: {
    username: string;
    password: string;
    from: string;
    baseUrl: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
    fromAddress: string;
  };
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
  security: {
    bcryptSaltRounds: number;
    sessionSecret: string;
  };
  database: {
    url: string;
  };
  admin: {
    email: string;
    password: string;
  };
  upload: {
    maxFileSize: number;
    uploadPath: string;
  };
  notification: {
    queueEnabled: boolean;
    retryAttempts: number;
  };
  cron: {
    paymentReminders: string;
    groupDraws: string;
    cleanupLogs: string;
  };
}

const requiredEnvVars = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

// Validate required environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  stripe: {
    publishableKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  bulkSms: {
    username: process.env.BULKSMS_USERNAME || '',
    password: process.env.BULKSMS_PASSWORD || '',
    from: process.env.BULKSMS_FROM || 'KIXIKILA',
    baseUrl: process.env.BULKSMS_BASE_URL || 'https://api.bulksms.com/v1',
  },
  
  email: {
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.SMTP_SECURE === 'true',
    user: process.env.EMAIL_USER || process.env.SMTP_USER || '',
    password: process.env.EMAIL_PASSWORD || process.env.SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'KIXIKILA',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || '',
  },
  
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'default-session-secret',
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@kixikila.pt',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || 'uploads/',
  },
  
  notification: {
    queueEnabled: process.env.NOTIFICATION_QUEUE_ENABLED === 'true',
    retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3', 10),
  },
  
  cron: {
    paymentReminders: process.env.CRON_PAYMENT_REMINDERS || '0 9 * * *',
    groupDraws: process.env.CRON_GROUP_DRAWS || '0 12 * * 1',
    cleanupLogs: process.env.CRON_CLEANUP_LOGS || '0 2 * * 0',
  },
};

// Validate configuration
if (config.nodeEnv === 'production') {
  if (config.jwt.secret === 'your-super-secret-jwt-key-here') {
    throw new Error('JWT_SECRET must be set to a secure value in production');
  }
  
  if (config.security.sessionSecret === 'your-session-secret-here') {
    throw new Error('SESSION_SECRET must be set to a secure value in production');
  }
}

export default config;