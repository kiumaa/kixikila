import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

async function testOtpTable() {
  let testUserId: string | null = null;
  
  try {
    logger.info('🔍 Testing otp_codes table...');
    
    // Test if table exists and is accessible
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .limit(1);
    
    if (tableError) {
      logger.error('❌ Table access failed:', tableError.message);
      return false;
    }
    
    logger.info('✅ otp_codes table exists and is accessible');
    
    // Create a test user first
    logger.info('👤 Creating test user...');
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `test-otp-${Date.now()}@example.com`,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (authError || !authUser.user) {
      logger.error('❌ Test user creation failed:', authError?.message);
      return false;
    }
    
    testUserId = authUser.user.id;
    logger.info('✅ Test user created:', testUserId);
    
    // Test inserting a sample OTP
    logger.info('🧪 Testing OTP insertion...');
    
    const testOtp = {
      user_id: testUserId,
      type: 'email_verification',
      code: '123456',
      status: 'pending',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      attempts: 0,
      max_attempts: 3
    };
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert(testOtp)
      .select()
      .single();
    
    if (insertError) {
      logger.error('❌ OTP insertion failed:', insertError.message);
      logger.error('Error details:', insertError);
      return false;
    }
    
    logger.info('✅ OTP inserted successfully:', insertData.id);
    
    // Test querying the OTP
    logger.info('🔍 Testing OTP query...');
    
    const { data: queryData, error: queryError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('id', insertData.id)
      .single();
    
    if (queryError) {
      logger.error('❌ OTP query failed:', queryError.message);
      return false;
    }
    
    logger.info('✅ OTP queried successfully:', queryData.code);
    
    // Test updating the OTP
    logger.info('🔄 Testing OTP update...');
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('otp_codes')
      .update({ 
        status: 'verified',
        verified_at: new Date().toISOString(),
        attempts: 1
      })
      .eq('id', insertData.id)
      .select()
      .single();
    
    if (updateError) {
      logger.error('❌ OTP update failed:', updateError.message);
      return false;
    }
    
    logger.info('✅ OTP updated successfully:', updateData.status);
    
    // Clean up test data
    logger.info('🧹 Cleaning up test data...');
    
    const { error: deleteError } = await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('id', insertData.id);
    
    if (deleteError) {
      logger.warn('⚠️ OTP cleanup failed:', deleteError.message);
    } else {
      logger.info('✅ OTP test data cleaned up');
    }
    
    return true;
    
  } catch (error) {
    logger.error('💥 Test failed with exception:', error);
    return false;
  } finally {
    // Clean up test user
    if (testUserId) {
      logger.info('🧹 Cleaning up test user...');
      try {
        const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
        if (userDeleteError) {
          logger.warn('⚠️ Test user cleanup failed:', userDeleteError.message);
        } else {
          logger.info('✅ Test user cleaned up');
        }
      } catch (cleanupError) {
        logger.warn('⚠️ User cleanup exception:', cleanupError);
      }
    }
  }
}

// Execute the test
testOtpTable()
  .then((success) => {
    if (success) {
      logger.info('🎉 OTP table test PASSED');
      logger.info('✅ The otp_codes table is working correctly');
      logger.info('🚀 You can now test user registration with OTP');
    } else {
      logger.error('❌ OTP table test FAILED');
      logger.error('💡 Check the error messages above');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    logger.error('💥 Test execution failed:', error);
    process.exit(1);
  });

export { testOtpTable };