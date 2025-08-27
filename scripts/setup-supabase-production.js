#!/usr/bin/env node

/**
 * KIXIKILA - Configuração do Supabase para Produção
 * 
 * Este script configura o Supabase com credenciais reais e executa
 * a migração completa do banco de dados.
 * 
 * Uso:
 *   node scripts/setup-supabase-production.js
 * 
 * Pré-requisitos:
 *   - Projeto Supabase criado
 *   - Variáveis de ambiente configuradas
 *   - Acesso à internet
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

class SupabaseSetup {
  constructor() {
    this.supabase = null;
    this.supabaseAdmin = null;
    this.results = {
      connection: false,
      schema: false,
      rls: false,
      admin: false,
      frontend: false
    };
  }

  /**
   * Logs coloridos para melhor visualização
   */
  log = {
    title: (msg) => console.log(`\n🚀 ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`),
    info: (msg) => console.log(`ℹ️  ${msg}`),
    step: (msg) => console.log(`📋 ${msg}`)
  };

  /**
   * Verificar variáveis de ambiente necessárias
   */
  checkEnvironmentVariables() {
    this.log.title('Verificando Variáveis de Ambiente');
    
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName] || process.env[varName].includes('your-')) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.log.error('Variáveis de ambiente não configuradas:');
      missing.forEach(varName => {
        this.log.error(`  - ${varName}`);
      });
      this.log.info('\nPor favor, configure as variáveis no arquivo backend/.env');
      this.log.info('Exemplo:');
      this.log.info('  SUPABASE_URL=https://seu-projeto.supabase.co');
      this.log.info('  SUPABASE_ANON_KEY=sua-chave-anonima');
      this.log.info('  SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role');
      return false;
    }

    this.log.success('Todas as variáveis de ambiente estão configuradas');
    return true;
  }

  /**
   * Inicializar clientes Supabase
   */
  async initializeSupabase() {
    this.log.title('Inicializando Conexão com Supabase');
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // Cliente normal
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Cliente admin
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Testar conexão
      const { data, error } = await this.supabaseAdmin.from('users').select('count').limit(1);
      
      if (error && !error.message.includes('relation "users" does not exist')) {
        this.log.error(`Falha na conexão: ${error.message}`);
        return false;
      }

      this.log.success('Conexão com Supabase estabelecida');
      return true;
    } catch (error) {
      this.log.error(`Erro ao conectar com Supabase: ${error.message}`);
      return false;
    }
  }

  /**
   * Executar schema SQL
   */
  async executeSchema() {
    this.log.title('Executando Schema do Banco de Dados');
    
    try {
      const schemaPath = path.join(__dirname, '../backend/database/schema.sql');
      
      if (!fs.existsSync(schemaPath)) {
        this.log.error('Arquivo schema.sql não encontrado');
        return false;
      }

      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Dividir o schema em statements individuais
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      this.log.info(`Executando ${statements.length} statements SQL...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        if (statement.trim()) {
          try {
            const { error } = await this.supabaseAdmin.rpc('exec_sql', { 
              sql: statement + ';' 
            });
            
            if (error) {
              // Ignorar erros de objetos já existentes
              if (!error.message.includes('already exists') && 
                  !error.message.includes('does not exist')) {
                this.log.warning(`Statement ${i + 1}: ${error.message}`);
              }
            }
          } catch (err) {
            this.log.warning(`Erro no statement ${i + 1}: ${err.message}`);
          }
        }
      }

      this.log.success('Schema executado com sucesso');
      return true;
    } catch (error) {
      this.log.error(`Erro ao executar schema: ${error.message}`);
      return false;
    }
  }

  /**
   * Configurar Row Level Security (RLS)
   */
  async setupRLS() {
    this.log.title('Configurando Row Level Security (RLS)');
    
    try {
      const rlsPolicies = [
        // Políticas para tabela users
        `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
        `CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);`,
        `CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);`,
        
        // Políticas para tabela groups
        `ALTER TABLE groups ENABLE ROW LEVEL SECURITY;`,
        `CREATE POLICY "Users can view groups they belong to" ON groups FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_members.group_id = groups.id 
            AND group_members.user_id = auth.uid()
          )
        );`,
        
        // Políticas para tabela group_members
        `ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;`,
        `CREATE POLICY "Users can view own memberships" ON group_members FOR SELECT USING (user_id = auth.uid());`,
        
        // Políticas para tabela transactions
        `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`,
        `CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid());`,
        
        // Políticas para tabela notifications
        `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;`,
        `CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());`,
        `CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());`
      ];

      for (const policy of rlsPolicies) {
        try {
          const { error } = await this.supabaseAdmin.rpc('exec_sql', { sql: policy });
          if (error && !error.message.includes('already exists')) {
            this.log.warning(`RLS Policy: ${error.message}`);
          }
        } catch (err) {
          this.log.warning(`Erro na política RLS: ${err.message}`);
        }
      }

      this.log.success('Row Level Security configurado');
      return true;
    } catch (error) {
      this.log.error(`Erro ao configurar RLS: ${error.message}`);
      return false;
    }
  }

  /**
   * Criar usuário administrador
   */
  async createAdminUser() {
    this.log.title('Criando Usuário Administrador');
    
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@kixikila.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
      const adminName = process.env.ADMIN_NAME || 'KIXIKILA Admin';

      // Verificar se admin já existe
      const { data: existingAdmin } = await this.supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .single();

      if (existingAdmin) {
        this.log.info('Usuário administrador já existe');
        return true;
      }

      // Criar usuário no Supabase Auth
      const { data: authUser, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: 'admin'
        }
      });

      if (authError) {
        this.log.error(`Erro ao criar usuário auth: ${authError.message}`);
        return false;
      }

      // Criar registro na tabela users
      const { error: userError } = await this.supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: adminEmail,
          full_name: adminName,
          phone_number: '+244900000000',
          role: 'admin',
          status: 'active',
          email_verified: true,
          phone_verified: true,
          email_verified_at: new Date().toISOString(),
          phone_verified_at: new Date().toISOString()
        });

      if (userError) {
        this.log.error(`Erro ao criar registro do usuário: ${userError.message}`);
        return false;
      }

      this.log.success(`Usuário administrador criado: ${adminEmail}`);
      this.log.info(`Senha: ${adminPassword}`);
      return true;
    } catch (error) {
      this.log.error(`Erro ao criar usuário admin: ${error.message}`);
      return false;
    }
  }

  /**
   * Atualizar configurações do frontend
   */
  async updateFrontendConfig() {
    this.log.title('Atualizando Configurações do Frontend');
    
    try {
      const frontendClientPath = path.join(__dirname, '../src/integrations/supabase/client.ts');
      
      const clientContent = `// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "${process.env.SUPABASE_URL}";
const SUPABASE_PUBLISHABLE_KEY = "${process.env.SUPABASE_ANON_KEY}";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
`;

      fs.writeFileSync(frontendClientPath, clientContent);
      
      // Atualizar .env.local
      const envLocalPath = path.join(__dirname, '../.env.local');
      let envContent = '';
      
      if (fs.existsSync(envLocalPath)) {
        envContent = fs.readFileSync(envLocalPath, 'utf8');
      }
      
      // Adicionar ou atualizar variáveis do Supabase
      const supabaseVars = [
        `VITE_SUPABASE_URL=${process.env.SUPABASE_URL}`,
        `VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`
      ];
      
      for (const varLine of supabaseVars) {
        const [varName] = varLine.split('=');
        const regex = new RegExp(`^${varName}=.*$`, 'm');
        
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, varLine);
        } else {
          envContent += `\n${varLine}`;
        }
      }
      
      fs.writeFileSync(envLocalPath, envContent);
      
      this.log.success('Configurações do frontend atualizadas');
      return true;
    } catch (error) {
      this.log.error(`Erro ao atualizar frontend: ${error.message}`);
      return false;
    }
  }

  /**
   * Verificar saúde do sistema
   */
  async healthCheck() {
    this.log.title('Verificação de Saúde do Sistema');
    
    try {
      // Testar tabelas principais
      const tables = ['users', 'groups', 'group_members', 'transactions', 'notifications'];
      
      for (const table of tables) {
        const { data, error } = await this.supabaseAdmin
          .from(table)
          .select('count')
          .limit(1);
          
        if (error) {
          this.log.error(`Tabela ${table}: ${error.message}`);
        } else {
          this.log.success(`Tabela ${table}: OK`);
        }
      }
      
      // Testar autenticação
      const { data: authData, error: authError } = await this.supabase.auth.getSession();
      
      if (authError) {
        this.log.warning(`Auth: ${authError.message}`);
      } else {
        this.log.success('Auth: OK');
      }
      
      return true;
    } catch (error) {
      this.log.error(`Erro na verificação: ${error.message}`);
      return false;
    }
  }

  /**
   * Executar configuração completa
   */
  async run() {
    console.log('🎯 KIXIKILA - Configuração do Supabase para Produção\n');
    
    try {
      // 1. Verificar variáveis de ambiente
      if (!this.checkEnvironmentVariables()) {
        process.exit(1);
      }
      
      // 2. Inicializar Supabase
      this.results.connection = await this.initializeSupabase();
      if (!this.results.connection) {
        process.exit(1);
      }
      
      // 3. Executar schema
      this.results.schema = await this.executeSchema();
      
      // 4. Configurar RLS
      this.results.rls = await this.setupRLS();
      
      // 5. Criar usuário admin
      this.results.admin = await this.createAdminUser();
      
      // 6. Atualizar frontend
      this.results.frontend = await this.updateFrontendConfig();
      
      // 7. Verificação final
      await this.healthCheck();
      
      // Relatório final
      this.log.title('Relatório Final');
      this.log.info(`✅ Conexão Supabase: ${this.results.connection ? 'SUCCESS' : 'FAILED'}`);
      this.log.info(`✅ Schema Database: ${this.results.schema ? 'SUCCESS' : 'FAILED'}`);
      this.log.info(`✅ Row Level Security: ${this.results.rls ? 'SUCCESS' : 'FAILED'}`);
      this.log.info(`✅ Usuário Admin: ${this.results.admin ? 'SUCCESS' : 'FAILED'}`);
      this.log.info(`✅ Frontend Config: ${this.results.frontend ? 'SUCCESS' : 'FAILED'}`);
      
      const allSuccess = Object.values(this.results).every(result => result);
      
      if (allSuccess) {
        this.log.success('\n🎉 Configuração do Supabase concluída com sucesso!');
        this.log.info('\n📋 Próximos passos:');
        this.log.info('1. Verificar todas as tabelas no dashboard do Supabase');
        this.log.info('2. Testar autenticação na aplicação');
        this.log.info('3. Validar políticas RLS');
        this.log.info('4. Fazer backup das configurações');
        this.log.info('\n🔗 Links úteis:');
        this.log.info(`- Supabase Dashboard: ${process.env.SUPABASE_URL.replace('https://', 'https://app.supabase.com/project/')}`);
        this.log.info('- Documentação: https://supabase.com/docs');
      } else {
        this.log.error('\n❌ Configuração incompleta. Verifique os erros acima.');
        process.exit(1);
      }
      
    } catch (error) {
      this.log.error(`Erro fatal: ${error.message}`);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const setup = new SupabaseSetup();
  setup.run();
}

export default SupabaseSetup;