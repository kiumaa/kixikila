import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

async function createTableManually() {
  try {
    logger.info('🚀 Creating table manually using Supabase operations...');
    
    // Since we can't execute DDL via RPC, let's try to create the table
    // by using the Supabase REST API directly
    
    // First, let's check what tables exist
    logger.info('🔍 Checking existing tables...');
    
    // Try to query some known tables to see what exists
    const tables = ['users', 'groups', 'transactions', 'notifications', 'otp_codes', 'otps'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          logger.info(`✅ Table '${table}' exists`);
        } else {
          logger.info(`❌ Table '${table}' does not exist: ${error.message}`);
        }
      } catch (e) {
        logger.info(`❌ Table '${table}' check failed: ${e}`);
      }
    }
    
    // Since we can't create tables via the client, let's provide instructions
    logger.info('\n📋 MANUAL SETUP REQUIRED:');
    logger.info('Since we cannot execute DDL statements via the Supabase client,');
    logger.info('you need to manually execute the SQL in the Supabase dashboard.');
    logger.info('\n🔗 Steps:');
    logger.info('1. Go to https://supabase.com/dashboard');
    logger.info('2. Select your project');
    logger.info('3. Go to SQL Editor');
    logger.info('4. Create a new query');
    logger.info('5. Copy and paste the following SQL:');
    
    const createOtpCodesSQL = `
-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- OTP details
    type VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage tracking
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own OTP codes" ON otp_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OTP codes" ON otp_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own OTP codes" ON otp_codes
    FOR UPDATE USING (user_id = auth.uid());
`;
    
    logger.info('\n' + '='.repeat(80));
    logger.info(createOtpCodesSQL);
    logger.info('='.repeat(80));
    
    logger.info('\n6. Click "Run" to execute the SQL');
    logger.info('7. Verify the table was created successfully');
    
    // Also save the SQL to a file for easy access
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const sqlFilePath = path.join(__dirname, '../../../manual-otp-codes-setup.sql');
    
    fs.writeFileSync(sqlFilePath, createOtpCodesSQL);
    logger.info(`\n💾 SQL saved to: ${sqlFilePath}`);
    
  } catch (error) {
    logger.error('💥 Error:', error);
    throw error;
  }
}

// Execute the function directly
createTableManually()
  .then(() => {
    logger.info('\n🎉 Manual setup instructions provided');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Failed:', error);
    process.exit(1);
  });

export { createTableManually };