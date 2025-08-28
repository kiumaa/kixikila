import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

async function testBasicRegistration() {
  try {
    logger.info('🧪 Testing basic user registration without OTP...');
    
    // Test data
    const testUser = {
      email: 'test-basic@example.com',
      password: 'TestPassword123!',
      full_name: 'Test User Basic',
      phone: '+244900000001'
    };
    
    logger.info('🔐 Using plain password for Supabase Auth');
    
    // Try to insert user directly into auth.users (Supabase Auth)
    logger.info('👤 Attempting to create user via Supabase Auth...');
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Skip email verification for testing
      user_metadata: {
        full_name: testUser.full_name,
        phone: testUser.phone
      }
    });
    
    if (authError) {
      logger.error('❌ Auth user creation failed:', authError.message);
      return false;
    }
    
    logger.info('✅ Auth user created successfully:', authData.user.id);
    
    // Now try to create user profile in public.users table
    logger.info('📝 Attempting to create user profile...');
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        phone: testUser.phone,
        email_verified: true,
        phone_verified: false,
        is_active: true,
        role: 'user'
      })
      .select()
      .single();
    
    if (profileError) {
      logger.error('❌ Profile creation failed:', profileError.message);
      
      // Clean up auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      logger.info('🧹 Cleaned up auth user');
      
      return false;
    }
    
    logger.info('✅ User profile created successfully:', profileData.id);
    
    // Test login
    logger.info('🔑 Testing login...');
    
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginError) {
      logger.error('❌ Login failed:', loginError.message);
      return false;
    }
    
    logger.info('✅ Login successful:', loginData.user.id);
    
    // Clean up test user
    logger.info('🧹 Cleaning up test user...');
    
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    logger.info('✅ Test user cleaned up');
    
    return true;
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  }
}

// Execute the test
testBasicRegistration()
  .then((success) => {
    if (success) {
      logger.info('🎉 Basic registration test PASSED');
      logger.info('✅ Supabase Auth is working correctly');
      logger.info('⚠️  You still need to create the database tables manually');
    } else {
      logger.error('❌ Basic registration test FAILED');
      logger.error('💡 Check your Supabase configuration and database setup');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testBasicRegistration };