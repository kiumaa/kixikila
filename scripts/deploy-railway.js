#!/usr/bin/env node

/**
 * 🚂 KIXIKILA - Railway Deployment Script
 * 
 * Este script automatiza o deploy do backend no Railway
 * Executar: node scripts/deploy-railway.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bold}${colors.cyan}🚂 ${msg}${colors.reset}\n`)
};

class RailwayDeployer {
  constructor() {
    this.backendPath = path.join(process.cwd(), 'backend');
    this.requiredEnvVars = [
      'JWT_SECRET',
      'ADMIN_PASSWORD', 
      'SESSION_SECRET',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'BULKSMS_USERNAME',
      'BULKSMS_PASSWORD',
      'EMAIL_HOST',
      'EMAIL_USER', 
      'EMAIL_PASS',
      'FRONTEND_URL',
      'CORS_ORIGINS'
    ];
  }

  async checkRailwayCLI() {
    log.info('Verificando Railway CLI...');
    try {
      execSync('railway --version', { stdio: 'pipe' });
      log.success('Railway CLI está instalado');
      return true;
    } catch (error) {
      log.error('Railway CLI não encontrado');
      log.info('Instalando Railway CLI...');
      try {
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
        log.success('Railway CLI instalado com sucesso');
        return true;
      } catch (installError) {
        log.error('Falha ao instalar Railway CLI');
        log.info('Por favor, instale manualmente: npm install -g @railway/cli');
        return false;
      }
    }
  }

  async checkRailwayAuth() {
    log.info('Verificando autenticação Railway...');
    try {
      execSync('railway whoami', { stdio: 'pipe' });
      log.success('Autenticado no Railway');
      return true;
    } catch (error) {
      log.warning('Não autenticado no Railway');
      log.info('Execute: railway login');
      return false;
    }
  }

  validatePackageJson() {
    log.info('Validando package.json...');
    const packageJsonPath = path.join(this.backendPath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      log.error('package.json não encontrado em /backend');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts.build) {
      log.error('Script "build" não encontrado no package.json');
      return false;
    }

    if (!packageJson.scripts['start:prod']) {
      log.error('Script "start:prod" não encontrado no package.json');
      return false;
    }

    log.success('package.json válido');
    return true;
  }

  checkEnvironmentVariables() {
    log.info('Verificando variáveis de ambiente...');
    
    const envExamplePath = path.join(this.backendPath, '.env.production');
    if (!fs.existsSync(envExamplePath)) {
      log.error('.env.production não encontrado');
      log.info('Este arquivo contém as variáveis necessárias para produção');
      return false;
    }

    log.success('Arquivo .env.production encontrado');
    log.warning('IMPORTANTE: Configure estas variáveis no Railway Dashboard:');
    
    this.requiredEnvVars.forEach(envVar => {
      console.log(`  - ${envVar}`);
    });
    
    return true;
  }

  buildApplication() {
    log.info('Construindo aplicação...');
    try {
      process.chdir(this.backendPath);
      
      log.info('Instalando dependências...');
      execSync('npm ci --only=production', { stdio: 'inherit' });
      
      log.info('Executando build...');
      execSync('npm run build', { stdio: 'inherit' });
      
      log.success('Build concluído com sucesso');
      return true;
    } catch (error) {
      log.error('Falha no build');
      console.error(error.message);
      return false;
    }
  }

  showManualInstructions() {
    log.title('INSTRUÇÕES PARA DEPLOY MANUAL NO RAILWAY');
    
    console.log(`${colors.bold}1. Criar Projeto no Railway:${colors.reset}`);
    console.log('   - Acesse https://railway.app');
    console.log('   - Clique em "New Project"');
    console.log('   - Selecione "Deploy from GitHub repo"');
    console.log('   - Escolha seu repositório\n');
    
    console.log(`${colors.bold}2. Configurar Build Settings:${colors.reset}`);
    console.log('   - Vá em Settings');
    console.log('   - Root Directory: backend');
    console.log('   - Build Command: npm ci --only=production && npm run build');
    console.log('   - Start Command: npm run start:prod\n');
    
    console.log(`${colors.bold}3. Configurar Environment Variables:${colors.reset}`);
    console.log('   - Vá em Variables');
    console.log('   - Adicione todas as variáveis do .env.production:\n');
    
    this.requiredEnvVars.forEach(envVar => {
      console.log(`     ${envVar}=valor-aqui`);
    });
    
    console.log(`\n${colors.bold}4. Configurar Domínio:${colors.reset}`);
    console.log('   - Vá em Settings > Domains');
    console.log('   - Adicione: api.kixikila.pro');
    console.log('   - Configure DNS CNAME para Railway domain\n');
    
    console.log(`${colors.bold}5. Verificar Health Check:${colors.reset}`);
    console.log('   - https://api.kixikila.pro/api/v1/health');
    console.log('   - Deve retornar status 200\n');
  }

  showDNSInstructions() {
    log.title('CONFIGURAÇÃO DE DNS');
    
    console.log(`${colors.bold}Configure estes registros no seu provedor de domínio:${colors.reset}\n`);
    
    console.log('Tipo    Nome    Valor');
    console.log('----    ----    -----');
    console.log('A       @       185.158.133.1');
    console.log('A       www     185.158.133.1');
    console.log('CNAME   api     [railway-domain].railway.app');
    console.log('TXT     @       v=spf1 include:_spf.google.com ~all\n');
    
    log.warning('Substitua [railway-domain] pelo domínio fornecido pelo Railway');
    log.info('DNS pode levar até 48h para propagar');
  }

  showHealthCheck() {
    log.title('VERIFICAÇÃO DE SAÚDE');
    
    console.log(`${colors.bold}URLs para testar:${colors.reset}`);
    console.log('• Backend: https://api.kixikila.pro/api/v1/health');
    console.log('• Frontend: https://kixikila.pro\n');
    
    console.log(`${colors.bold}Resposta esperada do health check:${colors.reset}`);
    console.log(`{
  "status": "healthy",
  "timestamp": "...",
  "services": { ... }
}`);
  }

  async deploy() {
    log.title('KIXIKILA - RAILWAY DEPLOYMENT');
    
    // Verificações pré-deploy
    if (!await this.checkRailwayCLI()) return false;
    if (!this.validatePackageJson()) return false;
    if (!this.checkEnvironmentVariables()) return false;
    
    // Build da aplicação
    if (!this.buildApplication()) return false;
    
    // Mostrar instruções manuais
    this.showManualInstructions();
    this.showDNSInstructions();
    this.showHealthCheck();
    
    log.success('Pré-verificações concluídas! Siga as instruções acima para deploy manual.');
    
    return true;
  }
}

// Executar deploy se script chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new RailwayDeployer();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
      await deployer.checkRailwayCLI();
      await deployer.checkRailwayAuth();
      deployer.validatePackageJson();
      deployer.checkEnvironmentVariables();
      break;
    case 'build':
      deployer.buildApplication();
      break;
    case 'instructions':
      deployer.showManualInstructions();
      deployer.showDNSInstructions();
      deployer.showHealthCheck();
      break;
    default:
      await deployer.deploy();
  }
}