import { logger } from '../utils/logger';

async function testRegistrationEndpoint() {
  try {
    logger.info('🧪 Testing registration endpoint...');
    
    const testEmail = `test-endpoint-${Date.now()}@example.com`;
    const testData = {
      email: testEmail,
      password: 'testpassword123',
      full_name: 'Test User',
      phone: '+244900000000'
    };
    
    // Test registration endpoint
    logger.info('📝 Testing POST /api/v1/auth/register...');
    
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    logger.info('Response status:', response.status);
    logger.info('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    logger.info('Response text:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      logger.info('Response data:', responseData);
    } catch (parseError) {
      logger.error('Failed to parse response as JSON:', parseError);
      logger.error('Raw response:', responseText);
      return false;
    }
    
    if (response.ok) {
      logger.info('✅ Registration endpoint working correctly');
      
      // Test OTP verification endpoint if registration was successful
      if (responseData.data && responseData.data.otp) {
        logger.info('📧 Testing OTP verification...');
        
        const otpData = {
          email: testEmail,
          otp: responseData.data.otp, // Use the OTP from registration response
          type: 'email_verification'
        };
        
        const otpResponse = await fetch('http://localhost:3001/api/v1/auth/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(otpData),
        });
        
        const otpResponseData = await otpResponse.json();
        
        logger.info('OTP Response status:', otpResponse.status);
        logger.info('OTP Response data:', otpResponseData);
        
        if (otpResponse.ok) {
          logger.info('✅ OTP verification endpoint working correctly');
        } else {
          logger.warn('⚠️ OTP verification failed:', otpResponseData.message);
        }
      }
      
      return true;
    } else {
      logger.error('❌ Registration endpoint failed:', responseData.message);
      return false;
    }
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  }
}

// Execute the test
testRegistrationEndpoint()
  .then((success) => {
    if (success) {
      logger.info('🎉 REGISTRATION ENDPOINT TEST PASSED');
      logger.info('✅ Backend API is working correctly');
      logger.info('🚀 Ready for frontend integration!');
    } else {
      logger.error('❌ REGISTRATION ENDPOINT TEST FAILED');
      logger.error('💡 Check the error messages above');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testRegistrationEndpoint };