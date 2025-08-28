#!/usr/bin/env node

/**
 * KIXIKILA - Script de Verificação Final para Produção
 * 
 * Este script verifica se todas as configurações estão corretas
 * antes do deploy final.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

console.log('🔍 KIXIKILA - Verificação Final para Produção');
console.log('===========================================\n');

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

// Lista de verificações
const checks = {
  files: [
    'backend/.env.production',
    'backend/railway.json',
    'PRODUCTION_DEPLOYMENT_CHECKLIST.md',
    'RAILWAY_DEPLOYMENT_GUIDE.md',
    'SUPABASE_AUTH_PRODUCTION_CONFIG.md'
  ],
  edgeFunctions: [
    'supabase/functions/send-otp-sms/index.ts',
    'supabase/functions/verify-otp/index.ts', 
    'supabase/functions/health-check/index.ts',
    'supabase/functions/cleanup-expired-data/index.ts'
  ],
  frontendFiles: [
    '.env.production',
    'src/config/api.ts'
  ]
};

// Função para verificar arquivos
function checkFiles(fileList, category) {
  log.info(`Verificando ${category}...`);
  let allOk = true;
  
  fileList.forEach(file => {
    if (fs.existsSync(file)) {
      log.success(`${file} - OK`);
    } else {
      log.error(`${file} - MISSING`);
      allOk = false;
    }
  });
  
  return allOk;
}

// Função para verificar variáveis de ambiente
function checkEnvVariables() {
  log.info('Verificando variáveis de ambiente...');
  
  const envFile = 'backend/.env.production';
  if (!fs.existsSync(envFile)) {
    log.error('Arquivo .env.production não encontrado');
    return false;
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'JWT_SECRET',
    'ADMIN_PASSWORD', 
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'STRIPE_SECRET_KEY',
    'BULKSMS_USERNAME',
    'BULKSMS_PASSWORD'
  ];
  
  let allConfigured = true;
  requiredVars.forEach(varName => {
    if (envContent.includes(`${varName}=your-`) || !envContent.includes(`${varName}=`)) {
      log.error(`${varName} - NÃO CONFIGURADO`);
      allConfigured = false;
    } else {
      log.success(`${varName} - OK`);
    }
  });
  
  return allConfigured;
}

// Função para verificar Supabase Edge Functions
function checkSupabaseConfig() {
  log.info('Verificando configuração Supabase...');
  
  if (!fs.existsSync('supabase/config.toml')) {
    log.error('supabase/config.toml não encontrado');
    return false;
  }
  
  const configContent = fs.readFileSync('supabase/config.toml', 'utf8');
  
  // Verificar se todas as funções estão configuradas
  const functions = ['send-otp-sms', 'verify-otp', 'health-check', 'cleanup-expired-data'];
  let allFunctionsOk = true;
  
  functions.forEach(func => {
    if (fs.existsSync(`supabase/functions/${func}/index.ts`)) {
      log.success(`Edge Function: ${func} - OK`);
    } else {
      log.error(`Edge Function: ${func} - MISSING`);
      allFunctionsOk = false;
    }
  });
  
  return allFunctionsOk;
}

// Função para verificar build do backend
function checkBackendBuild() {
  log.info('Verificando build do backend...');
  
  try {
    process.chdir('backend');
    
    // Verificar se package.json existe
    if (!fs.existsSync('package.json')) {
      log.error('package.json não encontrado no backend');
      return false;
    }
    
    // Verificar se as dependências estão instaladas
    if (!fs.existsSync('node_modules')) {
      log.warning('node_modules não encontrado - executando npm install...');
      execSync('npm install', { stdio: 'pipe' });
    }
    
    // Tentar fazer build
    log.info('Executando build do TypeScript...');
    execSync('npm run build', { stdio: 'pipe' });
    log.success('Build do backend - OK');
    
    process.chdir('..');
    return true;
    
  } catch (error) {
    log.error(`Erro no build do backend: ${error.message}`);
    process.chdir('..');
    return false;
  }
}

// Função para gerar relatório final
function generateFinalReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 RELATÓRIO FINAL DE PRODUÇÃO');
  console.log('='.repeat(50));
  
  const categories = [
    { name: 'Arquivos de Configuração', status: results.files },
    { name: 'Edge Functions', status: results.edgeFunctions },
    { name: 'Arquivos Frontend', status: results.frontend },
    { name: 'Variáveis de Ambiente', status: results.env },
    { name: 'Configuração Supabase', status: results.supabase },
    { name: 'Build Backend', status: results.build }
  ];
  
  let allPassing = true;
  
  categories.forEach(category => {
    const icon = category.status ? '✅' : '❌';
    const status = category.status ? 'PASS' : 'FAIL';
    console.log(`${icon} ${category.name}: ${status}`);
    if (!category.status) allPassing = false;
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassing) {
    log.success('🎉 TUDO PRONTO PARA PRODUÇÃO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure as settings de Auth no Supabase Dashboard');
    console.log('2. Execute: node scripts/deploy-production.js');
    console.log('3. Configure o Railway seguindo RAILWAY_DEPLOYMENT_GUIDE.md');
    console.log('4. Configure DNS conforme instruções');
    console.log('5. Execute: node scripts/setup-domain.js para verificar');
  } else {
    log.error('❌ PROBLEMAS ENCONTRADOS!');
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Corrija os problemas listados acima');
    console.log('2. Execute este script novamente');
    console.log('3. Consulte os guias de deployment criados');
  }
  
  return allPassing;
}

// Função principal
async function main() {
  try {
    const results = {
      files: checkFiles(checks.files, 'Arquivos de Configuração'),
      edgeFunctions: checkFiles(checks.edgeFunctions, 'Edge Functions'),
      frontend: checkFiles(checks.frontendFiles, 'Arquivos Frontend'),
      env: checkEnvVariables(),
      supabase: checkSupabaseConfig(),
      build: checkBackendBuild()
    };
    
    const allReady = generateFinalReport(results);
    
    console.log('\n📚 DOCUMENTAÇÃO CRIADA:');
    console.log('- PRODUCTION_DEPLOYMENT_CHECKLIST.md - Lista completa de verificações');
    console.log('- RAILWAY_DEPLOYMENT_GUIDE.md - Guia passo-a-passo do Railway');  
    console.log('- SUPABASE_AUTH_PRODUCTION_CONFIG.md - Configurações de segurança');
    console.log('- scripts/ - Scripts de automação e verificação');
    
    process.exit(allReady ? 0 : 1);
    
  } catch (error) {
    log.error(`Erro durante verificação: ${error.message}`);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main };