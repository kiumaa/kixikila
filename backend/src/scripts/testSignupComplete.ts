import { SignupFlowTester } from '../../../scripts/test-signup-flow.js';
import { logger } from '../utils/logger';

async function testSignupComplete() {
  try {
    logger.info('🧪 Starting comprehensive signup/OTP test...');
    
    const tester = new SignupFlowTester();
    const result = await tester.runAllTests();
    
    if (result.success) {
      logger.info('🎉 SIGNUP TEST PASSED - All systems working correctly');
    } else {
      logger.error('❌ SIGNUP TEST FAILED - Issues found that need fixing');
      if (result.error) {
        logger.error('Error details:', result.error);
      }
    }
    
    return result.success;
  } catch (error) {
    logger.error('💥 Test execution failed:', error);
    return false;
  }
}

// Execute the test
testSignupComplete()
  .then((success) => {
    if (success) {
      logger.info('🎊 COMPLETE SIGNUP TEST PASSED');
    } else {
      logger.error('❌ COMPLETE SIGNUP TEST FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testSignupComplete };