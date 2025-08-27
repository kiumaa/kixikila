#!/usr/bin/env node

/**
 * KIXIKILA Production Monitoring Setup Script
 * 
 * This script helps configure monitoring, logging, and alerting
 * for the KIXIKILA application in production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}📊 ${msg}${colors.reset}\n`),
  step: (msg) => console.log(`\n${colors.magenta}📋 ${msg}${colors.reset}\n`)
};

class MonitoringSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.monitoringDir = path.join(this.rootDir, 'monitoring');
  }

  /**
   * Create monitoring directory structure
   */
  createMonitoringStructure() {
    log.step('Creating Monitoring Directory Structure');
    
    const directories = [
      this.monitoringDir,
      path.join(this.monitoringDir, 'logs'),
      path.join(this.monitoringDir, 'metrics'),
      path.join(this.monitoringDir, 'alerts'),
      path.join(this.monitoringDir, 'dashboards')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log.success(`Created directory: ${path.relative(this.rootDir, dir)}`);
      } else {
        log.info(`Directory exists: ${path.relative(this.rootDir, dir)}`);
      }
    });
  }

  /**
   * Create Winston logger configuration
   */
  createLoggerConfig() {
    log.step('Creating Logger Configuration');
    
    const loggerConfig = {
      // Winston logger configuration
      winston: {
        level: process.env.LOG_LEVEL || 'info',
        format: {
          timestamp: true,
          errors: { stack: true },
          json: true
        },
        transports: [
          {
            type: 'console',
            format: 'simple',
            level: 'debug'
          },
          {
            type: 'file',
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          },
          {
            type: 'file',
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 10
          }
        ]
      },
      // Log rotation settings
      rotation: {
        frequency: 'daily',
        maxFiles: '14d',
        maxSize: '20m'
      },
      // Log levels
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6
      }
    };

    const configPath = path.join(this.monitoringDir, 'logger-config.json');
    fs.writeFileSync(configPath, JSON.stringify(loggerConfig, null, 2));
    log.success(`Logger configuration saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create health check endpoints configuration
   */
  createHealthCheckConfig() {
    log.step('Creating Health Check Configuration');
    
    const healthConfig = {
      endpoints: {
        basic: {
          path: '/api/v1/health',
          method: 'GET',
          timeout: 5000,
          expectedStatus: 200,
          checks: [
            'database_connection',
            'redis_connection',
            'external_apis'
          ]
        },
        detailed: {
          path: '/api/v1/health/detailed',
          method: 'GET',
          timeout: 10000,
          expectedStatus: 200,
          checks: [
            'database_performance',
            'memory_usage',
            'cpu_usage',
            'disk_space',
            'response_times'
          ]
        },
        readiness: {
          path: '/api/v1/ready',
          method: 'GET',
          timeout: 3000,
          expectedStatus: 200
        },
        liveness: {
          path: '/api/v1/live',
          method: 'GET',
          timeout: 3000,
          expectedStatus: 200
        }
      },
      monitoring: {
        interval: 30000, // 30 seconds
        retries: 3,
        alertThreshold: 3, // Alert after 3 consecutive failures
        metrics: [
          'response_time',
          'success_rate',
          'error_rate',
          'availability'
        ]
      }
    };

    const configPath = path.join(this.monitoringDir, 'health-check-config.json');
    fs.writeFileSync(configPath, JSON.stringify(healthConfig, null, 2));
    log.success(`Health check configuration saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create metrics collection configuration
   */
  createMetricsConfig() {
    log.step('Creating Metrics Configuration');
    
    const metricsConfig = {
      prometheus: {
        enabled: true,
        port: 9090,
        path: '/metrics',
        collectDefaultMetrics: true,
        customMetrics: [
          {
            name: 'http_requests_total',
            type: 'counter',
            help: 'Total number of HTTP requests',
            labels: ['method', 'route', 'status']
          },
          {
            name: 'http_request_duration_seconds',
            type: 'histogram',
            help: 'HTTP request duration in seconds',
            labels: ['method', 'route'],
            buckets: [0.1, 0.5, 1, 2, 5]
          },
          {
            name: 'database_queries_total',
            type: 'counter',
            help: 'Total number of database queries',
            labels: ['operation', 'table']
          },
          {
            name: 'active_users',
            type: 'gauge',
            help: 'Number of active users'
          },
          {
            name: 'payment_transactions_total',
            type: 'counter',
            help: 'Total number of payment transactions',
            labels: ['status', 'method']
          }
        ]
      },
      collection: {
        interval: 15000, // 15 seconds
        retention: '7d',
        aggregation: {
          enabled: true,
          intervals: ['1m', '5m', '1h', '1d']
        }
      }
    };

    const configPath = path.join(this.monitoringDir, 'metrics-config.json');
    fs.writeFileSync(configPath, JSON.stringify(metricsConfig, null, 2));
    log.success(`Metrics configuration saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create alerting configuration
   */
  createAlertingConfig() {
    log.step('Creating Alerting Configuration');
    
    const alertConfig = {
      channels: {
        email: {
          enabled: true,
          smtp: {
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            }
          },
          recipients: [
            process.env.ADMIN_EMAIL || 'admin@kixikila.com'
          ]
        },
        slack: {
          enabled: false,
          webhook: process.env.SLACK_WEBHOOK_URL,
          channel: '#alerts',
          username: 'KIXIKILA Monitor'
        },
        sms: {
          enabled: false,
          provider: 'bulksms',
          credentials: {
            username: process.env.BULKSMS_USERNAME,
            password: process.env.BULKSMS_PASSWORD
          },
          recipients: []
        }
      },
      rules: [
        {
          name: 'High Error Rate',
          condition: 'error_rate > 5%',
          duration: '5m',
          severity: 'critical',
          message: 'Error rate is above 5% for 5 minutes'
        },
        {
          name: 'High Response Time',
          condition: 'avg_response_time > 2s',
          duration: '3m',
          severity: 'warning',
          message: 'Average response time is above 2 seconds'
        },
        {
          name: 'Database Connection Failed',
          condition: 'database_connection == false',
          duration: '1m',
          severity: 'critical',
          message: 'Database connection is down'
        },
        {
          name: 'High Memory Usage',
          condition: 'memory_usage > 85%',
          duration: '5m',
          severity: 'warning',
          message: 'Memory usage is above 85%'
        },
        {
          name: 'Low Disk Space',
          condition: 'disk_usage > 90%',
          duration: '1m',
          severity: 'critical',
          message: 'Disk usage is above 90%'
        }
      ],
      escalation: {
        enabled: true,
        levels: [
          {
            delay: '0m',
            channels: ['email']
          },
          {
            delay: '15m',
            channels: ['email', 'slack']
          },
          {
            delay: '30m',
            channels: ['email', 'slack', 'sms']
          }
        ]
      }
    };

    const configPath = path.join(this.monitoringDir, 'alerts-config.json');
    fs.writeFileSync(configPath, JSON.stringify(alertConfig, null, 2));
    log.success(`Alerting configuration saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create monitoring dashboard configuration
   */
  createDashboardConfig() {
    log.step('Creating Dashboard Configuration');
    
    const dashboardConfig = {
      grafana: {
        enabled: true,
        datasources: [
          {
            name: 'Prometheus',
            type: 'prometheus',
            url: 'http://localhost:9090'
          },
          {
            name: 'Logs',
            type: 'loki',
            url: 'http://localhost:3100'
          }
        ],
        dashboards: [
          {
            name: 'KIXIKILA Overview',
            panels: [
              'Request Rate',
              'Response Time',
              'Error Rate',
              'Active Users',
              'Database Performance'
            ]
          },
          {
            name: 'Infrastructure',
            panels: [
              'CPU Usage',
              'Memory Usage',
              'Disk Usage',
              'Network I/O'
            ]
          },
          {
            name: 'Business Metrics',
            panels: [
              'User Registrations',
              'Payment Transactions',
              'Group Creation',
              'Revenue'
            ]
          }
        ]
      },
      customDashboard: {
        enabled: true,
        port: 3001,
        features: [
          'real-time-metrics',
          'log-viewer',
          'alert-management',
          'health-status'
        ]
      }
    };

    const configPath = path.join(this.monitoringDir, 'dashboard-config.json');
    fs.writeFileSync(configPath, JSON.stringify(dashboardConfig, null, 2));
    log.success(`Dashboard configuration saved to: ${path.relative(this.rootDir, configPath)}`);
    
    return configPath;
  }

  /**
   * Create monitoring middleware
   */
  createMonitoringMiddleware() {
    log.step('Creating Monitoring Middleware');
    
    const middlewareCode = `
/**
 * KIXIKILA Monitoring Middleware
 * 
 * This middleware collects metrics, logs requests, and monitors performance.
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import logger from '../utils/logger.js';
import metrics from '../utils/metrics.js';

// Request tracking middleware
export const requestTracker = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();
  const requestId = generateRequestId();
  
  // Add request ID to headers
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Track metrics
  metrics.incrementCounter('http_requests_total', {
    method: req.method,
    route: req.route?.path || req.url
  });
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = performance.now() - startTime;
    
    // Log request completion
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Math.round(duration),
      contentLength: res.get('content-length')
    });
    
    // Record metrics
    metrics.recordHistogram('http_request_duration_seconds', duration / 1000, {
      method: req.method,
      route: req.route?.path || req.url
    });
    
    metrics.incrementCounter('http_requests_total', {
      method: req.method,
      route: req.route?.path || req.url,
      status: res.statusCode.toString()
    });
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Error tracking middleware
export const errorTracker = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log error
  logger.error('Request error', {
    requestId,
    method: req.method,
    url: req.url,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  });
  
  // Track error metrics
  metrics.incrementCounter('http_errors_total', {
    method: req.method,
    route: req.route?.path || req.url,
    errorType: err.name
  });
  
  next(err);
};

// Health check middleware
export const healthCheck = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health' || req.path === '/api/v1/health') {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(healthStatus);
    return;
  }
  
  next();
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  // Monitor memory usage
  const memUsage = process.memoryUsage();
  metrics.setGauge('memory_usage_bytes', memUsage.heapUsed);
  metrics.setGauge('memory_total_bytes', memUsage.heapTotal);
  
  // Monitor CPU usage (simplified)
  const cpuUsage = process.cpuUsage();
  metrics.setGauge('cpu_user_seconds_total', cpuUsage.user / 1000000);
  metrics.setGauge('cpu_system_seconds_total', cpuUsage.system / 1000000);
  
  next();
};

// Generate unique request ID
function generateRequestId(): string {
  return \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
}

export default {
  requestTracker,
  errorTracker,
  healthCheck,
  performanceMonitor
};
`;

    const middlewarePath = path.join(this.rootDir, 'src', 'middleware', 'monitoring.ts');
    fs.writeFileSync(middlewarePath, middlewareCode);
    log.success(`Monitoring middleware saved to: ${path.relative(this.rootDir, middlewarePath)}`);
    
    return middlewarePath;
  }

  /**
   * Create deployment monitoring checklist
   */
  createMonitoringChecklist() {
    log.step('Creating Monitoring Checklist');
    
    const checklist = [
      '📊 KIXIKILA Production Monitoring Checklist',
      '=' .repeat(50),
      '',
      '✅ Logging Setup:',
      '□ Winston logger configured',
      '□ Log rotation enabled',
      '□ Error logs separated',
      '□ Structured logging implemented',
      '□ Log aggregation configured',
      '',
      '✅ Metrics Collection:',
      '□ Prometheus metrics enabled',
      '□ Custom business metrics defined',
      '□ Performance metrics tracked',
      '□ Database metrics monitored',
      '□ User activity metrics collected',
      '',
      '✅ Health Checks:',
      '□ Basic health endpoint (/api/v1/health)',
      '□ Detailed health endpoint (/api/v1/health/detailed)',
      '□ Readiness probe (/api/v1/ready)',
      '□ Liveness probe (/api/v1/live)',
      '□ External dependencies checked',
      '',
      '✅ Alerting:',
      '□ Email alerts configured',
      '□ Critical error alerts set up',
      '□ Performance degradation alerts',
      '□ Infrastructure alerts (CPU, memory, disk)',
      '□ Business metric alerts',
      '',
      '✅ Dashboards:',
      '□ Application overview dashboard',
      '□ Infrastructure monitoring dashboard',
      '□ Business metrics dashboard',
      '□ Real-time monitoring view',
      '□ Historical data analysis',
      '',
      '✅ Security Monitoring:',
      '□ Failed authentication attempts',
      '□ Suspicious activity detection',
      '□ Rate limiting violations',
      '□ Security event logging',
      '□ Compliance audit trails',
      '',
      '✅ Performance Monitoring:',
      '□ Response time tracking',
      '□ Throughput monitoring',
      '□ Error rate tracking',
      '□ Database performance',
      '□ External API performance',
      '',
      '🔧 Recommended Tools:',
      '• Logging: Winston + Logrotate',
      '• Metrics: Prometheus + Grafana',
      '• APM: New Relic / DataDog / Sentry',
      '• Uptime: Pingdom / UptimeRobot',
      '• Error Tracking: Sentry / Bugsnag',
      '',
      '📞 Emergency Contacts:',
      '• DevOps Team: devops@kixikila.com',
      '• On-call Engineer: +244 XXX XXX XXX',
      '• System Administrator: admin@kixikila.com',
      '',
      '🔗 Monitoring URLs:',
      '• Health Check: https://api.kixikila.com/api/v1/health',
      '• Metrics: https://api.kixikila.com/metrics',
      '• Dashboard: https://monitoring.kixikila.com',
      '• Logs: https://logs.kixikila.com'
    ];

    const checklistPath = path.join(this.monitoringDir, 'monitoring-checklist.txt');
    fs.writeFileSync(checklistPath, checklist.join('\n'));
    log.success(`Monitoring checklist saved to: ${path.relative(this.rootDir, checklistPath)}`);
    
    return checklistPath;
  }

  /**
   * Generate monitoring setup report
   */
  generateSetupReport() {
    log.title('Monitoring Setup Report');
    
    const report = [
      '📊 KIXIKILA Monitoring Setup Report',
      '=' .repeat(50),
      '',
      '✅ Components Created:',
      '• Logger configuration (Winston)',
      '• Health check endpoints',
      '• Metrics collection (Prometheus)',
      '• Alerting rules and channels',
      '• Dashboard configurations',
      '• Monitoring middleware',
      '• Setup checklist',
      '',
      '📋 Next Steps:',
      '1. Install monitoring dependencies:',
      '   npm install winston winston-daily-rotate-file',
      '   npm install prom-client express-prometheus-middleware',
      '   npm install nodemailer @slack/webhook',
      '',
      '2. Configure environment variables:',
      '   LOG_LEVEL=info',
      '   EMAIL_HOST=smtp.gmail.com',
      '   EMAIL_USER=your-email@gmail.com',
      '   EMAIL_PASS=your-app-password',
      '   ADMIN_EMAIL=admin@kixikila.com',
      '   SLACK_WEBHOOK_URL=https://hooks.slack.com/...',
      '',
      '3. Integrate monitoring middleware in your Express app',
      '4. Set up external monitoring services (optional)',
      '5. Configure alerting channels',
      '6. Test all monitoring components',
      '',
      '🔧 Integration Example:',
      'import monitoring from "./middleware/monitoring.js";',
      '',
      'app.use(monitoring.requestTracker);',
      'app.use(monitoring.performanceMonitor);',
      'app.use(monitoring.healthCheck);',
      'app.use(monitoring.errorTracker);',
      '',
      '📊 Monitoring Endpoints:',
      '• GET /api/v1/health - Basic health check',
      '• GET /api/v1/health/detailed - Detailed health info',
      '• GET /api/v1/ready - Readiness probe',
      '• GET /api/v1/live - Liveness probe',
      '• GET /metrics - Prometheus metrics',
      '',
      '🚨 Important Notes:',
      '• Review and customize alerting rules',
      '• Set up proper log retention policies',
      '• Configure monitoring for your specific hosting platform',
      '• Test alerting channels before going live',
      '• Monitor monitoring system itself (meta-monitoring)'
    ];

    console.log('\n' + report.join('\n'));
    
    const reportPath = path.join(this.monitoringDir, 'setup-report.txt');
    fs.writeFileSync(reportPath, report.join('\n'));
    log.info(`Setup report saved to: ${path.relative(this.rootDir, reportPath)}`);
  }

  /**
   * Main setup process
   */
  setup() {
    log.title('KIXIKILA Production Monitoring Setup');
    
    try {
      // Create directory structure
      this.createMonitoringStructure();
      
      // Create configuration files
      this.createLoggerConfig();
      this.createHealthCheckConfig();
      this.createMetricsConfig();
      this.createAlertingConfig();
      this.createDashboardConfig();
      
      // Create monitoring middleware
      this.createMonitoringMiddleware();
      
      // Create checklist
      this.createMonitoringChecklist();
      
      // Generate report
      this.generateSetupReport();
      
      log.success('🎉 Monitoring setup completed successfully!');
      log.info('Review the generated configurations and integrate them into your application.');
      
    } catch (error) {
      log.error(`Setup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new MonitoringSetup();
  setup.setup();
}

export default MonitoringSetup;