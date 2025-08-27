#!/usr/bin/env node

/**
 * KIXIKILA Railway Deployment Script
 * 
 * This script automates the deployment process to Railway.
 * It handles environment setup, build validation, and deployment.
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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}\n`)
};

class RailwayDeployer {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.packageJsonPath = path.join(this.rootDir, 'package.json');
    this.envExamplePath = path.join(this.rootDir, '.env.example');
  }

  /**
   * Check if Railway CLI is installed
   */
  checkRailwayCLI() {
    log.title('Checking Railway CLI');
    
    try {
      const version = execSync('railway --version', { encoding: 'utf8' }).trim();
      log.success(`Railway CLI found: ${version}`);
      return true;
    } catch (error) {
      log.error('Railway CLI not found!');
      log.info('Install it with: npm install -g @railway/cli');
      log.info('Or visit: https://docs.railway.app/develop/cli');
      return false;
    }
  }

  /**
   * Check Railway authentication
   */
  checkRailwayAuth() {
    log.title('Checking Railway Authentication');
    
    try {
      const user = execSync('railway whoami', { encoding: 'utf8' }).trim();
      log.success(`Authenticated as: ${user}`);
      return true;
    } catch (error) {
      log.error('Not authenticated with Railway!');
      log.info('Run: railway login');
      return false;
    }
  }

  /**
   * Validate package.json
   */
  validatePackageJson() {
    log.title('Validating Package Configuration');
    
    if (!fs.existsSync(this.packageJsonPath)) {
      log.error('package.json not found!');
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      
      // Check required scripts
      const requiredScripts = ['start', 'build'];
      const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        log.error(`Missing required scripts: ${missingScripts.join(', ')}`);
        return false;
      }
      
      // Check main entry point
      if (!packageJson.main && !packageJson.scripts.start) {
        log.error('No main entry point or start script defined!');
        return false;
      }
      
      log.success('Package.json validation passed');
      log.info(`Name: ${packageJson.name}`);
      log.info(`Version: ${packageJson.version}`);
      log.info(`Start script: ${packageJson.scripts.start}`);
      
      return true;
    } catch (error) {
      log.error(`Failed to validate package.json: ${error.message}`);
      return false;
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironmentVariables() {
    log.title('Checking Environment Variables');
    
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'BULKSMS_USERNAME',
      'BULKSMS_PASSWORD',
      'EMAIL_HOST',
      'EMAIL_USER',
      'EMAIL_PASS'
    ];

    const missingVars = [];
    const presentVars = [];

    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        presentVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    });

    log.success(`Found ${presentVars.length} environment variables`);
    
    if (missingVars.length > 0) {
      log.warning(`Missing environment variables: ${missingVars.join(', ')}`);
      log.info('These will need to be set in Railway dashboard after deployment.');
    }

    return true;
  }

  /**
   * Run tests
   */
  runTests() {
    log.title('Running Tests');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts?.test) {
        log.warning('No test script found, skipping tests');
        return true;
      }

      log.info('Running test suite...');
      execSync('npm test', { 
        cwd: this.rootDir, 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      log.success('All tests passed!');
      return true;
    } catch (error) {
      log.error('Tests failed!');
      log.info('Fix failing tests before deploying to production.');
      return false;
    }
  }

  /**
   * Build the application
   */
  buildApplication() {
    log.title('Building Application');
    
    try {
      log.info('Installing dependencies...');
      execSync('npm ci --only=production', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      
      const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
      
      if (packageJson.scripts?.build) {
        log.info('Running build script...');
        execSync('npm run build', { 
          cwd: this.rootDir, 
          stdio: 'inherit' 
        });
      }
      
      log.success('Application built successfully!');
      return true;
    } catch (error) {
      log.error('Build failed!');
      log.error(error.message);
      return false;
    }
  }

  /**
   * Initialize Railway project
   */
  initializeRailwayProject() {
    log.title('Initializing Railway Project');
    
    try {
      // Check if already linked to a project
      try {
        const projectInfo = execSync('railway status', { encoding: 'utf8' });
        if (projectInfo.includes('Project:')) {
          log.success('Already linked to Railway project');
          return true;
        }
      } catch (error) {
        // Not linked to a project, continue with initialization
      }

      log.info('Creating new Railway project...');
      execSync('railway init', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      
      log.success('Railway project initialized!');
      return true;
    } catch (error) {
      log.error('Failed to initialize Railway project!');
      log.error(error.message);
      return false;
    }
  }

  /**
   * Set environment variables in Railway
   */
  setEnvironmentVariables() {
    log.title('Setting Environment Variables');
    
    const envVars = {
      NODE_ENV: 'production',
      PORT: '3001',
      // Add other environment variables as needed
    };

    try {
      Object.entries(envVars).forEach(([key, value]) => {
        try {
          execSync(`railway variables set ${key}=${value}`, { 
            cwd: this.rootDir,
            stdio: 'pipe'
          });
          log.success(`Set ${key}`);
        } catch (error) {
          log.warning(`Failed to set ${key}: ${error.message}`);
        }
      });
      
      log.info('Remember to set sensitive environment variables manually in Railway dashboard:');
      log.info('- SUPABASE_URL');
      log.info('- SUPABASE_ANON_KEY');
      log.info('- SUPABASE_SERVICE_ROLE_KEY');
      log.info('- JWT_SECRET');
      log.info('- STRIPE_SECRET_KEY');
      log.info('- STRIPE_WEBHOOK_SECRET');
      log.info('- BULKSMS_USERNAME');
      log.info('- BULKSMS_PASSWORD');
      log.info('- EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
      
      return true;
    } catch (error) {
      log.error('Failed to set environment variables!');
      log.error(error.message);
      return false;
    }
  }

  /**
   * Deploy to Railway
   */
  deployToRailway() {
    log.title('Deploying to Railway');
    
    try {
      log.info('Starting deployment...');
      execSync('railway up', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });
      
      log.success('Deployment completed!');
      
      // Get deployment URL
      try {
        const domain = execSync('railway domain', { 
          cwd: this.rootDir,
          encoding: 'utf8'
        }).trim();
        
        if (domain) {
          log.success(`🌐 Application deployed at: ${domain}`);
          log.info(`Health check: ${domain}/api/v1/health`);
        }
      } catch (error) {
        log.info('Run "railway domain" to get your deployment URL');
      }
      
      return true;
    } catch (error) {
      log.error('Deployment failed!');
      log.error(error.message);
      return false;
    }
  }

  /**
   * Generate deployment report
   */
  generateDeploymentReport(results) {
    log.title('Deployment Report');
    
    const report = [
      '🚀 KIXIKILA Railway Deployment Report',
      '=' .repeat(50),
      '',
      `✅ Railway CLI: ${results.cli ? 'READY' : 'MISSING'}`,
      `✅ Authentication: ${results.auth ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`,
      `✅ Package Validation: ${results.package ? 'VALID' : 'INVALID'}`,
      `✅ Environment Check: ${results.env ? 'CHECKED' : 'FAILED'}`,
      `✅ Tests: ${results.tests ? 'PASSED' : 'FAILED/SKIPPED'}`,
      `✅ Build: ${results.build ? 'SUCCESS' : 'FAILED'}`,
      `✅ Railway Project: ${results.project ? 'INITIALIZED' : 'FAILED'}`,
      `✅ Environment Variables: ${results.envVars ? 'SET' : 'FAILED'}`,
      `✅ Deployment: ${results.deploy ? 'SUCCESS' : 'FAILED'}`,
      '',
      '📋 Next Steps:',
      '1. Set sensitive environment variables in Railway dashboard',
      '2. Configure custom domain (if needed)',
      '3. Set up monitoring and alerts',
      '4. Run database migrations',
      '5. Test all API endpoints',
      '6. Update frontend API URLs',
      '',
      '🔗 Useful Commands:',
      '- railway logs: View application logs',
      '- railway status: Check deployment status',
      '- railway domain: Get deployment URL',
      '- railway variables: Manage environment variables',
      ''
    ];

    console.log('\n' + report.join('\n'));
    
    // Save report to file
    const reportFile = path.join(this.rootDir, 'railway-deployment-report.txt');
    fs.writeFileSync(reportFile, report.join('\n'));
    log.info(`Report saved to: ${reportFile}`);
  }

  /**
   * Main deployment process
   */
  async deploy() {
    log.title('KIXIKILA Railway Deployment');
    
    const results = {
      cli: false,
      auth: false,
      package: false,
      env: false,
      tests: false,
      build: false,
      project: false,
      envVars: false,
      deploy: false
    };

    // Check Railway CLI
    results.cli = this.checkRailwayCLI();
    if (!results.cli) {
      this.generateDeploymentReport(results);
      process.exit(1);
    }

    // Check authentication
    results.auth = this.checkRailwayAuth();
    if (!results.auth) {
      this.generateDeploymentReport(results);
      process.exit(1);
    }

    // Validate package.json
    results.package = this.validatePackageJson();
    if (!results.package) {
      this.generateDeploymentReport(results);
      process.exit(1);
    }

    // Check environment variables
    results.env = this.checkEnvironmentVariables();

    // Run tests
    results.tests = this.runTests();
    
    // Build application
    results.build = this.buildApplication();
    if (!results.build) {
      this.generateDeploymentReport(results);
      process.exit(1);
    }

    // Initialize Railway project
    results.project = this.initializeRailwayProject();
    if (!results.project) {
      this.generateDeploymentReport(results);
      process.exit(1);
    }

    // Set environment variables
    results.envVars = this.setEnvironmentVariables();

    // Deploy to Railway
    results.deploy = this.deployToRailway();

    // Generate report
    this.generateDeploymentReport(results);

    if (results.deploy) {
      log.success('🎉 Deployment completed successfully!');
      process.exit(0);
    } else {
      log.error('❌ Deployment failed.');
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const deployer = new RailwayDeployer();

  switch (command) {
    case 'check':
      deployer.checkRailwayCLI() && deployer.checkRailwayAuth();
      break;
    case 'validate':
      deployer.validatePackageJson() && deployer.checkEnvironmentVariables();
      break;
    case 'build':
      deployer.buildApplication();
      break;
    case 'test':
      deployer.runTests();
      break;
    default:
      await deployer.deploy();
  }
}

export default RailwayDeployer;