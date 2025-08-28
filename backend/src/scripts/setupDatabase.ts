import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup database schema and initial data
 */
async function setupDatabase() {
  try {
    logger.info('🚀 Starting database setup...');

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    logger.info(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        logger.info(`⚡ Executing statement ${i + 1}/${statements.length}`);
        
        const { error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Some errors are expected (like "already exists" errors)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            logger.warn(`⚠️  Statement ${i + 1}: ${error.message}`);
          } else {
            logger.error(`❌ Error in statement ${i + 1}:`, error);
            throw error;
          }
        } else {
          logger.info(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        logger.error(`❌ Failed to execute statement ${i + 1}:`, {
          statement: statement.substring(0, 100) + '...',
          error: statementError
        });
        
        // Continue with next statement for non-critical errors
        if (!statementError.message.includes('already exists')) {
          throw statementError;
        }
      }
    }

    // Verify tables were created
    await verifyTables();

    // Setup initial system configuration
    await setupInitialConfig();

    logger.info('🎉 Database setup completed successfully!');
    return true;

  } catch (error) {
    logger.error('💥 Database setup failed:', error);
    return false;
  }
}

/**
 * Verify that all required tables exist
 */
async function verifyTables() {
  const requiredTables = [
    'users',
    'groups', 
    'group_members',
    'transactions',
    'notifications',
    'otps',
    'system_config',
    'audit_logs',
    'refresh_tokens'
  ];

  logger.info('🔍 Verifying tables exist...');

  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        logger.error(`❌ Table '${tableName}' verification failed:`, error);
        throw new Error(`Table '${tableName}' does not exist or is not accessible`);
      }

      logger.info(`✅ Table '${tableName}' verified`);
    } catch (error) {
      logger.error(`❌ Failed to verify table '${tableName}':`, error);
      throw error;
    }
  }

  logger.info('✅ All required tables verified successfully');
}

/**
 * Setup initial system configuration
 */
async function setupInitialConfig() {
  logger.info('⚙️  Setting up initial system configuration...');

  const initialConfigs = [
    {
      key: 'stripe_public_key',
      value: JSON.stringify(process.env.STRIPE_PUBLIC_KEY || ''),
      description: 'Stripe public key for frontend',
      is_public: true
    },
    {
      key: 'supabase_url',
      value: JSON.stringify(process.env.SUPABASE_URL || ''),
      description: 'Supabase URL for frontend',
      is_public: true
    },
    {
      key: 'supabase_anon_key',
      value: JSON.stringify(process.env.SUPABASE_ANON_KEY || ''),
      description: 'Supabase anonymous key for frontend',
      is_public: true
    },
    {
      key: 'app_environment',
      value: JSON.stringify(process.env.NODE_ENV || 'development'),
      description: 'Application environment',
      is_public: true
    },
    {
      key: 'features_enabled',
      value: JSON.stringify({
        vip_subscriptions: true,
        sms_notifications: true,
        email_notifications: true,
        group_invitations: true,
        automatic_contributions: true,
        goal_tracking: true,
        transaction_history: true,
        audit_logging: true
      }),
      description: 'Enabled application features',
      is_public: true
    },
    {
      key: 'rate_limits',
      value: JSON.stringify({
        api_requests_per_minute: 100,
        login_attempts_per_hour: 5,
        otp_requests_per_hour: 10,
        password_reset_per_day: 3,
        group_creation_per_day: 5
      }),
      description: 'Rate limiting configuration',
      is_public: false
    },
    {
      key: 'notification_settings',
      value: JSON.stringify({
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        batch_processing: true,
        retry_attempts: 3,
        retry_delay_minutes: 5
      }),
      description: 'Notification system settings',
      is_public: false
    }
  ];

  for (const config of initialConfigs) {
    try {
      // Check if config already exists
      const { data: existing } = await supabaseAdmin
        .from('system_config')
        .select('id')
        .eq('key', config.key)
        .single();

      if (existing) {
        logger.info(`⚠️  Config '${config.key}' already exists, skipping`);
        continue;
      }

      // Insert new config
      const { error } = await supabaseAdmin
        .from('system_config')
        .insert(config);

      if (error) {
        logger.error(`❌ Failed to insert config '${config.key}':`, error);
      } else {
        logger.info(`✅ Config '${config.key}' inserted successfully`);
      }
    } catch (error) {
      logger.warn(`⚠️  Config '${config.key}' setup warning:`, error.message);
    }
  }

  logger.info('✅ Initial system configuration completed');
}

