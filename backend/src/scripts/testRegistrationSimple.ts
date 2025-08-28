import { logger } from '../utils/logger';

async function testRegistrationSimple() {
  try {
    logger.info('🧪 Testing registration with complete data...');
    
    const testEmail = `test-simple-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    const testData = {
      email: testEmail,
      password: 'TestPassword123!',
      fullName: 'Test User Complete',
      phone: '+244900000001',
      acceptTerms: true,
      acceptPrivacy: true,
      dateOfBirth: '1990-01-01',
      address: 'Test Address 123',
      city: 'Luanda',
      country: 'Angola'
    };
    
    logger.info('📝 Sending registration request with data:', {
      ...testData,
      password: '[HIDDEN]'
    });
    
    const response = await fetch('http://localhost:3001/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    logger.info('📡 Response received:');
    logger.info('Status:', response.status);
    logger.info('Status Text:', response.statusText);
    logger.info('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    logger.info('Raw Response:', responseText);
    
    if (!responseText) {
      logger.error('❌ Empty response received');
      return false;
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      logger.info('Parsed Response:', responseData);
    } catch (parseError) {
      logger.error('❌ Failed to parse JSON response:', parseError);
      logger.error('Raw response was:', responseText);
      return false;
    }
    
    if (response.ok) {
      logger.info('✅ Registration successful!');
      logger.info('User created:', responseData.data?.user);
      return true;
    } else {
      logger.error('❌ Registration failed');
      logger.error('Error:', responseData.message || 'Unknown error');
      logger.error('Details:', responseData.errors || responseData.error);
      return false;
    }
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  }
}

// Execute the test
testRegistrationSimple()
  .then((success) => {
    if (success) {
      logger.info('🎉 SIMPLE REGISTRATION TEST PASSED');
    } else {
      logger.error('❌ SIMPLE REGISTRATION TEST FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testRegistrationSimple };