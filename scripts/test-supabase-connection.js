import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

console.log('🔍 Testando Conexão com Supabase\n');

// Verificar variáveis de ambiente
console.log('📋 Variáveis de ambiente:');
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
console.log('');

// Testar conexão básica
try {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  console.log('✅ Cliente Supabase criado com sucesso');
  
  // Testar uma query simples
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1);

  if (error) {
    if (error.message.includes('relation "users" does not exist')) {
      console.log('⚠️  Tabela "users" não existe ainda - isso é esperado');
      console.log('📋 Próximo passo: executar o schema SQL no Supabase');
    } else {
      console.log(`❌ Erro na query: ${error.message}`);
    }
  } else {
    console.log('✅ Conexão com banco de dados funcionando!');
    console.log(`📊 Dados retornados:`, data);
  }

} catch (error) {
  console.log(`❌ Erro ao conectar: ${error.message}`);
}

console.log('\n🎯 Teste de conexão concluído!');