/**
 * Create admin user if it doesn't exist
 */
async function createAdminUser() {
  logger.info('👤 Setting up admin user...');

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'KIXIKILA Admin';

  if (!adminEmail || !adminPassword) {
    logger.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
    throw new Error('Admin credentials not configured. Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  }

  if (adminPassword.length < 12) {
    logger.error('❌ ADMIN_PASSWORD must be at least 12 characters long');
    throw new Error('Admin password must be at least 12 characters long for security.');
  }

  try {
    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      logger.info('⚠️  Admin user already exists, skipping creation');
      return;
    }

    // Create admin user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: 'admin'
      }
    });

    if (authError) {
      logger.error('❌ Failed to create admin auth user:', authError);
      throw authError;
    }

    // Create admin user record in users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: adminEmail,
        full_name: adminName,
        role: 'admin',
        status: 'active',
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        password_hash: 'managed_by_supabase_auth'
      });

    if (userError) {
      logger.error('❌ Failed to create admin user record:', userError);
      throw userError;
    }

    logger.info('✅ Admin user created successfully');
    logger.info(`📧 Admin email: ${adminEmail}`);
    logger.info(`🔑 Admin password: ${adminPassword}`);
    logger.warn('⚠️  Please change the admin password after first login!');

  } catch (error) {
    logger.error('💥 Failed to create admin user:', error);
    throw error;
  }
}

/**
 * Drop all tables (for development/testing)
 */
async function dropAllTables() {
  logger.warn('🗑️  Dropping all tables...');

  const tables = [
    'refresh_tokens',
    'audit_logs', 
    'system_config',
    'otps',
    'notifications',
    'transactions',
    'group_members',
    'groups',
    'users'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `DROP TABLE IF EXISTS ${table} CASCADE`
      });

      if (error) {
        logger.error(`❌ Failed to drop table '${table}':`, error);
      } else {
        logger.info(`✅ Table '${table}' dropped`);
      }
    } catch (error) {
      logger.warn(`⚠️  Warning dropping table '${table}':`, error.message);
    }
  }

  // Drop custom types
  const types = [
    'user_role', 'user_status', 'subscription_status', 'group_status',
    'group_type', 'member_role', 'member_status', 'transaction_type',
    'transaction_status', 'payment_method', 'notification_type',
    'notification_status', 'notification_channel', 'otp_type', 'otp_status'
  ];

  for (const type of types) {
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: `DROP TYPE IF EXISTS ${type} CASCADE`
      });

      if (error) {
        logger.error(`❌ Failed to drop type '${type}':`, error);
      } else {
        logger.info(`✅ Type '${type}' dropped`);
      }
    } catch (error) {
      logger.warn(`⚠️  Warning dropping type '${type}':`, error.message);
    }
  }

  logger.info('✅ All tables and types dropped');
}

/**
 * Main setup function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'setup':
        await setupDatabase();
        await createAdminUser();
        break;
        
      case 'reset':
        await dropAllTables();
        await setupDatabase();
        await createAdminUser();
        break;
        
      case 'verify':
        await verifyTables();
        break;
        
      case 'config':
        await setupInitialConfig();
        break;
        
      case 'admin':
        await createAdminUser();
        break;
        
      case 'drop':
        await dropAllTables();
        break;
        
      default:
        logger.info('📖 Available commands:');
        logger.info('  setup  - Setup database schema and create admin user');
        logger.info('  reset  - Drop all tables and recreate everything');
        logger.info('  verify - Verify all tables exist');
        logger.info('  config - Setup initial system configuration');
        logger.info('  admin  - Create admin user');
        logger.info('  drop   - Drop all tables (destructive!)');
        break;
    }
  } catch (error) {
    logger.error('💥 Setup script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  setupDatabase,
  verifyTables,
  setupInitialConfig,
  createAdminUser,
  dropAllTables
};