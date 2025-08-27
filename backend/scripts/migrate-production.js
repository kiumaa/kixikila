#!/usr/bin/env node

/**
 * KIXIKILA Production Database Migration Script
 * 
 * This script helps migrate the database schema to Supabase production.
 * It includes schema validation, data migration, and RLS setup.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🗄️ ${msg}${colors.reset}\n`)
};

class ProductionMigrator {
  constructor() {
    this.rootDir = path.join(__dirname, '..');
    this.schemaFile = path.join(this.rootDir, 'database', 'schema.sql');
    this.supabase = null;
  }

  /**
   * Initialize Supabase client
   */
  async initializeSupabase() {
    log.title('Initializing Supabase Connection');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      log.error('Missing Supabase credentials!');
      log.info('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
      return false;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Test connection
      const { data, error } = await this.supabase.from('users').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
        log.error(`Supabase connection failed: ${error.message}`);
        return false;
      }
      
      log.success('Supabase connection established');
      return true;
    } catch (error) {
      log.error(`Failed to connect to Supabase: ${error.message}`);
      return false;
    }
  }

  /**
   * Read and validate schema file
   */
  readSchemaFile() {
    log.title('Reading Database Schema');
    
    if (!fs.existsSync(this.schemaFile)) {
      log.error('Schema file not found!');
      log.info(`Expected location: ${this.schemaFile}`);
      return null;
    }

    try {
      const schema = fs.readFileSync(this.schemaFile, 'utf8');
      log.success(`Schema file loaded (${schema.length} characters)`);
      return schema;
    } catch (error) {
      log.error(`Failed to read schema file: ${error.message}`);
      return null;
    }
  }

  /**
   * Execute SQL schema
   */
  async executeSchema(schema) {
    log.title('Executing Database Schema');
    
    try {
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      log.info(`Found ${statements.length} SQL statements to execute`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.length < 10) continue; // Skip very short statements
        
        try {
          const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like "relation already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist')) {
              log.warning(`Statement ${i + 1}: ${error.message}`);
            } else {
              log.error(`Statement ${i + 1}: ${error.message}`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          log.error(`Statement ${i + 1}: ${err.message}`);
          errorCount++;
        }
      }

      log.success(`Schema execution completed: ${successCount} successful, ${errorCount} errors`);
      return errorCount === 0;
    } catch (error) {
      log.error(`Schema execution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify database structure
   */
  async verifyDatabase() {
    log.title('Verifying Database Structure');
    
    const expectedTables = [
      'users',
      'financial_groups',
      'group_members',
      'transactions',
      'notifications',
      'user_preferences',
      'system_config',
      'audit_logs'
    ];

    let allTablesExist = true;

    for (const table of expectedTables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          log.error(`Table '${table}' verification failed: ${error.message}`);
          allTablesExist = false;
        } else {
          log.success(`Table '${table}' exists and accessible`);
        }
      } catch (err) {
        log.error(`Table '${table}' verification error: ${err.message}`);
        allTablesExist = false;
      }
    }

    return allTablesExist;
  }

  /**
   * Setup Row Level Security (RLS)
   */
  async setupRLS() {
    log.title('Setting up Row Level Security');
    
    const rlsPolicies = [
      {
        table: 'users',
        policy: 'Users can only access their own data',
        sql: `
          CREATE POLICY "Users can access own data" ON users
          FOR ALL USING (auth.uid() = id);
        `
      },
      {
        table: 'financial_groups',
        policy: 'Users can access groups they belong to',
        sql: `
          CREATE POLICY "Users can access own groups" ON financial_groups
          FOR ALL USING (
            id IN (
              SELECT group_id FROM group_members 
              WHERE user_id = auth.uid()
            )
          );
        `
      },
      {
        table: 'notifications',
        policy: 'Users can access their own notifications',
        sql: `
          CREATE POLICY "Users can access own notifications" ON notifications
          FOR ALL USING (user_id = auth.uid());
        `
      }
    ];

    let successCount = 0;

    for (const policy of rlsPolicies) {
      try {
        // Enable RLS on table
        await this.supabase.rpc('exec_sql', {
          sql: `ALTER TABLE ${policy.table} ENABLE ROW LEVEL SECURITY;`
        });
        
        // Create policy
        const { error } = await this.supabase.rpc('exec_sql', {
          sql: policy.sql
        });
        
        if (error && !error.message.includes('already exists')) {
          log.error(`RLS policy for '${policy.table}': ${error.message}`);
        } else {
          log.success(`RLS enabled for '${policy.table}'`);
          successCount++;
        }
      } catch (err) {
        log.error(`RLS setup for '${policy.table}': ${err.message}`);
      }
    }

    log.success(`RLS setup completed: ${successCount}/${rlsPolicies.length} policies`);
    return successCount === rlsPolicies.length;
  }

  /**
   * Create initial admin user
   */
  async createAdminUser() {
    log.title('Creating Initial Admin User');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kixikila.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      log.warning('No admin password provided. Skipping admin user creation.');
      log.info('Set ADMIN_PASSWORD environment variable to create admin user.');
      return true;
    }

    try {
      // Check if admin user already exists
      const { data: existingUser } = await this.supabase.auth.admin.getUserByEmail(adminEmail);
      
      if (existingUser) {
        log.warning('Admin user already exists');
        return true;
      }

      // Create admin user
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin',
          name: 'Administrator',
          created_by: 'migration_script'
        }
      });

      if (error) {
        log.error(`Failed to create admin user: ${error.message}`);
        return false;
      }

      log.success(`Admin user created: ${adminEmail}`);
      return true;
    } catch (error) {
      log.error(`Admin user creation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate migration report
   */
  generateReport(results) {
    log.title('Migration Report');
    
    const report = [
      '📊 KIXIKILA Production Database Migration Report',
      '=' .repeat(50),
      '',
      `✅ Supabase Connection: ${results.connection ? 'SUCCESS' : 'FAILED'}`,
      `✅ Schema Execution: ${results.schema ? 'SUCCESS' : 'FAILED'}`,
      `✅ Database Verification: ${results.verification ? 'SUCCESS' : 'FAILED'}`,
      `✅ RLS Setup: ${results.rls ? 'SUCCESS' : 'FAILED'}`,
      `✅ Admin User: ${results.admin ? 'SUCCESS' : 'SKIPPED/FAILED'}`,
      '',
      '📋 Next Steps:',
      '1. Verify all tables exist in Supabase dashboard',
      '2. Test authentication with admin user',
      '3. Configure Stripe webhooks',
      '4. Set up monitoring and alerts',
      '5. Run integration tests',
      '',
      '🔗 Useful Links:',
      '- Supabase Dashboard: https://app.supabase.com',
      '- API Health Check: /api/v1/health',
      '- Admin Panel: /admin',
      ''
    ];

    console.log('\n' + report.join('\n'));
    
    // Save report to file
    const reportFile = path.join(this.rootDir, 'migration-report.txt');
    fs.writeFileSync(reportFile, report.join('\n'));
    log.info(`Report saved to: ${reportFile}`);
  }

  /**
   * Main migration process
   */
  async migrate() {
    log.title('KIXIKILA Production Database Migration');
    
    const results = {
      connection: false,
      schema: false,
      verification: false,
      rls: false,
      admin: false
    };

    // Initialize Supabase
    results.connection = await this.initializeSupabase();
    if (!results.connection) {
      this.generateReport(results);
      process.exit(1);
    }

    // Read schema
    const schema = this.readSchemaFile();
    if (!schema) {
      this.generateReport(results);
      process.exit(1);
    }

    // Execute schema
    results.schema = await this.executeSchema(schema);
    
    // Verify database
    results.verification = await this.verifyDatabase();
    
    // Setup RLS
    results.rls = await this.setupRLS();
    
    // Create admin user
    results.admin = await this.createAdminUser();

    // Generate report
    this.generateReport(results);

    const success = results.connection && results.schema && results.verification;
    
    if (success) {
      log.success('🎉 Database migration completed successfully!');
      process.exit(0);
    } else {
      log.error('❌ Database migration completed with errors.');
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const migrator = new ProductionMigrator();

  switch (command) {
    case 'verify':
      await migrator.initializeSupabase() && await migrator.verifyDatabase();
      break;
    case 'rls':
      await migrator.initializeSupabase() && await migrator.setupRLS();
      break;
    case 'admin':
      await migrator.initializeSupabase() && await migrator.createAdminUser();
      break;
    default:
      await migrator.migrate();
  }
}

export default ProductionMigrator;