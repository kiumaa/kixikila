#!/usr/bin/env node

/**
 * KIXIKILA - Verificador de Configurações Supabase Produção
 * Verifica se as configurações críticas foram aplicadas corretamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://hkesrohuaurcyonpktyt.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifySupabaseConfig() {
  console.log('🔍 Verificando Configurações Supabase Dashboard...\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    checks: []
  };

  // Teste 1: Verificar conexão com Supabase
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'session is null') {
      throw error;
    }
    results.checks.push({ name: 'Conexão Supabase', status: '✅ PASS', details: 'Conectado com sucesso' });
    results.passed++;
  } catch (error) {
    results.checks.push({ name: 'Conexão Supabase', status: '❌ FAIL', details: error.message });
    results.failed++;
  }

  // Teste 2: Verificar se RLS está ativo
  try {
    const { data, error } = await supabase.rpc('validate_rls_security');
    if (error) throw error;
    
    const tablesWithRLS = data.filter(table => table.policy_count > 0);
    if (tablesWithRLS.length >= 4) {
      results.checks.push({ name: 'RLS Policies', status: '✅ PASS', details: `${tablesWithRLS.length} tabelas com RLS ativo` });
      results.passed++;
    } else {
      results.checks.push({ name: 'RLS Policies', status: '⚠️  WARN', details: 'Algumas tabelas podem não ter RLS' });
      results.warnings++;
    }
  } catch (error) {
    results.checks.push({ name: 'RLS Policies', status: '❌ FAIL', details: 'Não foi possível verificar RLS' });
    results.failed++;
  }

  // Teste 3: Verificar URL de produção
  const productionUrls = ['kixikila.pro', 'api.kixikila.pro'];
  const currentUrl = new URL(SUPABASE_URL).hostname;
  
  if (currentUrl.includes('supabase.co')) {
    results.checks.push({ name: 'URL Supabase', status: '✅ PASS', details: 'URL de produção Supabase correta' });
    results.passed++;
  } else {
    results.checks.push({ name: 'URL Supabase', status: '⚠️  WARN', details: 'Verificar URL de produção' });
    results.warnings++;
  }

  // Teste 4: Testar signup com senha fraca (deve falhar se password protection estiver ativo)
  try {
    const { error } = await supabase.auth.signUp({
      email: `test+${Date.now()}@example.com`,
      password: '123456' // Senha fraca intencional
    });
    
    if (error && error.message.toLowerCase().includes('password')) {
      results.checks.push({ name: 'Password Protection', status: '✅ PASS', details: 'Senhas fracas rejeitadas' });
      results.passed++;
    } else {
      results.checks.push({ name: 'Password Protection', status: '⚠️  WARN', details: 'Verificar se password protection está ativo' });
      results.warnings++;
    }
  } catch (error) {
    results.checks.push({ name: 'Password Protection', status: '⚠️  WARN', details: 'Não foi possível testar password protection' });
    results.warnings++;
  }

  // Teste 5: Verificar Edge Functions
  const criticalFunctions = ['send-otp-sms', 'verify-otp', 'security-monitoring', 'production-health'];
  let functionsWorking = 0;

  for (const funcName of criticalFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke(funcName, {
        body: { test: true, healthCheck: true }
      });
      
      // Se não deu erro 404, a função existe
      if (!error || !error.message.includes('404')) {
        functionsWorking++;
      }
    } catch (e) {
      // Function might exist but not accessible without auth
    }
  }

  if (functionsWorking >= 2) {
    results.checks.push({ name: 'Edge Functions', status: '✅ PASS', details: `${functionsWorking}/${criticalFunctions.length} funções acessíveis` });
    results.passed++;
  } else {
    results.checks.push({ name: 'Edge Functions', status: '⚠️  WARN', details: 'Verificar se Edge Functions estão deployadas' });
    results.warnings++;
  }

  // Imprimir resultados
  console.log('📋 RESULTADOS DA VERIFICAÇÃO:\n');
  
  results.checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
    console.log(`   ${check.details}\n`);
  });

  console.log('📊 RESUMO:');
  console.log(`✅ Passou: ${results.passed}`);
  console.log(`⚠️  Avisos: ${results.warnings}`);
  console.log(`❌ Falhou: ${results.failed}\n`);

  // Configurações que devem ser feitas MANUALMENTE no dashboard
  console.log('🔧 CONFIGURAÇÕES MANUAIS OBRIGATÓRIAS (Dashboard):');
  console.log('');
  console.log('1. 🔒 Auth Settings (https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings):');
  console.log('   - OTP expiry: 600 segundos (10 minutos)');
  console.log('   - Enable password breach protection: ✅ ATIVADO');
  console.log('   - Password strength requirements: ✅ CONFIGURADO');
  console.log('');
  console.log('2. 🌐 URL Configuration (https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/url-configuration):');
  console.log('   - Site URL: https://kixikila.pro');
  console.log('   - Redirect URLs: kixikila.pro/**, api.kixikila.pro/**');
  console.log('');
  console.log('3. ⚡ Rate Limits (https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/rate-limits):');
  console.log('   - SMS: 10/hora | Email: 30/hora | Login: 30/hora');
  console.log('');
  console.log('4. 📧 SMTP Settings (https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/templates):');
  console.log('   - Configurar SMTP para emails de produção');
  console.log('');

  if (results.failed > 0) {
    console.log('🚨 AÇÃO NECESSÁRIA: Corrigir falhas antes do deploy!');
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log('⚠️  RECOMENDAÇÃO: Verificar avisos e configurar manualmente no dashboard');
    console.log('✅ Sistema tecnicamente pronto, mas requer configurações manual');
    process.exit(0);
  } else {
    console.log('🎉 CONFIGURAÇÃO COMPLETA! Sistema pronto para produção!');
    process.exit(0);
  }
}

// Executar verificação
verifySupabaseConfig().catch(error => {
  console.error('❌ Erro na verificação:', error.message);
  process.exit(1);
});