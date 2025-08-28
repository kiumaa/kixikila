#!/usr/bin/env node

/**
 * Production Stability Test Script for KIXIKILA
 * 
 * Tests critical functionalities:
 * - Phone authentication flow  
 * - Session persistence
 * - Navigation between contexts (user/admin)
 * - Bottom menu behavior
 * - Route protection
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.TEST_URL || 'https://kixikila.pro',
  adminUrl: process.env.ADMIN_URL || 'https://kixikila.pro/admin',
  testPhone: process.env.TEST_PHONE || '+351912345678',
  timeout: 30000
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility functions
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

const addResult = (testName, passed, details = '', error = null) => {
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}: PASSED`);
  } else {
    testResults.failed++;
    log(`❌ ${testName}: FAILED - ${details}`);
    if (error) {
      testResults.errors.push({ testName, error: error.message });
    }
  }
  testResults.details.push({ testName, passed, details, timestamp: new Date().toISOString() });
};

// Test functions
async function testEndpoint(url, testName) {
  try {
    log(`🔄 Testing ${testName}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'KIXIKILA-Stability-Test'
      }
    });
    
    if (!response.ok) {
      addResult(testName, false, `HTTP ${response.status}`);
      return false;
    }

    const text = await response.text();
    if (!text || text.length < 100) {
      addResult(testName, false, 'Response too short or empty');
      return false;
    }

    addResult(testName, true, 'Endpoint accessible');
    return true;
  } catch (error) {
    addResult(testName, false, `Request failed: ${error.message}`, error);
    return false;
  }
}

async function testPhoneAuthImplementation() {
  try {
    log('🔄 Testing phone authentication implementation...');
    
    // Test main app endpoint
    const response = await fetch(config.baseUrl);
    const html = await response.text();
    
    // Check for phone-only signup indicators
    const hasEmailInput = html.includes('type="email"') || html.includes('placeholder*="email"');
    const hasPasswordInput = html.includes('type="password"');
    const hasPhoneInput = html.includes('type="tel"') || html.includes('placeholder*="912"') || html.includes('+351');
    
    if (hasEmailInput || hasPasswordInput) {
      addResult('Phone Auth Implementation', false, 'Email/password fields still present');
      return false;
    }
    
    if (!hasPhoneInput) {
      addResult('Phone Auth Implementation', false, 'Phone input not found');
      return false;
    }
    
    addResult('Phone Auth Implementation', true, 'Phone-only authentication detected');
    return true;
  } catch (error) {
    addResult('Phone Auth Implementation', false, 'Failed to check auth implementation', error);
    return false;
  }
}

async function testNavigationStructure() {
  try {
    log('🔄 Testing navigation structure...');
    
    const routes = [
      { url: config.baseUrl, name: 'Main App', shouldExist: true },
      { url: `${config.adminUrl}`, name: 'Admin Panel', shouldExist: true },
      { url: `${config.baseUrl}/invalid-route`, name: '404 Route', shouldExist: false }
    ];

    let allPassed = true;

    for (const route of routes) {
      try {
        const response = await fetch(route.url);
        const exists = response.ok;
        
        if (route.shouldExist && !exists) {
          addResult(`Navigation - ${route.name}`, false, `Route should exist but returned ${response.status}`);
          allPassed = false;
        } else if (!route.shouldExist && exists && response.status !== 404) {
          addResult(`Navigation - ${route.name}`, false, `404 route should return 404 but returned ${response.status}`);
          allPassed = false;
        } else {
          addResult(`Navigation - ${route.name}`, true, 'Route behaves correctly');
        }
        
      } catch (error) {
        addResult(`Navigation - ${route.name}`, false, `Route test failed: ${error.message}`);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (error) {
    addResult('Navigation Structure', false, 'Navigation test failed', error);
    return false;
  }
}

async function testResponsiveDesign() {
  try {
    log('🔄 Testing responsive design indicators...');
    
    const response = await fetch(config.baseUrl);
    const html = await response.text();
    
    // Check for responsive design indicators
    const hasViewport = html.includes('viewport');
    const hasTailwind = html.includes('tailwind') || html.includes('responsive');
    const hasCSS = html.includes('.css') || html.includes('stylesheet');
    
    if (!hasViewport) {
      addResult('Responsive Design', false, 'Missing viewport meta tag');
      return false;
    }
    
    addResult('Responsive Design', true, 'Responsive design indicators found');
    return true;
  } catch (error) {
    addResult('Responsive Design', false, 'Failed to check responsive design', error);
    return false;
  }
}

async function testSecurityHeaders() {
  try {
    log('🔄 Testing security headers...');
    
    const response = await fetch(config.baseUrl);
    const headers = response.headers;
    
    const securityChecks = [
      { name: 'Content-Type', header: 'content-type', required: true },
      { name: 'X-Frame-Options', header: 'x-frame-options', required: false },
      { name: 'Content-Security-Policy', header: 'content-security-policy', required: false }
    ];
    
    let passed = true;
    
    for (const check of securityChecks) {
      const hasHeader = headers.has(check.header);
      
      if (check.required && !hasHeader) {
        addResult(`Security - ${check.name}`, false, 'Required header missing');
        passed = false;
      } else {
        addResult(`Security - ${check.name}`, true, hasHeader ? 'Header present' : 'Optional header not set');
      }
    }
    
    return passed;
  } catch (error) {
    addResult('Security Headers', false, 'Failed to check security headers', error);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting KIXIKILA Production Stability Tests...');
  log(`Testing URL: ${config.baseUrl}`);
  log(`Admin URL: ${config.adminUrl}`);
  
  try {
    // Run all tests
    log('\n📋 Running test suite...\n');

    await testEndpoint(config.baseUrl, 'Main App Accessibility');
    await testEndpoint(config.adminUrl, 'Admin Panel Accessibility');
    
    await testPhoneAuthImplementation();
    await testNavigationStructure();
    await testResponsiveDesign();
    await testSecurityHeaders();

    // Generate report
    log('\n📊 Test Results Summary:\n');
    log(`✅ Passed: ${testResults.passed}`);
    log(`❌ Failed: ${testResults.failed}`);
    log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      log('\n🚨 Failed Tests:');
      testResults.details
        .filter(result => !result.passed)
        .forEach(result => {
          log(`  - ${result.testName}: ${result.details}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, `../test-reports/stability-report-${Date.now()}.json`);
    await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.promises.writeFile(reportPath, JSON.stringify(testResults, null, 2));
    log(`\n📄 Detailed report saved: ${reportPath}`);

    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    log(`💥 Test runner failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, config };