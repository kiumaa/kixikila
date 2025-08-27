import { supabase, supabaseAdmin, testConnection } from '../services/supabase.ts';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';
import axios from 'axios';

/**
 * Health check for all external services
 */
async function healthCheck() {
  logger.info('🏥 Starting health check...');
  
  const results = {
    supabase: false,
    supabaseAdmin: false,
    stripe: false,
    bulkSms: false,
    email: false,
    overall: false
  };

  // Test Supabase connection
  try {
    logger.info('🔍 Testing Supabase connection...');
    const connectionTest = await testConnection();
    results.supabase = connectionTest;
    
    if (connectionTest) {
      logger.info('✅ Supabase connection successful');
    } else {
      logger.error('❌ Supabase connection failed');
    }
  } catch (error) {
    logger.error('❌ Supabase connection error:', error);
    results.supabase = false;
  }

  // Test Supabase Admin connection
  try {
    logger.info('🔍 Testing Supabase Admin connection...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
    
    if (!error) {
      results.supabaseAdmin = true;
      logger.info('✅ Supabase Admin connection successful');
    } else {
      logger.error('❌ Supabase Admin connection failed:', error);
      results.supabaseAdmin = false;
    }
  } catch (error) {
    logger.error('❌ Supabase Admin connection error:', error);
    results.supabaseAdmin = false;
  }

  // Test Stripe connection
  try {
    logger.info('🔍 Testing Stripe connection...');
    
    if (!config.stripe.secretKey) {
      logger.warn('⚠️  Stripe secret key not configured');
      results.stripe = false;
    } else {
      // Simple test to verify Stripe key format
      const isValidKey = config.stripe.secretKey.startsWith('sk_');
      if (isValidKey) {
        results.stripe = true;
        logger.info('✅ Stripe configuration valid');
      } else {
        logger.error('❌ Invalid Stripe secret key format');
        results.stripe = false;
      }
    }
  } catch (error) {
    logger.error('❌ Stripe configuration error:', error);
    results.stripe = false;
  }

  // Test BulkSMS connection
  try {
    logger.info('🔍 Testing BulkSMS connection...');
    
    if (!config.bulkSms.username || !config.bulkSms.password) {
      logger.warn('⚠️  BulkSMS credentials not configured');
      results.bulkSms = false;
    } else {
      // Test BulkSMS API endpoint
      const response = await axios.get('https://api.bulksms.com/v1/profile', {
        auth: {
          username: config.bulkSms.username,
          password: config.bulkSms.password
        },
        timeout: 5000
      });
      
      if (response.status === 200) {
        results.bulkSms = true;
        logger.info('✅ BulkSMS connection successful');
      } else {
        logger.error('❌ BulkSMS connection failed');
        results.bulkSms = false;
      }
    }
  } catch (error) {
    logger.error('❌ BulkSMS connection error:', error.message);
    results.bulkSms = false;
  }

  // Test Email configuration
  try {
    logger.info('🔍 Testing Email configuration...');
    
    if (!config.email.host || !config.email.user || !config.email.password) {
      logger.warn('⚠️  Email configuration incomplete');
      results.email = false;
    } else {
      // Basic validation of email configuration
      const hasValidConfig = 
        config.email.host.length > 0 &&
        config.email.user.includes('@') &&
        config.email.password.length > 0 &&
        !config.email.user.includes('your-email') &&
        !config.email.password.includes('your-app-password');
      
      if (hasValidConfig) {
        results.email = true;
        logger.info('✅ Email configuration valid');
      } else {
        logger.warn('⚠️  Email configuration contains placeholder values');
        results.email = false;
      }
    }
  } catch (error) {
    logger.error('❌ Email configuration error:', error);
    results.email = false;
  }

  // Calculate overall health
  const criticalServices = [results.supabase, results.supabaseAdmin];
  const optionalServices = [results.stripe, results.bulkSms, results.email];
  
  const allCriticalHealthy = criticalServices.every(service => service === true);
  const someOptionalHealthy = optionalServices.some(service => service === true);
  
  results.overall = allCriticalHealthy && someOptionalHealthy;

  // Summary
  logger.info('📊 Health Check Summary:');
  logger.info(`   Supabase: ${results.supabase ? '✅' : '❌'}`);
  logger.info(`   Supabase Admin: ${results.supabaseAdmin ? '✅' : '❌'}`);
  logger.info(`   Stripe: ${results.stripe ? '✅' : '❌'}`);
  logger.info(`   BulkSMS: ${results.bulkSms ? '✅' : '❌'}`);
  logger.info(`   Email: ${results.email ? '✅' : '❌'}`);
  logger.info(`   Overall: ${results.overall ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);

  if (results.overall) {
    logger.info('🎉 All critical services are operational!');
  } else {
    logger.error('💥 Some critical services are not operational!');
  }

  return results;
}

/**
 * Test database connectivity and basic operations
 */
async function testDatabaseOperations() {
  logger.info('🗄️  Testing database operations...');
  
  try {
    // Test user table structure
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (userError && !userError.message.includes('no rows')) {
      logger.error('❌ Failed to query users table:', userError);
      return false;
    }
    
    logger.info('✅ Users table structure verified');
    
    // Test groups table structure
    const { data: groupData, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id, name, type')
      .limit(1);
    
    if (groupError && !groupError.message.includes('no rows')) {
      logger.error('❌ Failed to query groups table:', groupError);
      return false;
    }
    
    logger.info('✅ Groups table structure verified');
    
    logger.info('✅ All database operations successful');
    return true;
    
  } catch (error) {
    logger.error('❌ Database operations test failed:', error);
    return false;
  }
}

/**
 * Test environment configuration
 */
function testEnvironmentConfig() {
  logger.info('⚙️  Testing environment configuration...');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  logger.info('✅ All required environment variables are set');
  
  // Check optional but recommended variables
  const optionalVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLIC_KEY',
    'BULKSMS_USERNAME',
    'BULKSMS_PASSWORD',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];
  
  const missingOptional = optionalVars.filter(varName => !process.env[varName]);
  
  if (missingOptional.length > 0) {
    logger.warn(`⚠️  Missing optional environment variables: ${missingOptional.join(', ')}`);
  }
  
  return true;
}

/**
 * Main health check function
 */
async function main() {
  try {
    logger.info('🚀 KIXIKILA Backend Health Check');
    logger.info('================================');
    
    // Test environment configuration
    const envOk = testEnvironmentConfig();
    
    if (!envOk) {
      logger.error('💥 Environment configuration failed');
      process.exit(1);
    }
    
    // Test external services
    const healthResults = await healthCheck();
    
    // Test database operations
    const dbOk = await testDatabaseOperations();
    
    // Final assessment
    const overallHealthy = healthResults.overall && dbOk;
    
    logger.info('================================');
    if (overallHealthy) {
      logger.info('🎉 Backend is healthy and ready!');
      process.exit(0);
    } else {
      logger.error('💥 Backend health check failed!');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('💥 Health check crashed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  healthCheck,
  testDatabaseOperations,
  testEnvironmentConfig
};