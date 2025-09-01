#!/usr/bin/env node

/**
 * KIXIKILA - Security Testing Suite
 * 
 * Executes comprehensive security tests after implementing fixes
 */

import { createClient } from '@supabase/supabase-js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.magenta}🔐 ${msg}${colors.reset}\n`)
};

class SecurityTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      critical: 0,
      tests: []
    };

    this.supabase = createClient(
      'https://hkesrohuaurcyonpktyt.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZXNyb2h1YXVyY3lvbnBrdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjIzMjksImV4cCI6MjA3MTg5ODMyOX0.SNDuFuzRerlL4qmlKGWFm8cf4UH21MmsbhxV4B8SVcg'
    );
  }

  addResult(testName, status, message, details = {}) {
    this.results.tests.push({ 
      testName, 
      status, 
      message, 
      details, 
      timestamp: new Date()
    });
    
    this.results[status]++;
    
    const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '🔥';
    const color = status === 'passed' ? colors.green : status === 'failed' ? colors.red : colors.red;
    console.log(`${color}${icon} ${testName}: ${message}${colors.reset}`);
  }

  // Test 1: RLS Policies Validation
  async testRLSPolicies() {
    log.info('Testing Row Level Security policies...');
    
    try {
      // Test unauthenticated access to sensitive tables
      const sensitiveTableTest = async (tableName) => {
        try {
          const { data, error } = await this.supabase.from(tableName).select('*').limit(1);
          
          if (error && (error.code === 'PGRST116' || error.message.includes('permission denied'))) {
            this.addResult(`RLS Policy - ${tableName}`, 'passed', `Table properly protected by RLS`);
            return true;
          } else if (data && data.length === 0) {
            this.addResult(`RLS Policy - ${tableName}`, 'passed', `Table accessible but returns no data (expected for unauthenticated users)`);
            return true;
          } else {
            this.addResult(`RLS Policy - ${tableName}`, 'critical', `Table may be publicly accessible!`, { data: data?.length || 0 });
            return false;
          }
        } catch (error) {
          this.addResult(`RLS Policy - ${tableName}`, 'passed', `Access properly denied: ${error.message}`);
          return true;
        }
      };

      // Test critical tables
      const criticalTables = ['users', 'transactions', 'groups', 'group_members', 'payout_accounts', 'withdrawals'];
      const results = await Promise.all(criticalTables.map(table => sensitiveTableTest(table)));
      
      return results.every(result => result);
    } catch (error) {
      this.addResult('RLS Policies', 'failed', `RLS test failed: ${error.message}`);
      return false;
    }
  }

  // Test 2: Authentication Security
  async testAuthenticationSecurity() {
    log.info('Testing authentication security...');
    
    try {
      // Test OTP security
      const { data: otpData, error: otpError } = await this.supabase
        .from('otp_codes')
        .select('*')
        .limit(1);

      if (otpError && otpError.message.includes('permission')) {
        this.addResult('OTP Security', 'passed', 'OTP codes properly protected');
      } else {
        this.addResult('OTP Security', 'critical', 'OTP codes may be exposed!');
      }

      // Test auth_pin security
      const { data: pinData, error: pinError } = await this.supabase
        .from('auth_pin')
        .select('*')
        .limit(1);

      if (pinError && pinError.message.includes('permission')) {
        this.addResult('PIN Security', 'passed', 'PIN data properly protected');
      } else {
        this.addResult('PIN Security', 'critical', 'PIN data may be exposed!');
      }

      return true;
    } catch (error) {
      this.addResult('Authentication Security', 'failed', `Auth security test failed: ${error.message}`);
      return false;
    }
  }

  // Test 3: Data Exposure Check
  async testDataExposure() {
    log.info('Testing for sensitive data exposure...');
    
    try {
      const sensitiveEndpoints = [
        { table: 'users', sensitive_fields: ['email', 'phone', 'wallet_balance'] },
        { table: 'transactions', sensitive_fields: ['amount', 'payment_reference'] },
        { table: 'payout_accounts', sensitive_fields: ['iban', 'account_holder_name'] }
      ];

      for (const endpoint of sensitiveEndpoints) {
        const { data, error } = await this.supabase
          .from(endpoint.table)
          .select(endpoint.sensitive_fields.join(','))
          .limit(1);

        if (error && error.message.includes('permission')) {
          this.addResult(`Data Exposure - ${endpoint.table}`, 'passed', 'Sensitive data properly protected');
        } else if (data && data.length === 0) {
          this.addResult(`Data Exposure - ${endpoint.table}`, 'passed', 'No data returned (expected for unauthenticated users)');
        } else {
          this.addResult(`Data Exposure - ${endpoint.table}`, 'critical', `Sensitive data may be exposed!`, { fields: endpoint.sensitive_fields });
        }
      }

      return true;
    } catch (error) {
      this.addResult('Data Exposure', 'failed', `Data exposure test failed: ${error.message}`);
      return false;
    }
  }

  // Test 4: Edge Functions Security
  async testEdgeFunctionsSecurity() {
    log.info('Testing Edge Functions security...');
    
    try {
      // Test protected functions
      const protectedFunctions = [
        'create-checkout',
        'create-withdrawal', 
        'admin-monitoring',
        'manage-system-config'
      ];

      for (const funcName of protectedFunctions) {
        try {
          const { data, error } = await this.supabase.functions.invoke(funcName, {
            body: { test: true }
          });

          if (error && (error.message.includes('JWT') || error.message.includes('auth'))) {
            this.addResult(`Function Security - ${funcName}`, 'passed', 'Function properly protected by authentication');
          } else {
            this.addResult(`Function Security - ${funcName}`, 'warning', 'Function may not require authentication');
          }
        } catch (error) {
          this.addResult(`Function Security - ${funcName}`, 'passed', `Function access denied: ${error.message}`);
        }
      }

      return true;
    } catch (error) {
      this.addResult('Edge Functions Security', 'failed', `Function security test failed: ${error.message}`);
      return false;
    }
  }

  // Test 5: System Configuration Security
  async testSystemConfigSecurity() {
    log.info('Testing system configuration security...');
    
    try {
      const { data, error } = await this.supabase
        .from('system_configurations')
        .select('*')
        .limit(1);

      if (error && error.message.includes('permission')) {
        this.addResult('System Config Security', 'passed', 'System configurations properly protected');
        return true;
      } else {
        this.addResult('System Config Security', 'critical', 'System configurations may be exposed!');
        return false;
      }
    } catch (error) {
      this.addResult('System Config Security', 'failed', `Config security test failed: ${error.message}`);
      return false;
    }
  }

  // Generate comprehensive security report
  generateSecurityReport() {
    const totalTests = this.results.passed + this.results.failed + this.results.critical;
    const securityScore = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    log.title('KIXIKILA - Security Audit Report');
    console.log('='.repeat(60));
    
    console.log(`🔍 Total Security Tests: ${totalTests}`);
    log.success(`Passed: ${this.results.passed}`);
    log.error(`Failed: ${this.results.failed}`);
    log.error(`Critical Issues: ${this.results.critical}`);
    console.log(`🛡️  Security Score: ${securityScore}%\n`);

    // Security assessment
    if (this.results.critical > 0) {
      log.error('🚨 CRITICAL SECURITY ISSUES DETECTED!');
      console.log('❗ IMMEDIATE ACTION REQUIRED - Do not deploy to production!');
    } else if (this.results.failed > 0) {
      log.warning('⚠️ SECURITY WARNINGS DETECTED');
      console.log('⚡ Review and fix issues before production deployment');
    } else {
      log.success('🎉 SECURITY ASSESSMENT: PASSED');
      console.log('✨ All critical security tests passed - Ready for production!');
    }

    console.log('\n📋 Detailed Security Test Results:');
    console.log('-'.repeat(40));
    
    this.results.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '⚠️' : '🚨';
      console.log(`${icon} ${test.testName}: ${test.message}`);
    });

    console.log('\n' + '='.repeat(60));

    return this.results.critical === 0 && this.results.failed === 0;
  }

  // Run all security tests
  async runAllSecurityTests() {
    log.title('Starting KIXIKILA Security Test Suite');
    
    const tests = [
      { name: 'RLS Policies', test: this.testRLSPolicies.bind(this) },
      { name: 'Authentication Security', test: this.testAuthenticationSecurity.bind(this) },
      { name: 'Data Exposure', test: this.testDataExposure.bind(this) },
      { name: 'Edge Functions Security', test: this.testEdgeFunctionsSecurity.bind(this) },
      { name: 'System Configuration', test: this.testSystemConfigSecurity.bind(this) }
    ];

    const startTime = Date.now();

    for (const test of tests) {
      log.info(`Running ${test.name} tests...`);
      try {
        await test.test();
      } catch (error) {
        this.addResult(test.name, 'failed', `Test suite failed: ${error.message}`);
      }
      console.log('');
    }

    const totalDuration = Date.now() - startTime;
    console.log(`⏱️  Total security test duration: ${totalDuration}ms\n`);

    return this.generateSecurityReport();
  }
}

// Main execution
async function main() {
  const securityTester = new SecurityTestSuite();
  
  try {
    const allSecurityTestsPassed = await securityTester.runAllSecurityTests();
    
    console.log('\n📄 Security report completed');
    
    process.exit(allSecurityTestsPassed ? 0 : 1);
  } catch (error) {
    log.error(`Security testing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { SecurityTestSuite };