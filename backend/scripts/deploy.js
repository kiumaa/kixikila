#!/usr/bin/env node

/**
 * KIXIKILA Backend Deployment Script
 * 
 * This script helps prepare and deploy the KIXIKILA backend to production.
 * It includes environment validation, build optimization, and deployment helpers.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}\n`)
};

class DeploymentHelper {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY'
    ];
  }

  /**
   * Validate environment variables
   */
  async validateEnvironment() {
    log.title('Validating Environment Variables');
    
    const envFile = path.join(this.rootDir, '.env');
    if (!fs.existsSync(envFile)) {
      log.error('.env file not found!');
      log.info('Please copy .env.production to .env and configure your variables.');
      return false;
    }

    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config({ path: envFile });

    const missing = [];
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }

    if (missing.length > 0) {
      log.error('Missing required environment variables:');
      missing.forEach(variable => log.error(`  - ${variable}`));
      return false;
    }

    log.success('All required environment variables are set');
    return true;
  }

  /**
   * Run security checks
   */
  runSecurityChecks() {
    log.title('Running Security Checks');

    try {
      // Check for npm audit issues
      log.info('Running npm audit...');
      execSync('npm audit --audit-level=high', { stdio: 'inherit' });
      log.success('No high-severity vulnerabilities found');
    } catch (error) {
      log.warning('Security vulnerabilities detected. Please run "npm audit fix"');
    }

    // Check JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      log.warning('JWT_SECRET should be at least 32 characters long for production');
    }

    // Check if using HTTPS
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin && !corsOrigin.includes('https://')) {
      log.warning('CORS_ORIGIN should use HTTPS in production');
    }

    log.success('Security checks completed');
  }

  /**
   * Build the application
   */
  buildApplication() {
    log.title('Building Application');

    try {
      log.info('Installing dependencies...');
      execSync('npm ci --only=production', { stdio: 'inherit' });
      
      log.info('Running TypeScript compilation...');
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      
      log.success('Application built successfully');
      return true;
    } catch (error) {
      log.error('Build failed!');
      console.error(error.message);
      return false;
    }
  }

  /**
   * Run database migrations
   */
  runMigrations() {
    log.title('Database Setup');
    
    const schemaFile = path.join(this.rootDir, 'database', 'schema.sql');
    if (fs.existsSync(schemaFile)) {
      log.info('Database schema file found');
      log.warning('Please run the schema.sql file in your Supabase SQL editor');
      log.info('Schema location: database/schema.sql');
    } else {
      log.warning('No database schema file found');
    }
  }

  /**
   * Generate deployment checklist
   */
  generateChecklist() {
    log.title('Deployment Checklist');
    
    const checklist = [
      '□ Environment variables configured',
      '□ Database schema deployed to Supabase',
      '□ Stripe webhooks configured',
      '□ Domain and SSL certificates set up',
      '□ CORS origins updated for production',
      '□ Email service configured and tested',
      '□ SMS service configured and tested',
      '□ Monitoring and logging set up',
      '□ Backup strategy implemented',
      '□ Load testing completed',
      '□ Security review completed'
    ];

    console.log('\n📋 Pre-deployment checklist:');
    checklist.forEach(item => console.log(`   ${item}`));
    console.log('');
  }

  /**
   * Show deployment platforms information
   */
  showDeploymentOptions() {
    log.title('Deployment Platform Options');
    
    const platforms = [
      {
        name: 'Railway',
        url: 'https://railway.app',
        pros: ['Easy setup', 'Git integration', 'Free tier available'],
        command: 'railway deploy'
      },
      {
        name: 'Render',
        url: 'https://render.com',
        pros: ['Free tier', 'Auto-deploy from Git', 'Built-in SSL'],
        command: 'Connect GitHub repo'
      },
      {
        name: 'Heroku',
        url: 'https://heroku.com',
        pros: ['Mature platform', 'Add-ons ecosystem', 'Easy scaling'],
        command: 'git push heroku main'
      },
      {
        name: 'DigitalOcean App Platform',
        url: 'https://digitalocean.com/products/app-platform',
        pros: ['Competitive pricing', 'Good performance', 'Simple setup'],
        command: 'Connect GitHub repo'
      }
    ];

    platforms.forEach(platform => {
      console.log(`\n${colors.bright}${platform.name}${colors.reset}`);
      console.log(`   URL: ${platform.url}`);
      console.log(`   Pros: ${platform.pros.join(', ')}`);
      console.log(`   Deploy: ${platform.command}`);
    });
    console.log('');
  }

  /**
   * Main deployment preparation
   */
  async prepare() {
    log.title('KIXIKILA Backend Deployment Preparation');
    
    // Validate environment
    if (!this.validateEnvironment()) {
      process.exit(1);
    }

    // Run security checks
    this.runSecurityChecks();

    // Build application
    if (!this.buildApplication()) {
      process.exit(1);
    }

    // Database setup
    this.runMigrations();

    // Show deployment options
    this.showDeploymentOptions();

    // Generate checklist
    this.generateChecklist();

    log.success('Deployment preparation completed!');
    log.info('Your backend is ready for production deployment.');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const deployer = new DeploymentHelper();

  switch (command) {
    case 'validate':
      await deployer.validateEnvironment();
      break;
    case 'security':
      deployer.runSecurityChecks();
      break;
    case 'build':
      deployer.buildApplication();
      break;
    case 'checklist':
      deployer.generateChecklist();
      break;
    case 'platforms':
      deployer.showDeploymentOptions();
      break;
    default:
      await deployer.prepare();
  }
}

export default DeploymentHelper;