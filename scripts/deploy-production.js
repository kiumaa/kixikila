#!/usr/bin/env node

/**
 * KIXIKILA Production Deployment Script
 * 
 * Este script automatiza o processo de deploy para produção no Railway
 * e configuração de DNS para o domínio kixikila.pro
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 KIXIKILA - Script de Deploy para Produção');
console.log('=============================================\n');

// Verificar se estamos no diretório correto
if (!fs.existsSync('package.json') || !fs.existsSync('backend/package.json')) {
  console.error('❌ Execute este script na raiz do projeto KIXIKILA');
  process.exit(1);
}

// Verificar se o Railway CLI está instalado
function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI detectado');
    return true;
  } catch (error) {
    console.log('📦 Instalando Railway CLI...');
    try {
      execSync('npm install -g @railway/cli', { stdio: 'inherit' });
      console.log('✅ Railway CLI instalado com sucesso');
      return true;
    } catch (installError) {
      console.error('❌ Erro ao instalar Railway CLI:', installError.message);
      console.log('\n💡 Instale manualmente: npm install -g @railway/cli');
      return false;
    }
  }
}

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'BULKSMS_USERNAME',
    'BULKSMS_PASSWORD',
    'JWT_SECRET',
    'ADMIN_PASSWORD'
  ];

  const envFile = path.join('backend', '.env.production');
  
  if (!fs.existsSync(envFile)) {
    console.error('❌ Arquivo backend/.env.production não encontrado');
    return false;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const missingVars = requiredVars.filter(varName => {
    return !envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`);
  });

  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente não configuradas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n💡 Configure todas as variáveis em backend/.env.production');
    return false;
  }

  console.log('✅ Variáveis de ambiente configuradas');
  return true;
}

// Fazer build do projeto
function buildProject() {
  console.log('\n📦 Fazendo build do backend...');
  try {
    process.chdir('backend');
    execSync('npm ci --only=production', { stdio: 'inherit' });
    execSync('npm run build', { stdio: 'inherit' });
    process.chdir('..');
    console.log('✅ Build do backend concluído');
    return true;
  } catch (error) {
    console.error('❌ Erro no build do backend:', error.message);
    return false;
  }
}

// Deploy no Railway
function deployToRailway() {
  console.log('\n🚂 Fazendo deploy no Railway...');
  console.log('\n📋 Passos manuais necessários:');
  console.log('1. Acesse: https://railway.app');
  console.log('2. Crie uma nova aplicação');
  console.log('3. Conecte seu repositório GitHub');
  console.log('4. Configure o Root Directory: backend');
  console.log('5. Configure as variáveis de ambiente (veja backend/.env.production)');
  console.log('6. Configure o domínio personalizado: api.kixikila.pro');
  console.log('7. Ative o health check: /api/v1/health');
  
  console.log('\n🔧 Variáveis de ambiente necessárias no Railway:');
  const envFile = path.join('backend', '.env.production');
  const envContent = fs.readFileSync(envFile, 'utf8');
  const lines = envContent.split('\n').filter(line => 
    line.trim() && !line.startsWith('#') && line.includes('=')
  );
  
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`   - ${key.trim()}`);
  });
  
  return true;
}

// Configurações de DNS
function configureDNS() {
  console.log('\n🌐 Configuração de DNS necessária:');
  console.log('Configure os seguintes registros no seu provedor de domínio:\n');
  
  console.log('📍 Registros DNS para kixikila.pro:');
  console.log('   A     @           185.158.133.1     (Frontend - Lovable)');
  console.log('   A     www         185.158.133.1     (Frontend - Lovable)');
  console.log('   CNAME api         [seu-dominio-railway].railway.app');
  console.log('   TXT   @           "v=spf1 include:_spf.google.com ~all" (Email)');
  
  console.log('\n⏱️  Propagação DNS pode levar até 24-48 horas');
  
  return true;
}

// Verificar health endpoints
function checkHealthEndpoints() {
  console.log('\n🏥 Endpoints de Health Check:');
  console.log('   Backend:  https://api.kixikila.pro/api/v1/health');
  console.log('   Frontend: https://kixikila.pro');
  console.log('\n💡 Teste estes endpoints após o deploy');
  
  return true;
}

// Executar deploy
async function main() {
  try {
    // Verificações preliminares
    if (!checkRailwayCLI()) {
      console.log('\n❌ Railway CLI é necessário para continuar');
      process.exit(1);
    }

    if (!checkEnvironmentVariables()) {
      console.log('\n❌ Configure as variáveis de ambiente antes de continuar');
      process.exit(1);
    }

    // Build
    if (!buildProject()) {
      console.log('\n❌ Erro no build do projeto');
      process.exit(1);
    }

    // Deploy
    deployToRailway();
    configureDNS();
    checkHealthEndpoints();

    console.log('\n🎉 Preparação para deploy concluída!');
    console.log('\n📋 Próximos passos manuais:');
    console.log('1. Configure o projeto no Railway seguindo as instruções acima');
    console.log('2. Configure os registros DNS no seu provedor');
    console.log('3. Aguarde a propagação DNS (24-48h)');
    console.log('4. Teste os endpoints de health check');
    console.log('5. Configure o frontend para produção');
    
    console.log('\n📚 Consulte PRODUCTION_DEPLOYMENT_CHECKLIST.md para mais detalhes');
    
  } catch (error) {
    console.error('\n❌ Erro durante o deploy:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main };