#!/usr/bin/env node

/**
 * KIXIKILA Production Deployment Script
 * 
 * This script helps deploy the KIXIKILA application to production.
 * It performs pre-deployment checks and guides through the deployment process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} not found at ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVariable(envContent, variable, description) {
  const regex = new RegExp(`^${variable}=(?!CHANGE_TO|your-|sk_test_|pk_test_)`, 'm');
  if (regex.test(envContent)) {
    log(`✅ ${description} is configured`, 'green');
    return true;
  } else {
    log(`⚠️  ${description} needs to be configured`, 'yellow');
    return false;
  }
}

function main() {
  log('🚀 KIXIKILA Production Deployment Checker', 'cyan');
  log('==========================================', 'cyan');
  
  let allChecksPass = true;
  
  // Check if production environment files exist
  log('\n📁 Checking environment files...', 'blue');
  const backendEnvExists = checkFile('./backend/.env.production', 'Backend production environment file');
  const frontendEnvExists = checkFile('./.env.production', 'Frontend production environment file');
  
  if (!backendEnvExists || !frontendEnvExists) {
    allChecksPass = false;
  }
  
  // Check backend environment variables
  if (backendEnvExists) {
    log('\n🔧 Checking backend environment variables...', 'blue');
    const backendEnvContent = fs.readFileSync('./backend/.env.production', 'utf8');
    
    const backendChecks = [
      ['JWT_SECRET', 'JWT Secret'],
      ['STRIPE_SECRET_KEY', 'Stripe Secret Key'],
      ['BULKSMS_USERNAME', 'BulkSMS Username'],
      ['EMAIL_USER', 'Email User'],
      ['ADMIN_PASSWORD', 'Admin Password'],
      ['SESSION_SECRET', 'Session Secret'],
      ['WEBHOOK_SECRET', 'Webhook Secret']
    ];
    
    backendChecks.forEach(([variable, description]) => {
      if (!checkEnvVariable(backendEnvContent, variable, description)) {
        allChecksPass = false;
      }
    });
  }
  
  // Check frontend environment variables
  if (frontendEnvExists) {
    log('\n🌐 Checking frontend environment variables...', 'blue');
    const frontendEnvContent = fs.readFileSync('./.env.production', 'utf8');
    
    const frontendChecks = [
      ['VITE_API_URL', 'API URL'],
      ['VITE_STRIPE_PUBLISHABLE_KEY', 'Stripe Publishable Key']
    ];
    
    frontendChecks.forEach(([variable, description]) => {
      if (!checkEnvVariable(frontendEnvContent, variable, description)) {
        allChecksPass = false;
      }
    });
  }
  
  // Check if package.json has build scripts
  log('\n📦 Checking build configuration...', 'blue');
  const packageJsonExists = checkFile('./package.json', 'Frontend package.json');
  const backendPackageJsonExists = checkFile('./backend/package.json', 'Backend package.json');
  
  if (!packageJsonExists || !backendPackageJsonExists) {
    allChecksPass = false;
  }
  
  // Summary
  log('\n📋 Deployment Readiness Summary', 'magenta');
  log('================================', 'magenta');
  
  if (allChecksPass) {
    log('\n🎉 All checks passed! Your application is ready for production deployment.', 'green');
    log('\n📚 Next steps:', 'blue');
    log('1. Deploy backend to Railway/Render/Heroku');
    log('2. Update VITE_API_URL in .env.production with your backend URL');
    log('3. Deploy frontend to Vercel/Netlify');
    log('4. Test the production application');
  } else {
    log('\n⚠️  Some configuration issues need to be resolved before deployment.', 'yellow');
    log('\n📚 Please:', 'blue');
    log('1. Review the items marked with ❌ or ⚠️  above');
    log('2. Update the necessary environment variables');
    log('3. Run this script again to verify');
  }
  
  log('\n📖 For detailed deployment instructions, see DEPLOYMENT.md', 'cyan');
}

if (require.main === module) {
  main();
}

module.exports = { main };