import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';

async function createOtpCodesTable() {
  try {
    logger.info('Creating otp_codes table...');
    
    // First check if table exists by trying to query it
    const { data: existingData, error: queryError } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .limit(1);
    
    if (!queryError) {
      logger.info('Table otp_codes already exists');
      return;
    }
    
    logger.info('Table otp_codes does not exist, creating it...');
    
    // Create the table using direct SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS otp_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        
        -- OTP details
        type VARCHAR(20) NOT NULL,
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
    `;
    
    // Try to execute SQL directly using the SQL query method
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: createTableSQL
    });
    
    if (error) {
      logger.error('Failed to create table via RPC:', error);
      
      // Try alternative approach - insert a test record to trigger table creation
      logger.info('Trying alternative approach...');
      const { error: insertError } = await supabaseAdmin
        .from('otp_codes')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          type: 'test',
          code: '000000',
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      
      if (insertError) {
        logger.error('Alternative approach also failed:', insertError);
        throw new Error('Could not create otp_codes table');
      } else {
        logger.info('Table created successfully via insert');
        // Clean up test record
        await supabaseAdmin
          .from('otp_codes')
          .delete()
          .eq('type', 'test');
      }
    } else {
      logger.info('Table created successfully via RPC');
    }
    
    // Verify table exists
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      logger.error('Table verification failed:', verifyError);
    } else {
      logger.info('Table otp_codes verified successfully');
    }
    
  } catch (error) {
    logger.error('Error creating otp_codes table:', error);
    throw error;
  }
}

// Execute the function directly
createOtpCodesTable()
  .then(() => {
    logger.info('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Script failed:', error);
    process.exit(1);
  });

export { createOtpCodesTable };