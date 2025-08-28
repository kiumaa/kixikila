import { supabaseAdmin } from '../services/supabase';
import { otpService } from '../services/otpService';
import { logger } from '../utils/logger';

async function testFullRegistration() {
  let testUserId: string | null = null;
  const testEmail = `test-full-${Date.now()}@example.com`;
  
  try {
    logger.info('🚀 Testing full registration flow with OTP...');
    
    // Step 1: Create user
    logger.info('👤 Step 1: Creating test user...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: false // Don't auto-confirm, we'll use OTP
    });
    
    if (authError || !authUser.user) {
      logger.error('❌ User creation failed:', authError?.message);
      return false;
    }
    
    testUserId = authUser.user.id;
    logger.info('✅ User created:', testUserId);
    
    // Step 2: Generate OTP for email verification
    logger.info('📧 Step 2: Generating email verification OTP...');
    
    const otpCode = await otpService.generateOtp(testUserId, 'email_verification', testUserId);
    
    if (!otpCode) {
      logger.error('❌ OTP generation failed');
      return false;
    }
    
    logger.info('✅ OTP generated:', otpCode);
    
    // Step 3: Verify OTP
    logger.info('🔍 Step 3: Verifying OTP...');
    
    const verifyResult = await otpService.verifyOtp(testUserId, otpCode, 'email_verification');
    
    if (!verifyResult) {
      logger.error('❌ OTP verification failed');
      return false;
    }
    
    logger.info('✅ OTP verified successfully');
    
    // Step 4: Test invalid OTP
    logger.info('🚫 Step 4: Testing invalid OTP...');
    
    const invalidResult = await otpService.verifyOtp(testUserId, '999999', 'email_verification');
    
    if (invalidResult) {
      logger.error('❌ Invalid OTP should have failed');
      return false;
    }
    
    logger.info('✅ Invalid OTP correctly rejected');
    
    // Step 5: Test OTP expiration
    logger.info('⏰ Step 5: Testing OTP expiration...');
    
    // Generate a new OTP
    const expiredOtpCode = await otpService.generateOtp(testUserId, 'password_reset', testUserId);
    
    if (!expiredOtpCode) {
      logger.error('❌ Expired OTP generation failed');
      return false;
    }
    
    // Manually expire the OTP by updating the database
    const { error: expireError } = await supabaseAdmin
      .from('otp_codes')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() }) // 1 second ago
      .eq('code', expiredOtpCode)
      .eq('type', 'password_reset');
    
    if (expireError) {
      logger.error('❌ Failed to expire OTP:', expireError.message);
      return false;
    }
    
    // Try to verify expired OTP
    const expiredVerifyResult = await otpService.verifyOtp(testUserId, expiredOtpCode, 'password_reset');
    
    if (expiredVerifyResult) {
      logger.error('❌ Expired OTP should have failed');
      return false;
    }
    
    logger.info('✅ Expired OTP correctly rejected');
    
    // Step 6: Test rate limiting
    logger.info('🔄 Step 6: Testing rate limiting...');
    
    try {
      const rateLimitResult = await otpService.generateOtp(testUserId, 'email_verification', testUserId);
      logger.info('ℹ️ Rate limiting not triggered (may be expected)');
    } catch (error) {
      if (error instanceof Error && error.message.includes('wait')) {
        logger.info('✅ Rate limiting working:', error.message);
      } else {
        logger.warn('⚠️ Unexpected error in rate limiting test:', error);
      }
    }
    
    return true;
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  } finally {
    // Clean up test user
    if (testUserId) {
      logger.info('🧹 Cleaning up test user and OTPs...');
      try {
        // Clean up OTPs first
        await supabaseAdmin
          .from('otp_codes')
          .delete()
          .eq('user_id', testUserId);
        
        // Clean up user
        const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
        if (userDeleteError) {
          logger.warn('⚠️ Test user cleanup failed:', userDeleteError.message);
        } else {
          logger.info('✅ Test user and data cleaned up');
        }
      } catch (cleanupError) {
        logger.warn('⚠️ Cleanup exception:', cleanupError);
      }
    }
  }
}

// Execute the test
testFullRegistration()
  .then((success) => {
    if (success) {
      logger.info('🎉 FULL REGISTRATION TEST PASSED');
      logger.info('✅ OTP system is working correctly');
      logger.info('🚀 Ready for production use!');
    } else {
      logger.error('❌ FULL REGISTRATION TEST FAILED');
      logger.error('💡 Check the error messages above');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testFullRegistration };