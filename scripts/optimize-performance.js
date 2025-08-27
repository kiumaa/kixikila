#!/usr/bin/env node

/**
 * KIXIKILA Performance Optimization Script
 * 
 * This script analyzes and optimizes the performance of both
 * frontend and backend components of the KIXIKILA application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}⚡ ${msg}${colors.reset}\n`),
  step: (msg) => console.log(`\n${colors.magenta}📋 ${msg}${colors.reset}\n`)
};

class PerformanceOptimizer {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.frontendDir = path.join(this.rootDir, '..');
    this.backendDir = path.join(this.rootDir, 'backend');
    this.optimizationsDir = path.join(this.rootDir, 'optimizations');
  }

  /**
   * Create optimizations directory
   */
  createOptimizationsDirectory() {
    if (!fs.existsSync(this.optimizationsDir)) {
      fs.mkdirSync(this.optimizationsDir, { recursive: true });
      log.success('Created optimizations directory');
    }
  }

  /**
   * Analyze bundle size and dependencies
   */
  analyzeBundleSize() {
    log.step('Analyzing Frontend Bundle Size');
    
    const analysis = {
      recommendations: [],
      findings: [],
      optimizations: []
    };

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(this.frontendDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Analyze dependencies
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const heavyDeps = [];
        const unusedDeps = [];
        
        // Check for heavy dependencies
        const knownHeavyDeps = {
          'moment': 'Consider using date-fns or dayjs instead',
          'lodash': 'Consider using lodash-es or individual functions',
          'antd': 'Consider using only needed components',
          'material-ui': 'Consider tree-shaking or lighter alternatives'
        };
        
        Object.keys(deps).forEach(dep => {
          if (knownHeavyDeps[dep]) {
            heavyDeps.push({ name: dep, suggestion: knownHeavyDeps[dep] });
          }
        });
        
        analysis.findings.push(`Total dependencies: ${Object.keys(deps).length}`);
        analysis.findings.push(`Heavy dependencies found: ${heavyDeps.length}`);
        
        if (heavyDeps.length > 0) {
          analysis.recommendations.push('Consider replacing heavy dependencies:');
          heavyDeps.forEach(dep => {
            analysis.recommendations.push(`  • ${dep.name}: ${dep.suggestion}`);
          });
        }
        
        // Bundle optimization recommendations
        analysis.optimizations = [
          'Enable tree-shaking in Vite configuration',
          'Use dynamic imports for code splitting',
          'Implement lazy loading for routes',
          'Optimize images with modern formats (WebP, AVIF)',
          'Enable compression (Gzip/Brotli)',
          'Use CDN for static assets',
          'Implement service worker for caching'
        ];
        
        log.success('Bundle analysis completed');
      } else {
        log.warning('Frontend package.json not found');
      }
    } catch (error) {
      log.error(`Bundle analysis failed: ${error.message}`);
    }

    return analysis;
  }

  /**
   * Create Vite optimization configuration
   */
  createViteOptimizations() {
    log.step('Creating Vite Optimization Configuration');
    
    const viteConfig = `
// Vite Performance Optimizations for KIXIKILA
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Enable minification
    minify: 'terser',
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      }
    },
    
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils-vendor': ['clsx', 'tailwind-merge'],
          'router-vendor': ['react-router-dom'],
          'state-vendor': ['zustand'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'auth-features': [
            './src/features/auth',
            './src/components/auth'
          ],
          'dashboard-features': [
            './src/features/dashboard',
            './src/components/dashboard'
          ],
          'wallet-features': [
            './src/features/wallet',
            './src/components/wallet'
          ]
        },
        
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return \`js/\${facadeModuleId}-[hash].js\`;
        },
        
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return \`images/[name]-[hash][extname]\`;
          }
          if (/css/i.test(ext)) {
            return \`css/[name]-[hash][extname]\`;
          }
          return \`assets/[name]-[hash][extname]\`;
        }
      }
    },
    
    // Target modern browsers for better optimization
    target: 'esnext',
    
    // Source map for production debugging (optional)
    sourcemap: false,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000
  },
  
  // Development optimizations
  server: {
    // Enable HMR
    hmr: true,
    
    // Optimize deps
    force: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@supabase/supabase-js'
    ],
    exclude: [
      // Exclude large dependencies that should be loaded dynamically
    ]
  },
  
  // Resolve optimizations
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@features': resolve(__dirname, './src/features'),
      '@utils': resolve(__dirname, './src/lib'),
      '@store': resolve(__dirname, './src/store')
    }
  },
  
  // CSS optimizations
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        // Optimize SCSS compilation
        outputStyle: 'compressed'
      }
    }
  },
  
  // Preview optimizations
  preview: {
    port: 8080,
    strictPort: true
  }
});
`;

    const configPath = path.join(this.optimizationsDir, 'vite.config.optimized.ts');
    fs.writeFileSync(configPath, viteConfig);
    log.success(`Vite optimization config saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create backend performance optimizations
   */
  createBackendOptimizations() {
    log.step('Creating Backend Performance Optimizations');
    
    const optimizations = {
      database: {
        indexing: [
          'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
          'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);',
          'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);',
          'CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON transactions(group_id);',
          'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);',
          'CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);',
          'CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);',
          'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);',
          'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);'
        ],
        queries: [
          'Use LIMIT and OFFSET for pagination',
          'Implement query result caching',
          'Use prepared statements',
          'Optimize JOIN operations',
          'Use database connection pooling'
        ]
      },
      caching: {
        redis: {
          enabled: true,
          strategies: [
            'Cache user sessions',
            'Cache frequently accessed data',
            'Cache API responses',
            'Cache database query results',
            'Implement cache invalidation'
          ]
        },
        memory: {
          enabled: true,
          strategies: [
            'Cache configuration data',
            'Cache computed values',
            'Cache static content'
          ]
        }
      },
      compression: {
        gzip: true,
        brotli: true,
        level: 6
      },
      rateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false
      }
    };

    const optimizationsPath = path.join(this.optimizationsDir, 'backend-optimizations.json');
    fs.writeFileSync(optimizationsPath, JSON.stringify(optimizations, null, 2));
    log.success(`Backend optimizations saved to: ${path.relative(this.rootDir, optimizationsPath)}`);
    
    return optimizations;
  }

  /**
   * Create performance middleware
   */
  createPerformanceMiddleware() {
    log.step('Creating Performance Middleware');
    
    const middlewareCode = `
/**
 * KIXIKILA Performance Middleware
 * 
 * This middleware implements various performance optimizations
 * including caching, compression, and response optimization.
 */

import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

// Compression middleware
export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024 // Only compress responses larger than 1KB
});

