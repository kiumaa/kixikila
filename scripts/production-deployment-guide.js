#!/usr/bin/env node

/**
 * KIXIKILA - Production Deployment Implementation Guide
 * This script guides through the complete production deployment process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Logging utilities
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}\n`)
};

class ProductionDeploymentGuide {
  constructor() {
    this.steps = [
      { name: 'Manual Supabase Configuration', automated: false },
      { name: 'Environment Variables Setup', automated: true },
      { name: 'Security Tests', automated: true },
      { name: 'Functionality Tests', automated: true },
      { name: 'Performance Tests', automated: true },
      { name: 'Railway Backend Deployment', automated: true },
      { name: 'DNS Configuration', automated: false },
      { name: 'Stripe Live Mode Setup', automated: false },
      { name: 'BulkSMS Production Setup', automated: false },
      { name: 'Final Health Checks', automated: true }
    ];
  }

  async run() {
    log.title('🚀 KIXIKILA - PRODUCTION DEPLOYMENT GUIDE');
    
    console.log('This guide will walk you through the complete production deployment process.\n');
    
    // Step 1: Manual Supabase Configuration
    await this.step1_SupabaseConfiguration();
    
    // Step 2: Environment Setup
    await this.step2_EnvironmentSetup();
    
    // Step 3-5: Run Test Suites
    await this.step3_RunTests();
    
    // Step 6: Backend Deployment
    await this.step6_BackendDeployment();
    
    // Step 7: DNS Configuration
    await this.step7_DNSConfiguration();
    
    // Step 8-9: Integrations
    await this.step8_IntegrationsSetup();
    
    // Step 10: Final Checks
    await this.step10_FinalChecks();
    
    log.title('🎉 DEPLOYMENT GUIDE COMPLETED');
    log.success('Your KIXIKILA app is ready for production!');
  }

  async step1_SupabaseConfiguration() {
    log.title('STEP 1: MANUAL SUPABASE CONFIGURATION');
    log.warning('⚠️  CRITICAL: These configurations MUST be done manually in Supabase Dashboard');
    
    console.log('1. Go to Supabase Dashboard → Authentication → Settings:');
    console.log('   • Set OTP expiry to 600 seconds (10 minutes)');
    console.log('   • Enable "Leaked Password Protection"');
    console.log('   • Set minimum password strength to "Fair"');
    
    console.log('\n2. Go to Authentication → URL Configuration:');
    console.log('   • Site URL: https://kixikila.pro');
    console.log('   • Redirect URLs: https://kixikila.pro/auth/callback');
    
    console.log('\n3. Go to Authentication → Rate Limits:');
    console.log('   • SMS: 10 per hour');
    console.log('   • Email: 20 per hour');
    console.log('   • Sign Up: 10 per hour');
    console.log('   • Sign In: 20 per hour');
    console.log('   • Password Reset: 5 per hour');
    
    console.log('\n4. Go to Settings → API → CORS:');
    console.log('   • Add: https://kixikila.pro');
    console.log('   • Add: https://api.kixikila.pro');
    
    console.log('\n📋 Use the checklist in PRODUCTION_SUPABASE_DASHBOARD_CONFIG.md');
    
    const configured = await this.promptUser('Have you completed ALL Supabase configurations? (y/n): ');
    if (configured.toLowerCase() !== 'y') {
      log.error('Please complete Supabase configurations before continuing.');
      process.exit(1);
    }
  }

  async step2_EnvironmentSetup() {
    log.title('STEP 2: ENVIRONMENT VARIABLES SETUP');
    
    if (!fs.existsSync('.env.production')) {
      log.info('Creating .env.production from template...');
      fs.copyFileSync('.env.production.template', '.env.production');
      log.warning('Please edit .env.production with your real production values!');
      
      const edited = await this.promptUser('Have you updated .env.production with real values? (y/n): ');
      if (edited.toLowerCase() !== 'y') {
        log.error('Please update .env.production before continuing.');
        process.exit(1);
      }
    }
    
    log.success('Environment variables configured');
  }

  async step3_RunTests() {
    log.title('STEP 3-5: RUNNING TEST SUITES');
    
    const tests = [
      { name: 'Security Tests', script: 'test:security' },
      { name: 'Functionality Tests', script: 'test:functionality' },
      { name: 'Performance Tests', script: 'test:performance' }
    ];
    
    for (const test of tests) {
      log.info(`Running ${test.name}...`);
      try {
        execSync(`npm run ${test.script}`, { stdio: 'inherit' });
        log.success(`${test.name} passed`);
      } catch (error) {
        log.error(`${test.name} failed`);
        const continueAnyway = await this.promptUser('Continue despite test failures? (y/n): ');
        if (continueAnyway.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    }
  }

  async step6_BackendDeployment() {
    log.title('STEP 6: RAILWAY BACKEND DEPLOYMENT');
    
    log.info('Running Railway deployment script...');
    try {
      execSync('npm run deploy:railway', { stdio: 'inherit' });
      log.success('Railway deployment completed');
    } catch (error) {
      log.error('Railway deployment failed');
      log.info('Please run: npm run deploy:railway for detailed instructions');
    }
  }

  async step7_DNSConfiguration() {
    log.title('STEP 7: DNS CONFIGURATION');
    log.warning('⚠️  MANUAL: Configure these DNS records in your domain provider:');
    
    console.log('\nFor kixikila.pro domain:');
    console.log('A Record:');
    console.log('  Name: @');
    console.log('  Value: 185.158.133.1 (Lovable IP)');
    console.log('  TTL: 300');
    
    console.log('\nA Record:');
    console.log('  Name: www');
    console.log('  Value: 185.158.133.1');
    console.log('  TTL: 300');
    
    console.log('\nCNAME Record:');
    console.log('  Name: api');
    console.log('  Value: YOUR-RAILWAY-DOMAIN.railway.app');
    console.log('  TTL: 300');
    
    console.log('\nTXT Record (for email):');
    console.log('  Name: @');
    console.log('  Value: "v=spf1 include:_spf.google.com ~all"');
    console.log('  TTL: 300');
    
    const configured = await this.promptUser('Have you configured all DNS records? (y/n): ');
    if (configured.toLowerCase() !== 'y') {
      log.warning('DNS propagation can take up to 48 hours');
    }
  }

  async step8_IntegrationsSetup() {
    log.title('STEP 8-9: INTEGRATIONS SETUP');
    
    console.log('\n🔧 STRIPE LIVE MODE:');
    console.log('1. Go to Stripe Dashboard → Developers → API Keys');
    console.log('2. Copy your Live Publishable Key to .env.production');
    console.log('3. Copy your Live Secret Key to Supabase Edge Functions secrets');
    console.log('4. Enable webhooks for your production domain');
    
    console.log('\n📱 BULKSMS PRODUCTION:');
    console.log('1. Upgrade to paid BulkSMS account');
    console.log('2. Add credentials to Supabase Edge Functions secrets');
    console.log('3. Test SMS sending with real phone number');
    
    console.log('\n📧 EMAIL CONFIGURATION:');
    console.log('1. Set up SMTP credentials (Gmail, SendGrid, etc.)');
    console.log('2. Add to Supabase Edge Functions secrets');
    console.log('3. Test email sending');
    
    const configured = await this.promptUser('Have you configured all integrations? (y/n): ');
    if (configured.toLowerCase() !== 'y') {
      log.warning('Some features may not work without proper integration setup');
    }
  }

  async step10_FinalChecks() {
    log.title('STEP 10: FINAL HEALTH CHECKS');
    
    log.info('Running final validation...');
    try {
      execSync('npm run validate-production', { stdio: 'inherit' });
      execSync('npm run verify-supabase', { stdio: 'inherit' });
      log.success('All validations passed');
    } catch (error) {
      log.error('Some validations failed - check logs above');
    }
    
    console.log('\n🔗 PRODUCTION ENDPOINTS:');
    console.log('Frontend: https://kixikila.pro');
    console.log('API: https://api.kixikila.pro');
    console.log('Admin: https://kixikila.pro/admin');
    console.log('Health Check: https://api.kixikila.pro/health');
  }

  async promptUser(question) {
    return new Promise((resolve) => {
      process.stdout.write(question);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}

// Run the deployment guide
if (import.meta.url === `file://${process.argv[1]}`) {
  const guide = new ProductionDeploymentGuide();
  guide.run().catch(console.error);
}

export { ProductionDeploymentGuide };