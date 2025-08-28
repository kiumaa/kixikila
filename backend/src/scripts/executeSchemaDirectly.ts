import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeSchemaDirectly() {
  try {
    logger.info('🚀 Executing schema directly...');
    
    // Read the create-supabase-schema.sql file
    const schemaPath = path.join(__dirname, '../../../scripts/create-supabase-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    logger.info(`📝 Found ${statements.length} SQL statements`);
    
    // Try to execute each statement using direct SQL query
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        logger.info(`⚡ Executing statement ${i + 1}/${statements.length}`);
        
        // Use the sql method to execute raw SQL
        const { data, error } = await supabaseAdmin
          .rpc('sql', { query: statement });
        
        if (error) {
          logger.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with next statement
        } else {
          logger.info(`✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (statementError) {
        logger.error(`💥 Exception in statement ${i + 1}:`, statementError);
        // Continue with next statement
      }
    }
    
    // Test if otp_codes table was created
    logger.info('🔍 Testing if otp_codes table exists...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .limit(1);
    
    if (testError) {
      logger.error('❌ otp_codes table test failed:', testError.message);
    } else {
      logger.info('✅ otp_codes table exists and is accessible');
    }
    
  } catch (error) {
    logger.error('💥 Fatal error:', error);
    throw error;
  }
}

// Execute the function directly
executeSchemaDirectly()
  .then(() => {
    logger.info('🎉 Schema execution completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 Schema execution failed:', error);
    process.exit(1);
  });

export { executeSchemaDirectly };