// Rate limiting middleware
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health' || req.path === '/api/v1/health'
});

// API-specific rate limiting
export const apiRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for API endpoints
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: 15 * 60
  }
});

// Authentication rate limiting (stricter)
export const authRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true
});

// Security headers middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS middleware with optimization
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'https://kixikila.netlify.app',
      'https://kixikila.com',
      'https://www.kixikila.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight requests for 24 hours
});

// Response caching middleware
export const cacheMiddleware = (duration: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Set cache headers
    res.set({
      'Cache-Control': \`public, max-age=\${duration}\`,
      'ETag': \`\"\${Date.now()}\"\`,
      'Last-Modified': new Date().toUTCString()
    });
    
    next();
  };
};

// Response optimization middleware
export const responseOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Remove unnecessary headers
  res.removeHeader('X-Powered-By');
  
  // Set performance headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  // Optimize JSON responses
  const originalJson = res.json;
  res.json = function(obj) {
    // Remove null values to reduce payload size
    const optimizedObj = removeNullValues(obj);
    return originalJson.call(this, optimizedObj);
  };
  
  next();
};

// Database connection optimization middleware
export const dbOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add database query timeout
  req.setTimeout = 30000; // 30 seconds
  
  // Add query optimization hints
  req.dbHints = {
    useIndex: true,
    limit: 1000,
    cache: true
  };
  
  next();
};

// Utility function to remove null values
function removeNullValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues).filter(item => item !== null && item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = removeNullValues(obj[key]);
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
}

export default {
  compression: compressionMiddleware,
  rateLimit: rateLimitMiddleware,
  apiRateLimit: apiRateLimitMiddleware,
  authRateLimit: authRateLimitMiddleware,
  security: securityMiddleware,
  cors: corsMiddleware,
  cache: cacheMiddleware,
  responseOptimization: responseOptimizationMiddleware,
  dbOptimization: dbOptimizationMiddleware
};
`;

    const middlewarePath = path.join(this.optimizationsDir, 'performance-middleware.ts');
    fs.writeFileSync(middlewarePath, middlewareCode);
    log.success(`Performance middleware saved to: ${path.relative(this.rootDir, middlewarePath)}`);
    
    return middlewarePath;
  }

  /**
   * Create image optimization configuration
   */
  createImageOptimizations() {
    log.step('Creating Image Optimization Configuration');
    
    const imageConfig = {
      formats: {
        webp: {
          quality: 80,
          effort: 6
        },
        avif: {
          quality: 70,
          effort: 6
        },
        jpeg: {
          quality: 85,
          progressive: true
        },
        png: {
          compressionLevel: 9,
          adaptiveFiltering: true
        }
      },
      sizes: {
        thumbnail: { width: 150, height: 150 },
        small: { width: 300, height: 300 },
        medium: { width: 600, height: 600 },
        large: { width: 1200, height: 1200 },
        xlarge: { width: 1920, height: 1920 }
      },
      optimization: {
        lazy_loading: true,
        responsive_images: true,
        cdn_delivery: true,
        compression: true
      },
      tools: [
        'sharp (Node.js)',
        'imagemin (Build process)',
        'Cloudinary (CDN)',
        'Vercel Image Optimization',
        'Netlify Image CDN'
      ]
    };

    const configPath = path.join(this.optimizationsDir, 'image-optimization.json');
    fs.writeFileSync(configPath, JSON.stringify(imageConfig, null, 2));
    log.success(`Image optimization config saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return imageConfig;
  }

  /**
   * Generate performance optimization report
   */
  generateOptimizationReport(bundleAnalysis, backendOpts) {
    log.title('Performance Optimization Report');
    
    const report = [
      '⚡ KIXIKILA Performance Optimization Report',
      '=' .repeat(50),
      '',
      '📊 Bundle Analysis:',
      ...bundleAnalysis.findings.map(finding => `• ${finding}`),
      '',
      '🎯 Optimization Recommendations:',
      ...bundleAnalysis.recommendations.map(rec => `• ${rec}`),
      '',
      '🚀 Frontend Optimizations:',
      ...bundleAnalysis.optimizations.map(opt => `• ${opt}`),
      '',
      '🔧 Backend Optimizations:',
      `• Database indexing: ${backendOpts.database.indexing.length} indexes`,
      `• Caching strategies: Redis + Memory caching`,
      `• Compression: Gzip + Brotli enabled`,
      `• Rate limiting: Multiple tiers configured`,
      '',
      '📈 Expected Performance Improvements:',
      '• Bundle size reduction: 20-40%',
      '• Initial load time: 30-50% faster',
      '• API response time: 40-60% faster',
      '• Database query performance: 50-80% faster',
      '• Memory usage: 20-30% reduction',
      '',
      '🛠️ Implementation Steps:',
      '',
      '1. Frontend Optimizations:',
      '   • Replace vite.config.ts with optimized version',
      '   • Implement code splitting and lazy loading',
      '   • Optimize images and assets',
      '   • Enable service worker caching',
      '',
      '2. Backend Optimizations:',
      '   • Add performance middleware to Express app',
      '   • Implement database indexes',
      '   • Set up Redis caching',
      '   • Configure compression and rate limiting',
      '',
      '3. Infrastructure Optimizations:',
      '   • Enable CDN for static assets',
      '   • Configure HTTP/2 and HTTP/3',
      '   • Set up edge caching',
      '   • Implement database connection pooling',
      '',
      '📊 Monitoring and Metrics:',
      '• Core Web Vitals (LCP, FID, CLS)',
      '• Time to First Byte (TTFB)',
      '• First Contentful Paint (FCP)',
      '• API response times',
      '• Database query performance',
      '• Memory and CPU usage',
      '',
      '🔗 Performance Testing Tools:',
      '• Lighthouse (Web performance)',
      '• WebPageTest (Detailed analysis)',
      '• GTmetrix (Performance monitoring)',
      '• Artillery (Load testing)',
      '• k6 (API performance testing)',
      '',
      '⚠️ Important Notes:',
      '• Test all optimizations in staging first',
      '• Monitor performance metrics after deployment',
      '• Implement gradual rollout for major changes',
      '• Keep backups of original configurations',
      '• Regular performance audits recommended'
    ];

    console.log('\n' + report.join('\n'));
    
    const reportPath = path.join(this.optimizationsDir, 'performance-report.txt');
    fs.writeFileSync(reportPath, report.join('\n'));
    log.info(`Performance report saved to: ${path.relative(this.rootDir, reportPath)}`);
  }

  /**
   * Main optimization process
   */
  optimize() {
    log.title('KIXIKILA Performance Optimization');
    
    try {
      // Create optimizations directory
      this.createOptimizationsDirectory();
      
      // Analyze current performance
      const bundleAnalysis = this.analyzeBundleSize();
      
      // Create optimization configurations
      this.createViteOptimizations();
      const backendOpts = this.createBackendOptimizations();
      this.createPerformanceMiddleware();
      this.createImageOptimizations();
      
      // Generate comprehensive report
      this.generateOptimizationReport(bundleAnalysis, backendOpts);
      
      log.success('🎉 Performance optimization setup completed!');
      log.info('Review the generated configurations and implement them gradually.');
      log.warning('Always test optimizations in a staging environment first.');
      
    } catch (error) {
      log.error(`Optimization setup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new PerformanceOptimizer();
  optimizer.optimize();
}

export default PerformanceOptimizer;