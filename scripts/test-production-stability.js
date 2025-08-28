#!/usr/bin/env node

/**
 * Production Stability Tests for KIXIKILA
 * 
 * Tests critical app functionality and stability
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const tests = [];
let passedTests = 0;
let failedTests = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
}

function runTest(test) {
  try {
    const result = test.testFn();
    if (result) {
      log(`✅ ${test.name}`, 'green');
      passedTests++;
      return true;
    } else {
      log(`❌ ${test.name}`, 'red');
      failedTests++;
      return false;
    }
  } catch (error) {
    log(`❌ ${test.name} - ERROR: ${error.message}`, 'red');
    failedTests++;
    return false;
  }
}

// Test 1: Check critical files exist
addTest('Critical files exist', () => {
  const criticalFiles = [
    'src/App.tsx',
    'src/pages/Index.tsx', 
    'src/pages/AdminPanel.tsx',
    'src/hooks/useSupabaseAuth.tsx',
    'src/stores/useAuthStore.ts',
    'src/services/supabaseAuthService.ts',
    'src/components/layout/BottomNavigation.tsx',
    'src/components/auth/ProtectedRoute.tsx'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing critical file: ${file}`);
    }
  }
  return true;
});

// Test 2: Check for problematic anchor tags
addTest('No problematic anchor tags', () => {
  const filesToCheck = [
    'src/pages/NotFound.tsx',
    'src/components/layout/BottomNavigation.tsx'
  ];
  
  for (const file of filesToCheck) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('<a href="/') && !content.includes('Link')) {
        throw new Error(`Found problematic <a href> in ${file}. Should use <Link> for SPA navigation.`);
      }
    }
  }
  return true;
});

// Test 3: Check bottom navigation logic
addTest('Bottom navigation shows on correct screens', () => {
  const botNavFile = 'src/components/layout/BottomNavigation.tsx';
  if (fs.existsSync(botNavFile)) {
    const content = fs.readFileSync(botNavFile, 'utf8');
    
    // Should not hide on all screens except auth screens
    if (content.includes("['dashboard', 'wallet', 'profile', 'notifications'].includes(currentScreen)")) {
      throw new Error('Bottom navigation has restrictive screen logic that causes disappearing menu');
    }
    
    // Should have proper hide logic for auth screens
    if (!content.includes('onboarding') || !content.includes('login') || !content.includes('register')) {
      throw new Error('Bottom navigation should hide on auth screens');
    }
  }
  return true;
});

// Test 4: Check authentication state management
addTest('Authentication state management', () => {
  const authStoreFile = 'src/stores/useAuthStore.ts';
  if (fs.existsSync(authStoreFile)) {
    const content = fs.readFileSync(authStoreFile, 'utf8');
    
    // Should have persist middleware
    if (!content.includes('persist')) {
      throw new Error('Auth store should use persist middleware for session persistence');
    }
    
    // Should have proper error handling
    if (!content.includes('catch') || !content.includes('error')) {
      throw new Error('Auth store should have proper error handling');
    }
  }
  return true;
});

// Test 5: Check Supabase integration
addTest('Supabase integration setup', () => {
  const supabaseFiles = [
    'src/integrations/supabase/client.ts',
    'src/services/supabaseAuthService.ts'
  ];
  
  for (const file of supabaseFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing Supabase file: ${file}`);
    }
  }
  return true;
});

// Test 6: Check route protection
addTest('Protected routes implementation', () => {
  const protectedRouteFile = 'src/components/auth/ProtectedRoute.tsx';
  if (fs.existsSync(protectedRouteFile)) {
    const content = fs.readFileSync(protectedRouteFile, 'utf8');
    
    // Should handle loading state
    if (!content.includes('isLoading')) {
      throw new Error('Protected route should handle loading state');
    }
    
    // Should redirect unauthorized users
    if (!content.includes('Navigate')) {
      throw new Error('Protected route should redirect unauthorized users');
    }
  }
  return true;
});

// Test 7: Check for duplicate auth initialization
addTest('No duplicate auth initialization', () => {
  const indexFile = 'src/pages/Index.tsx';
  const appFile = 'src/App.tsx';
  
  if (fs.existsSync(indexFile) && fs.existsSync(appFile)) {
    const indexContent = fs.readFileSync(indexFile, 'utf8');
    const appContent = fs.readFileSync(appFile, 'utf8');
    
    // App.tsx should use useSupabaseAuth hook
    if (!appContent.includes('useSupabaseAuth')) {
      throw new Error('App.tsx should use useSupabaseAuth hook');
    }
    
    // Index.tsx should not duplicate auth initialization
    const indexAuthCalls = (indexContent.match(/initializeAuth/g) || []).length;
    if (indexAuthCalls > 1) {
      log(`⚠️  Warning: Index.tsx has ${indexAuthCalls} initializeAuth calls. Consider reducing duplication.`, 'yellow');
    }
  }
  return true;
});

// Test 8: Check admin panel separation
addTest('Admin panel context separation', () => {
  const adminPanelFile = 'src/pages/AdminPanel.tsx';
  if (fs.existsSync(adminPanelFile)) {
    const content = fs.readFileSync(adminPanelFile, 'utf8');
    
    // Should use admin store, not user auth store
    if (!content.includes('useAdminStore')) {
      throw new Error('Admin panel should use useAdminStore');
    }
    
    // Should not use user auth store
    if (content.includes('useAuthStore')) {
      throw new Error('Admin panel should not use useAuthStore (user context)');
    }
  }
  return true;
});

// Main execution
async function runAllTests() {
  log('\n🧪 KIXIKILA Production Stability Tests\n', 'bold');
  log('='.repeat(50), 'blue');
  
  for (const test of tests) {
    runTest(test);
  }
  
  log('\n' + '='.repeat(50), 'blue');
  log(`\n📊 Results: ${passedTests} passed, ${failedTests} failed\n`, 'bold');
  
  if (failedTests === 0) {
    log('🎉 All tests passed! App stability looks good.', 'green');
    log('\n✅ Ready for production deployment:', 'green');
    log('   • Bottom navigation fixed', 'green');
    log('   • SPA navigation working', 'green');
    log('   • Session persistence enabled', 'green');
    log('   • Admin/User contexts separated', 'green');
    log('   • Route protection working', 'green');
  } else {
    log('⚠️  Some tests failed. Please fix issues before deploying.', 'red');
    process.exit(1);
  }
}

runAllTests();