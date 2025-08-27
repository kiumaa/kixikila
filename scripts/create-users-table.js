import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuração do Supabase:');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL para criar a tabela users
const createTableSQL = `-- KIXIKILA Database Schema - Users Table
-- Execute este SQL no Supabase SQL Editor

-- Criar a tabela users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  profile_picture_url TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'pending_verification',
  
  -- Verification fields
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Security fields
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Habilitar Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Inserir usuário de teste (opcional)
-- INSERT INTO public.users (email, full_name, role, status, email_verified)
-- VALUES ('admin@kixikila.com', 'Administrador KIXIKILA', 'admin', 'active', true)
-- ON CONFLICT (email) DO NOTHING;

SELECT 'Tabela users criada com sucesso!' as message;`;

async function setupUsersTable() {
  try {
    console.log('🧪 Testando conexão com Supabase...');
    
    // Test if table already exists
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      console.log('📝 A tabela "users" não existe no schema público');
      console.log('💾 Gerando arquivo SQL para criação manual...');
      
      // Save SQL to file
      const sqlFilePath = path.join(__dirname, 'create-users-table.sql');
      fs.writeFileSync(sqlFilePath, createTableSQL);
      
      console.log('\n📋 INSTRUÇÕES:');
      console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Vá para o seu projeto: hkesrohuaurcyonpktyt');
      console.log('3. Clique em "SQL Editor" no menu lateral');
      console.log('4. Cole e execute o seguinte SQL:');
      console.log('\n' + '='.repeat(80));
      console.log(createTableSQL);
      console.log('='.repeat(80));
      console.log(`\n💾 SQL também salvo em: ${sqlFilePath}`);
      
      return false;
    } else if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      return false;
    } else {
      console.log('✅ Tabela users já existe!');
      console.log('📊 Registros encontrados:', data?.length || 0);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Execute the function
setupUsersTable().then(success => {
  if (success) {
    console.log('🎉 Tabela users está pronta!');
    process.exit(0);
  } else {
    console.log('⚠️ Execute o SQL manualmente no Supabase SQL Editor');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});