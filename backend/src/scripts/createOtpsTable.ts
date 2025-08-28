import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

/**
 * Create the otps table if it doesn't exist
 */
async function createOtpsTable() {
  try {
    logger.info('🚀 Creating otps table...');

    // Try to query both possible table names
    let tableExists = false;
    let tableName = '';
    
    // Check for 'otps' table
    const { data: otpsData, error: otpsError } = await supabaseAdmin
      .from('otps')
      .select('id')
      .limit(1);

    if (!otpsError) {
      logger.info('✅ otps table already exists');
      return true;
    }

    // Check for 'otp_codes' table
    const { data: otpCodesData, error: otpCodesError } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .limit(1);

    if (!otpCodesError) {
      logger.info('✅ otp_codes table exists, but code expects otps table');
      logger.info('Need to update code to use otp_codes or create otps table');
      return false;
    }

    logger.info('Neither otps nor otp_codes table exists, attempting to create otps...');

    // Create the table using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        -- OTP details
        type VARCHAR(50) NOT NULL,
        code_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        
        -- Contact info
        email VARCHAR(255),
        phone_number VARCHAR(20),
        
        -- Expiry and attempts
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        
        -- Usage tracking
        verified_at TIMESTAMP WITH TIME ZONE,
        used_at TIMESTAMP WITH TIME ZONE,
        
        -- Metadata
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Try to execute using RPC
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      logger.error('Failed to create otps table via RPC:', error);
      
      // Try alternative approach - create a dummy record to force table creation
      logger.info('Trying alternative approach...');
      
      // This will fail but might give us more info
      const { error: insertError } = await supabaseAdmin
        .from('otps')
        .insert({
          type: 'test',
          code_hash: 'test',
          email: 'test@test.com',
          expires_at: new Date().toISOString()
        });
        
      logger.error('Insert test error:', insertError);
      return false;
    }

    logger.info('✅ otps table created successfully');
    return true;

  } catch (error) {
    logger.error('💥 Failed to create otps table:', error);
    return false;
  }
}

// Run the script
createOtpsTable().then((success) => {
  if (success) {
    logger.info('🎉 Script completed successfully');
    process.exit(0);
  } else {
    logger.error('❌ Script failed');
    process.exit(1);
  }
});