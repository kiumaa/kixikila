import { logger } from '../utils/logger';

async function testServerHealth() {
  try {
    logger.info('🏥 Testing server health...');
    
    // Test health endpoint
    logger.info('📡 Testing GET /api/v1/health...');
    
    const response = await fetch('http://localhost:3001/api/v1/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    logger.info('Response status:', response.status);
    logger.info('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    logger.info('Response text:', responseText);
    
    if (response.ok) {
      logger.info('✅ Server is healthy and responding');
      return true;
    } else {
      logger.error('❌ Server health check failed');
      return false;
    }
    
  } catch (error) {
    logger.error('💥 Health check failed with exception:', error);
    
    // Try to test if the server is running at all
    try {
      logger.info('🔍 Testing basic connectivity...');
      const basicResponse = await fetch('http://localhost:3001/', {
        method: 'GET',
      });
      logger.info('Basic response status:', basicResponse.status);
      const basicText = await basicResponse.text();
      logger.info('Basic response text:', basicText);
    } catch (basicError) {
      logger.error('💥 Basic connectivity failed:', basicError);
    }
    
    return false;
  }
}

// Execute the test
testServerHealth()
  .then((success) => {
    if (success) {
      logger.info('🎉 SERVER HEALTH TEST PASSED');
      logger.info('✅ Backend server is accessible');
    } else {
      logger.error('❌ SERVER HEALTH TEST FAILED');
      logger.error('💡 Check if the backend server is running on port 3001');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testServerHealth };