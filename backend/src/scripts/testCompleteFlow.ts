import { logger } from '../utils/logger';
import { otpService } from '../services/otpService';
import { supabaseAdmin } from '../services/supabase';

async function testCompleteFlow() {
  try {
    logger.info('🧪 Testing complete registration and OTP verification flow...');
    
    const testEmail = `test-flow-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const testData = {
      email: testEmail,
      password: 'TestPassword123!',
      fullName: 'Test Flow User',
      phone: '+244900000002',
      acceptTerms: true,
      acceptPrivacy: true,
      dateOfBirth: '1990-01-01',
      address: 'Test Address 123',
      city: 'Luanda',
      country: 'Angola'
    };
    
    // Step 1: Register user
    logger.info('📝 Step 1: Registering user...');
    
    const registerResponse = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      logger.error('❌ Registration failed:');
      logger.error('Status:', registerResponse.status);
      logger.error('Status Text:', registerResponse.statusText);
      logger.error('Response:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        logger.error('Error message:', errorData.message);
      } catch (e) {
        logger.error('Could not parse error response as JSON');
      }
      return false;
    }
    
    const registerData = await registerResponse.json();
    logger.info('✅ Registration successful:', registerData.data.user);
    
    // Step 2: Get OTP from database (simulating what would be sent via email/SMS)
    logger.info('📧 Step 2: Getting OTP from database...');
    
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('code, type, user_id')
      .eq('user_id', registerData.data.user.id)
      .eq('type', 'email_verification')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (otpError || !otpRecord) {
      logger.error('❌ Failed to get OTP from database:', otpError);
      return false;
    }
    
    logger.info('✅ OTP retrieved from database:', { type: otpRecord.type });
    
    // Step 3: Verify OTP
    logger.info('🔐 Step 3: Verifying OTP...');
    
    const verifyResponse = await fetch('http://localhost:3001/api/v1/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        otp: otpRecord.code,
        type: 'email_verification'
      }),
    });
    
    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      logger.error('❌ OTP verification failed:', errorData.message);
      return false;
    }
    
    const verifyData = await verifyResponse.json();
    logger.info('✅ OTP verification successful:', verifyData.message);
    
    // Step 4: Test login
    logger.info('🔑 Step 4: Testing login...');
    
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testData.password
      }),
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      logger.error('❌ Login failed:', errorData.message);
      return false;
    }
    
    const loginData = await loginResponse.json();
    logger.info('✅ Login successful:', {
      user: loginData.data.user,
      hasTokens: !!loginData.data.tokens
    });
    
    // Cleanup: Delete test user
    logger.info('🧹 Cleaning up test user...');
    
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      registerData.data.user.id
    );
    
    if (deleteError) {
      logger.warn('⚠️ Failed to cleanup test user:', deleteError.message);
    } else {
      logger.info('✅ Test user cleaned up successfully');
    }
    
    return true;
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  }
}

// Execute the test
testCompleteFlow()
  .then((success) => {
    if (success) {
      logger.info('🎉 COMPLETE FLOW TEST PASSED');
      logger.info('✅ Registration, OTP verification, and login all working!');
      logger.info('🚀 Backend API is fully functional!');
    } else {
      logger.error('❌ COMPLETE FLOW TEST FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testCompleteFlow };