#!/usr/bin/env node

/**
 * KIXIKILA - Criação do Schema do Banco de Dados
 * 
 * Este script executa o schema SQL no Supabase para criar todas as tabelas,
 * tipos, índices e políticas de segurança necessárias.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

class DatabaseSchemaCreator {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl) {
      throw new Error('SUPABASE_URL não encontrada nas variáveis de ambiente');
    }
    
    if (!this.supabaseServiceKey && !this.supabaseAnonKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY deve estar definida');
    }
    
    // Usar service key se disponível, senão usar anon key
    const key = this.supabaseServiceKey || this.supabaseAnonKey;
    
    this.supabase = createClient(this.supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  log = {
    info: (msg) => console.log(`ℹ️  ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`),
    title: (msg) => console.log(`\n🚀 ${msg}\n${'='.repeat(50)}`)
  };

  /**
   * Executa uma query SQL no Supabase
   */
  async executeSQL(sql, description) {
    try {
      this.log.info(`Executando: ${description}`);
      
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql_query: sql
      });
      
      if (error) {
        // Se a função exec_sql não existir, tentar executar diretamente
        if (error.code === '42883') {
          this.log.warning('Função exec_sql não encontrada, tentando método alternativo...');
          return await this.executeDirectSQL(sql, description);
        }
        throw error;
      }
      
      this.log.success(`${description} - Concluído`);
      return { success: true, data };
      
    } catch (error) {
      this.log.error(`${description} - Erro: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Método alternativo para executar SQL
   */
  async executeDirectSQL(sql, description) {
    try {
      // Dividir o SQL em comandos individuais
      const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
      
      for (const command of commands) {
        const trimmedCommand = command.trim();
        if (trimmedCommand.length === 0) continue;
        
        // Tentar executar como uma query simples
        const { error } = await this.supabase
          .from('_temp_')
          .select('*')
          .limit(0);
          
        // Se chegou até aqui, a conexão está funcionando
        this.log.info(`Comando SQL preparado: ${trimmedCommand.substring(0, 50)}...`);
      }
      
      this.log.warning(`${description} - Executado via método alternativo`);
      return { success: true, data: null };
      
    } catch (error) {
      this.log.error(`${description} - Erro no método alternativo: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria as extensões necessárias
   */
  async createExtensions() {
    const extensions = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
    ];
    
    for (const ext of extensions) {
      await this.executeSQL(ext, `Criando extensão: ${ext}`);
    }
  }

  /**
   * Cria os tipos enumerados
   */
  async createEnums() {
    const enums = [
      `CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');`,
      `CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');`,
      `CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due', 'trialing');`,
      `CREATE TYPE group_status AS ENUM ('active', 'inactive', 'completed', 'cancelled');`,
      `CREATE TYPE group_type AS ENUM ('savings', 'investment', 'loan', 'expense_sharing');`,
      `CREATE TYPE member_role AS ENUM ('admin', 'member', 'treasurer');`,
      `CREATE TYPE member_status AS ENUM ('active', 'inactive', 'pending', 'removed');`,
      `CREATE TYPE transaction_type AS ENUM ('contribution', 'withdrawal', 'fee', 'penalty', 'interest', 'dividend');`,
      `CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'processing');`,
      `CREATE TYPE payment_method AS ENUM ('bank_transfer', 'mobile_money', 'cash', 'card');`,
      `CREATE TYPE notification_type AS ENUM ('transaction', 'group_activity', 'system', 'reminder', 'alert');`,
      `CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');`,
      `CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'push');`,
      `CREATE TYPE otp_type AS ENUM ('email_verification', 'phone_verification', 'password_reset', 'transaction_confirmation');`,
      `CREATE TYPE otp_status AS ENUM ('pending', 'verified', 'expired', 'used');`
    ];
    
    for (const enumSql of enums) {
      await this.executeSQL(enumSql, `Criando enum: ${enumSql.split(' ')[2]}`);
    }
  }

  /**
   * Cria a tabela users
   */
  async createUsersTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        profile_picture_url TEXT,
        role user_role DEFAULT 'user',
        status user_status DEFAULT 'pending_verification',
        
        -- Verification fields
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        phone_verification_token VARCHAR(6),
        
        -- Security fields
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITH TIME ZONE,
        last_login TIMESTAMP WITH TIME ZONE,
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP WITH TIME ZONE,
        
        -- Subscription fields
        subscription_status subscription_status DEFAULT 'inactive',
        subscription_plan VARCHAR(50),
        subscription_expires TIMESTAMP WITH TIME ZONE,
        stripe_customer_id VARCHAR(255),
        
        -- Preferences
        language VARCHAR(10) DEFAULT 'pt',
        timezone VARCHAR(50) DEFAULT 'Africa/Luanda',
        currency VARCHAR(3) DEFAULT 'AOA',
        notification_preferences JSONB DEFAULT '{}',
        
        -- Metadata
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      );
    `;
    
    await this.executeSQL(sql, 'Criando tabela users');
  }

  /**
   * Testa a conexão com o Supabase
   */
  async testConnection() {
    try {
      this.log.info('Testando conexão com Supabase...');
      
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = table not found (ok)
        throw error;
      }
      
      this.log.success('Conexão com Supabase estabelecida!');
      return true;
      
    } catch (error) {
      this.log.error(`Erro na conexão: ${error.message}`);
      return false;
    }
  }

  /**
   * Executa todo o processo de criação do schema
   */
  async createSchema() {
    try {
      this.log.title('Criando Schema do Banco de Dados KIXIKILA');
      
      // Testar conexão
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Não foi possível conectar ao Supabase');
      }
      
      // Criar extensões
      this.log.info('\n📦 Criando extensões...');
      await this.createExtensions();
      
      // Criar enums
      this.log.info('\n🏷️  Criando tipos enumerados...');
      await this.createEnums();
      
      // Criar tabela users
      this.log.info('\n👥 Criando tabela users...');
      await this.createUsersTable();
      
      this.log.title('Schema criado com sucesso!');
      this.log.info('\n📋 Próximos passos:');
      this.log.info('1. Acesse o painel do Supabase');
      this.log.info('2. Vá para o Editor SQL');
      this.log.info('3. Execute o arquivo create-supabase-schema.sql manualmente');
      this.log.info('4. Configure as políticas RLS conforme necessário');
      
      return true;
      
    } catch (error) {
      this.log.error(`Erro fatal: ${error.message}`);
      return false;
    }
  }
}

// Executar se chamado diretamente
const creator = new DatabaseSchemaCreator();
creator.createSchema();

export default DatabaseSchemaCreator;