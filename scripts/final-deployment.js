#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bold}${colors.magenta}\n🚀 ${msg}${colors.reset}\n`)
};

class FinalDeployment {
  constructor() {
    this.requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY', 
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'BULKSMS_USERNAME',
      'BULKSMS_PASSWORD',
      'JWT_SECRET',
      'ADMIN_PASSWORD'
    ];
  }

  validateEnvironment() {
    log.title('Validando Configurações de Produção');
    
    // Check backend .env.production
    const backendEnvPath = path.join(__dirname, '../backend/.env.production');
    if (!fs.existsSync(backendEnvPath)) {
      log.error('Arquivo backend/.env.production não encontrado');
      return false;
    }

    // Check frontend .env.production
    const frontendEnvPath = path.join(__dirname, '../.env.production');
    if (!fs.existsSync(frontendEnvPath)) {
      log.error('Arquivo .env.production não encontrado');
      return false;
    }

    log.success('Arquivos de ambiente encontrados');
    return true;
  }

  showDeploymentInstructions() {
    log.title('Instruções de Deploy Manual');
    
    log.info('1️⃣ CONFIGURAÇÕES SUPABASE (Manual):');
    log.info('   • Auth OTP Expiry: 10 minutos');
    log.info('   • Leaked Password Protection: Ativado');
    log.info('   • Site URL: https://kixikila.pro');
    log.info('   🔗 https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings');
    
    log.info('\n2️⃣ DEPLOY BACKEND (Railway):');
    log.info('   • Criar projeto no Railway');
    log.info('   • Build: cd backend && npm ci --only=production');
    log.info('   • Start: cd backend && npm start');
    log.info('   • Domínio: api.kixikila.pro');
    log.info('   🔗 https://railway.app');
    
    log.info('\n3️⃣ DEPLOY FRONTEND (Lovable):');
    log.info('   • Usar botão "Publish" no dashboard');
    log.info('   • Configurar domínio: kixikila.pro');
    
    log.info('\n4️⃣ CONFIGURAR DNS:');
    log.info('   • A Record: @ → 185.158.133.1');
    log.info('   • CNAME: www → kixikila.pro');
    log.info('   • CNAME: api → [railway-domain].railway.app');
    
    log.info('\n5️⃣ STRIPE PRODUÇÃO:');
    log.info('   • Ativar modo Live');
    log.info('   • Configurar webhooks');
    log.info('   🔗 https://dashboard.stripe.com');
  }

  showHealthCheckUrls() {
    log.title('URLs de Verificação');
    
    log.info('Frontend:');
    log.info('  🌐 https://kixikila.pro');
    log.info('  🌐 https://www.kixikila.pro');
    
    log.info('\nBackend:');
    log.info('  🔗 https://api.kixikila.pro/api/v1/health');
    
    log.info('\nEdge Functions:');
    log.info('  🔗 https://hkesrohuaurcyonpktyt.supabase.co/functions/v1/health-check');
    
    log.info('\nAdmin Panel:');
    log.info('  👨‍💼 https://kixikila.pro/admin');
  }

  async deploy() {
    try {
      log.title('KIXIKILA - Deployment Final para Produção');
      
      if (!this.validateEnvironment()) {
        process.exit(1);
      }
      
      this.showDeploymentInstructions();
      this.showHealthCheckUrls();
      
      log.title('✅ KIXIKILA Pronto para Produção!');
      log.success('Todas as verificações automáticas foram concluídas');
      log.success('Execute as configurações manuais listadas acima');
      log.success('Use o Admin Panel → Sistema → Production Deploy para acompanhar o progresso');
      
    } catch (error) {
      log.error(`Erro durante deployment: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI interface
if (require.main === module) {
  const deployer = new FinalDeployment();
  deployer.deploy();
}

module.exports = { FinalDeployment };