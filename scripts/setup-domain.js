#!/usr/bin/env node

/**
 * KIXIKILA Domain Setup Script
 * 
 * This script helps configure custom domain and SSL certificates
 * for the KIXIKILA application across different hosting platforms.
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
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🌐 ${msg}${colors.reset}\n`),
  step: (msg) => console.log(`\n${colors.magenta}📋 ${msg}${colors.reset}\n`)
};

class DomainSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.platforms = {
      netlify: 'Netlify',
      railway: 'Railway',
      render: 'Render',
      vercel: 'Vercel',
      heroku: 'Heroku'
    };
  }

  /**
   * Display domain setup instructions
   */
  displayInstructions() {
    log.title('KIXIKILA Domain Setup Guide');
    
    console.log(`
${colors.bright}📋 Overview${colors.reset}`);
    console.log('This guide will help you configure a custom domain for your KIXIKILA application.');
    console.log('The process varies depending on your hosting platform and domain registrar.');
    
    console.log(`\n${colors.bright}🎯 What you\'ll need:${colors.reset}`);
    console.log('• A registered domain name');
    console.log('• Access to your domain registrar\'s DNS settings');
    console.log('• Your hosting platform dashboard access');
    console.log('• SSL certificate (usually provided automatically)');
  }

  /**
   * Netlify domain setup
   */
  setupNetlifyDomain() {
    log.step('Netlify Domain Setup');
    
    const instructions = [
      '1. 🌐 Login to Netlify Dashboard',
      '   • Go to https://app.netlify.com',
      '   • Select your KIXIKILA site',
      '',
      '2. 📝 Add Custom Domain',
      '   • Go to Site settings > Domain management',
      '   • Click "Add custom domain"',
      '   • Enter your domain (e.g., kixikila.com)',
      '   • Click "Verify"',
      '',
      '3. 🔧 Configure DNS Records',
      '   • In your domain registrar, add these records:',
      '   ',
      '   For apex domain (kixikila.com):',
      '   Type: A',
      '   Name: @',
      '   Value: 75.2.60.5',
      '   ',
      '   For www subdomain:',
      '   Type: CNAME',
      '   Name: www',
      '   Value: [your-site-name].netlify.app',
      '',
      '4. 🔒 SSL Certificate',
      '   • Netlify automatically provisions SSL',
      '   • Wait 24-48 hours for DNS propagation',
      '   • Certificate will be issued automatically',
      '',
      '5. ✅ Verification',
      '   • Check "HTTPS" is enabled in Domain settings',
      '   • Test your domain: https://yourdomain.com',
      '   • Verify redirect from HTTP to HTTPS'
    ];

    instructions.forEach(instruction => console.log(instruction));
  }

  /**
   * Railway domain setup
   */
  setupRailwayDomain() {
    log.step('Railway Domain Setup');
    
    const instructions = [
      '1. 🌐 Login to Railway Dashboard',
      '   • Go to https://railway.app',
      '   • Select your KIXIKILA project',
      '',
      '2. 📝 Add Custom Domain',
      '   • Go to your service settings',
      '   • Click "Domains" tab',
      '   • Click "Custom Domain"',
      '   • Enter your domain (e.g., api.kixikila.com)',
      '',
      '3. 🔧 Configure DNS Records',
      '   • Railway will provide CNAME target',
      '   • In your domain registrar, add:',
      '   ',
      '   Type: CNAME',
      '   Name: api (or your chosen subdomain)',
      '   Value: [provided by Railway]',
      '',
      '4. 🔒 SSL Certificate',
      '   • Railway automatically provisions SSL',
      '   • Certificate issued via Let\'s Encrypt',
      '   • Usually takes 5-10 minutes',
      '',
      '5. ✅ Verification',
      '   • Check domain status in Railway dashboard',
      '   • Test API: https://api.yourdomain.com/api/v1/health',
      '   • Update frontend API URLs'
    ];

    instructions.forEach(instruction => console.log(instruction));
  }

  /**
   * Render domain setup
   */
  setupRenderDomain() {
    log.step('Render Domain Setup');
    
    const instructions = [
      '1. 🌐 Login to Render Dashboard',
      '   • Go to https://dashboard.render.com',
      '   • Select your KIXIKILA service',
      '',
      '2. 📝 Add Custom Domain',
      '   • Go to Settings tab',
      '   • Scroll to "Custom Domains"',
      '   • Click "Add Custom Domain"',
      '   • Enter your domain',
      '',
      '3. 🔧 Configure DNS Records',
      '   • Render will provide CNAME target',
      '   • In your domain registrar, add:',
      '   ',
      '   Type: CNAME',
      '   Name: api (or your chosen subdomain)',
      '   Value: [provided by Render]',
      '',
      '4. 🔒 SSL Certificate',
      '   • Render automatically provisions SSL',
      '   • Uses Let\'s Encrypt certificates',
      '   • Usually takes 10-15 minutes',
      '',
      '5. ✅ Verification',
      '   • Check "Verified" status in dashboard',
      '   • Test API endpoint',
      '   • Update environment variables if needed'
    ];

    instructions.forEach(instruction => console.log(instruction));
  }

  /**
   * Vercel domain setup
   */
  setupVercelDomain() {
    log.step('Vercel Domain Setup');
    
    const instructions = [
      '1. 🌐 Login to Vercel Dashboard',
      '   • Go to https://vercel.com/dashboard',
      '   • Select your KIXIKILA project',
      '',
      '2. 📝 Add Custom Domain',
      '   • Go to Settings > Domains',
      '   • Enter your domain',
      '   • Click "Add"',
      '',
      '3. 🔧 Configure DNS Records',
      '   • Vercel will show required DNS records',
      '   • In your domain registrar, add:',
      '   ',
      '   For apex domain:',
      '   Type: A',
      '   Name: @',
      '   Value: 76.76.19.61',
      '   ',
      '   For www:',
      '   Type: CNAME',
      '   Name: www',
      '   Value: cname.vercel-dns.com',
      '',
      '4. 🔒 SSL Certificate',
      '   • Vercel automatically provisions SSL',
      '   • Uses Let\'s Encrypt certificates',
      '   • Usually instant after DNS propagation',
      '',
      '5. ✅ Verification',
      '   • Check domain status in Vercel dashboard',
      '   • Test your application',
      '   • Verify HTTPS redirect'
    ];

    instructions.forEach(instruction => console.log(instruction));
  }

  /**
   * Generate DNS configuration file
   */
  generateDNSConfig(domain, platform) {
    log.step('Generating DNS Configuration');
    
    const dnsConfigs = {
      netlify: {
        apex: {
          type: 'A',
          name: '@',
          value: '75.2.60.5',
          ttl: '3600'
        },
        www: {
          type: 'CNAME',
          name: 'www',
          value: `${domain.replace('.', '-')}.netlify.app`,
          ttl: '3600'
        }
      },
      railway: {
        api: {
          type: 'CNAME',
          name: 'api',
          value: '[PROVIDED_BY_RAILWAY]',
          ttl: '3600'
        }
      },
      render: {
        api: {
          type: 'CNAME',
          name: 'api',
          value: '[PROVIDED_BY_RENDER]',
          ttl: '3600'
        }
      },
      vercel: {
        apex: {
          type: 'A',
          name: '@',
          value: '76.76.19.61',
          ttl: '3600'
        },
        www: {
          type: 'CNAME',
          name: 'www',
          value: 'cname.vercel-dns.com',
          ttl: '3600'
        }
      }
    };

    const config = dnsConfigs[platform];
    if (!config) {
      log.error(`Platform ${platform} not supported`);
      return;
    }

    const dnsFile = {
      domain: domain,
      platform: platform,
      records: config,
      instructions: [
        'Add these DNS records to your domain registrar:',
        '',
        ...Object.entries(config).map(([key, record]) => 
          `${record.type} Record:\n  Name: ${record.name}\n  Value: ${record.value}\n  TTL: ${record.ttl}\n`
        ),
        'Note: DNS propagation can take up to 48 hours.',
        'SSL certificates are usually issued automatically after DNS verification.'
      ]
    };

    const configPath = path.join(this.rootDir, `dns-config-${domain}-${platform}.json`);
    fs.writeFileSync(configPath, JSON.stringify(dnsFile, null, 2));
    
    log.success(`DNS configuration saved to: ${configPath}`);
    return configPath;
  }

  /**
   * Update frontend configuration
   */
  updateFrontendConfig(domain, platform) {
    log.step('Updating Frontend Configuration');
    
    const apiUrls = {
      netlify: `https://${domain}`,
      railway: `https://api.${domain}`,
      render: `https://api.${domain}`,
      vercel: `https://${domain}`,
      heroku: `https://api.${domain}`
    };

    const apiUrl = apiUrls[platform];
    if (!apiUrl) {
      log.error(`Platform ${platform} not supported`);
      return;
    }

    const envUpdates = [
      '# Update these environment variables in your frontend:',
      '',
      `VITE_API_URL=${apiUrl}`,
      `VITE_API_BASE_URL=${apiUrl}/api/v1`,
      '',
      '# For Netlify deployment:',
      '# Add these to your netlify.toml [build.environment] section',
      '',
      '# For local development:',
      '# Update your .env.local file',
      '',
      '# Don\'t forget to:',
      '# 1. Update CORS settings in backend',
      '# 2. Update Stripe webhook URLs',
      '# 3. Test all API endpoints',
      '# 4. Update any hardcoded URLs in the code'
    ];

    const envPath = path.join(this.rootDir, `frontend-env-${domain}.txt`);
    fs.writeFileSync(envPath, envUpdates.join('\n'));
    
    log.success(`Frontend configuration saved to: ${envPath}`);
    log.info(`API URL: ${apiUrl}`);
    
    return apiUrl;
  }

  /**
   * Generate SSL verification checklist
   */
  generateSSLChecklist(domain) {
    log.step('SSL Certificate Checklist');
    
    const checklist = [
      '🔒 SSL Certificate Verification Checklist',
      '=' .repeat(50),
      '',
      '✅ Pre-verification:',
      '□ Domain DNS records are configured',
      '□ DNS propagation completed (check with dig/nslookup)',
      '□ Domain points to correct hosting platform',
      '',
      '✅ Certificate issuance:',
      '□ SSL certificate requested by hosting platform',
      '□ Certificate status shows "Active" or "Issued"',
      '□ Certificate covers both apex and www domains',
      '',
      '✅ HTTPS verification:',
      `□ https://${domain} loads correctly`,
      `□ https://www.${domain} redirects properly`,
      '□ HTTP automatically redirects to HTTPS',
      '□ No mixed content warnings',
      '□ SSL Labs test shows A+ rating',
      '',
      '✅ Application testing:',
      '□ Frontend loads correctly',
      '□ API endpoints respond properly',
      '□ Authentication works',
      '□ Payment processing functions',
      '□ All features work as expected',
      '',
      '🔧 Troubleshooting:',
      '• DNS propagation: https://dnschecker.org',
      '• SSL test: https://www.ssllabs.com/ssltest/',
      '• Certificate details: Check browser security tab',
      '• Mixed content: Check browser console for errors',
      '',
      '📞 Support contacts:',
      '• Netlify: https://docs.netlify.com/domains-https/',
      '• Railway: https://docs.railway.app/deploy/custom-domains',
      '• Render: https://render.com/docs/custom-domains',
      '• Vercel: https://vercel.com/docs/concepts/projects/custom-domains'
    ];

    const checklistPath = path.join(this.rootDir, `ssl-checklist-${domain}.txt`);
    fs.writeFileSync(checklistPath, checklist.join('\n'));
    
    log.success(`SSL checklist saved to: ${checklistPath}`);
    return checklistPath;
  }

  /**
   * Main setup process
   */
  setup(domain, platform) {
    if (!domain || !platform) {
      this.displayInstructions();
      console.log(`\n${colors.bright}Usage:${colors.reset}`);
      console.log('node setup-domain.js <domain> <platform>');
      console.log('');
      console.log('Examples:');
      console.log('node setup-domain.js kixikila.com netlify');
      console.log('node setup-domain.js myapp.com railway');
      console.log('');
      console.log('Supported platforms: netlify, railway, render, vercel, heroku');
      return;
    }

    if (!this.platforms[platform]) {
      log.error(`Platform '${platform}' not supported`);
      log.info(`Supported platforms: ${Object.keys(this.platforms).join(', ')}`);
      return;
    }

    log.title(`Setting up ${domain} for ${this.platforms[platform]}`);

    // Display platform-specific instructions
    switch (platform) {
      case 'netlify':
        this.setupNetlifyDomain();
        break;
      case 'railway':
        this.setupRailwayDomain();
        break;
      case 'render':
        this.setupRenderDomain();
        break;
      case 'vercel':
        this.setupVercelDomain();
        break;
      default:
        log.warning(`Detailed instructions for ${platform} not available`);
    }

    // Generate configuration files
    this.generateDNSConfig(domain, platform);
    this.updateFrontendConfig(domain, platform);
    this.generateSSLChecklist(domain);

    log.title('Setup Complete!');
    log.success('Configuration files generated successfully');
    log.info('Follow the platform-specific instructions above');
    log.info('DNS propagation can take up to 48 hours');
    log.warning('Don\'t forget to update your frontend environment variables!');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const domain = args[0];
  const platform = args[1];

  const domainSetup = new DomainSetup();
  domainSetup.setup(domain, platform);
}

export default DomainSetup;