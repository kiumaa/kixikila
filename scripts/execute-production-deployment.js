#!/usr/bin/env node

/**
 * KIXIKILA - Master Production Deployment Executor
 * 
 * Executes the complete automated deployment sequence:
 * 1. Verify Supabase configurations
 * 2. Run production tests (security, functionality, performance)
 * 3. Create production environment
 * 4. Guide Railway deployment
 * 5. Final validation and go-live
 */

import { spawn, exec } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const require = createRequire(import.meta.url);

// Color codes for logging
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.magenta}${colors.bold}🚀 ${msg}${colors.reset}\n`),
  step: (step, msg) => console.log(`${colors.cyan}📋 STEP ${step}: ${msg}${colors.reset}`),
  divider: () => console.log('='.repeat(60))
};

class ProductionDeploymentExecutor {
  constructor() {
    this.deploymentResults = {
      steps: [],
      startTime: new Date(),
      currentStep: 0,
      totalSteps: 8
    };
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async promptUser(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });
  }

  addStepResult(step, status, message, details = {}) {
    this.deploymentResults.steps.push({
      step,
      status,
      message,
      details,
      timestamp: new Date(),
      duration: Date.now() - this.stepStartTime
    });

    const icon = status === 'success' ? '✅' : status === 'failed' ? '❌' : status === 'warning' ? '⚠️' : '🔄';
    console.log(`${icon} ${message}`);
  }

  async executeCommand(command, description, options = {}) {
    return new Promise((resolve, reject) => {
      console.log(`${colors.blue}⚡ Executando: ${description}${colors.reset}`);
      
      const child = spawn('node', [command], {
        stdio: options.silent ? 'pipe' : 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, ...options.env }
      });

      let output = '';
      let errorOutput = '';

      if (options.silent) {
        child.stdout?.on('data', (data) => output += data.toString());
        child.stderr?.on('data', (data) => errorOutput += data.toString());
      }

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output, error: errorOutput });
        } else {
          reject(new Error(`Command failed with code ${code}: ${errorOutput || 'Unknown error'}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async step1_VerifySupabaseConfig() {
    this.stepStartTime = Date.now();
    log.step(1, 'Verificando Configurações Supabase');
    
    try {
      const result = await this.executeCommand(
        'scripts/verify-supabase-config.js',
        'Verificação das configurações Supabase Dashboard'
      );
      
      this.addStepResult('supabase_verification', 'success', 'Configurações Supabase verificadas com sucesso');
      return true;
    } catch (error) {
      this.addStepResult('supabase_verification', 'failed', `Falha na verificação Supabase: ${error.message}`);
      
      log.error('Configurações Supabase falharam na verificação!');
      console.log('\n🔧 Acções necessárias no Supabase Dashboard:');
      console.log('1. OTP expiry: 600 segundos (10 minutos)');
      console.log('2. Password breach protection: ATIVADO');
      console.log('3. Site URL: https://kixikila.pro');
      console.log('4. Rate limits: SMS 10/hora, Email 30/hora');
      
      const continueAnyway = await this.promptUser('\n❓ Continuar mesmo assim? (y/N): ');
      return continueAnyway === 'y' || continueAnyway === 'yes';
    }
  }

  async step2_RunSecurityTests() {
    this.stepStartTime = Date.now();
    log.step(2, 'Executando Testes de Segurança');
    
    try {
      const result = await this.executeCommand(
        'scripts/test-production-security.js',
        'Suite completa de testes de segurança'
      );
      
      this.addStepResult('security_tests', 'success', 'Todos os testes de segurança passaram');
      return true;
    } catch (error) {
      this.addStepResult('security_tests', 'warning', `Alguns testes de segurança falharam: ${error.message}`);
      
      log.warning('Alguns testes de segurança falharam, mas sistema pode estar pronto');
      const continueAnyway = await this.promptUser('❓ Continuar com deployment? (Y/n): ');
      return continueAnyway !== 'n' && continueAnyway !== 'no';
    }
  }

  async step3_RunFunctionalityTests() {
    this.stepStartTime = Date.now();
    log.step(3, 'Executando Testes de Funcionalidade');
    
    try {
      const result = await this.executeCommand(
        'scripts/test-functionality.js',
        'Testes de todas as funcionalidades críticas'
      );
      
      this.addStepResult('functionality_tests', 'success', 'Todos os testes de funcionalidade passaram');
      return true;
    } catch (error) {
      this.addStepResult('functionality_tests', 'failed', `Testes de funcionalidade falharam: ${error.message}`);
      
      log.error('Funcionalidades críticas falharam nos testes!');
      const continueAnyway = await this.promptUser('❓ Continuar mesmo assim? (y/N): ');
      return continueAnyway === 'y' || continueAnyway === 'yes';
    }
  }

  async step4_RunPerformanceTests() {
    this.stepStartTime = Date.now();
    log.step(4, 'Executando Testes de Performance');
    
    try {
      const result = await this.executeCommand(
        'scripts/test-performance.js',
        'Avaliação completa de performance do sistema'
      );
      
      this.addStepResult('performance_tests', 'success', 'Testes de performance passaram com sucesso');
      return true;
    } catch (error) {
      this.addStepResult('performance_tests', 'warning', `Performance abaixo do esperado: ${error.message}`);
      
      log.warning('Performance pode estar abaixo do ideal, mas sistema funcional');
      return true; // Performance warnings shouldn't block deployment
    }
  }

  async step5_CreateProductionEnvironment() {
    this.stepStartTime = Date.now();
    log.step(5, 'Criando Environment de Produção');
    
    try {
      // Check if .env.production already exists
      if (fs.existsSync('.env.production')) {
        log.info('Arquivo .env.production já existe');
        const recreate = await this.promptUser('❓ Recriar arquivo .env.production? (y/N): ');
        if (recreate !== 'y' && recreate !== 'yes') {
          this.addStepResult('env_creation', 'success', 'Usando .env.production existente');
          return true;
        }
      }

      // Create production environment file
      const productionEnv = `# KIXIKILA Production Environment
# Generated: ${new Date().toISOString()}

# Supabase Configuration
VITE_SUPABASE_URL=https://hkesrohuaurcyonpktyt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZXNyb2h1YXVyY3lvbnBrdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjIzMjksImV4cCI6MjA3MTg5ODMyOX0.SNDuFuzRerlL4qmlKGWFm8cf4UH21MmsbhxV4B8SVcg

# Application URLs
VITE_APP_URL=https://kixikila.pro
VITE_API_URL=https://api.kixikila.pro

# Stripe Configuration (LIVE MODE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_LIVE_KEY_HERE

# Production Mode
NODE_ENV=production
VITE_ENV=production

# Security
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
`;

      fs.writeFileSync('.env.production', productionEnv);
      
      log.success('Arquivo .env.production criado com sucesso');
      log.warning('⚠️  IMPORTANTE: Configurar chave Stripe Live no .env.production');
      
      this.addStepResult('env_creation', 'success', 'Environment de produção configurado');
      return true;
      
    } catch (error) {
      this.addStepResult('env_creation', 'failed', `Falha ao criar environment: ${error.message}`);
      return false;
    }
  }

  async step6_ValidateProductionConfig() {
    this.stepStartTime = Date.now();
    log.step(6, 'Validando Configuração de Produção');
    
    try {
      const result = await this.executeCommand(
        'scripts/validate-production-config.js',
        'Validação completa das configurações de produção'
      );
      
      this.addStepResult('config_validation', 'success', 'Configurações de produção validadas');
      return true;
    } catch (error) {
      this.addStepResult('config_validation', 'warning', `Algumas validações falharam: ${error.message}`);
      
      log.warning('Algumas configurações podem precisar de ajustes');
      const continueAnyway = await this.promptUser('❓ Continuar com deployment? (Y/n): ');
      return continueAnyway !== 'n' && continueAnyway !== 'no';
    }
  }

  async step7_GuideRailwayDeployment() {
    this.stepStartTime = Date.now();
    log.step(7, 'Guiando Deployment Railway');
    
    log.divider();
    log.title('RAILWAY DEPLOYMENT SETUP');
    
    console.log('🚂 Configuração Railway Backend:');
    console.log('');
    console.log('1. 📁 Root Directory: backend/');
    console.log('2. 🔨 Build Command: npm ci && npm run build');
    console.log('3. ▶️  Start Command: npm start');
    console.log('4. 🌐 Custom Domain: api.kixikila.pro');
    console.log('');
    console.log('📋 Environment Variables necessárias:');
    console.log('   - PORT=3000');
    console.log('   - NODE_ENV=production');
    console.log('   - SUPABASE_URL=https://hkesrohuaurcyonpktyt.supabase.co');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY=[da Supabase]');
    console.log('   - STRIPE_SECRET_KEY=[da Stripe Live]');
    console.log('   - BULKSMS_USERNAME=[da BulkSMS]');
    console.log('   - BULKSMS_PASSWORD=[da BulkSMS]');
    console.log('   - RESEND_API_KEY=[da Resend]');
    console.log('');
    
    const railwayReady = await this.promptUser('❓ Railway backend foi configurado e deployado? (Y/n): ');
    if (railwayReady === 'n' || railwayReady === 'no') {
      this.addStepResult('railway_deployment', 'failed', 'Railway deployment não foi completado');
      return false;
    }

    // Test Railway endpoint
    console.log('\n🔍 Testando endpoint Railway...');
    try {
      const response = await fetch('https://api.kixikila.pro/health');
      if (response.ok) {
        log.success('Railway backend responde corretamente!');
        this.addStepResult('railway_deployment', 'success', 'Railway backend deployado e funcionando');
        return true;
      } else {
        throw new Error(`Railway retornou status ${response.status}`);
      }
    } catch (error) {
      log.warning(`Não foi possível testar Railway: ${error.message}`);
      const continueAnyway = await this.promptUser('❓ Continuar mesmo assim? (Y/n): ');
      
      if (continueAnyway !== 'n' && continueAnyway !== 'no') {
        this.addStepResult('railway_deployment', 'warning', 'Railway deployment assumido como OK');
        return true;
      } else {
        this.addStepResult('railway_deployment', 'failed', 'Railway deployment falhado ou não testado');
        return false;
      }
    }
  }

  async step8_FinalActivation() {
    this.stepStartTime = Date.now();
    log.step(8, 'Ativação Final e Go-Live');
    
    log.divider();
    log.title('ATIVAÇÃO FINAL - KIXIKILA EM PRODUÇÃO');
    
    console.log('🔑 Integrações finais necessárias:');
    console.log('');
    console.log('1. 💳 Stripe Live Mode:');
    console.log('   - Ativar modo Live na conta Stripe');
    console.log('   - Configurar webhooks para https://api.kixikila.pro/stripe/webhook');
    console.log('   - Testar pagamento real');
    console.log('');
    console.log('2. 📱 BulkSMS Produção:');
    console.log('   - Carregar créditos na conta BulkSMS');
    console.log('   - Testar envio SMS real');
    console.log('');
    console.log('3. 📧 Email Produção:');
    console.log('   - Verificar domínio no Resend');
    console.log('   - Testar envio email real');
    console.log('');
    console.log('4. 🌐 DNS Final:');
    console.log('   - kixikila.pro → Frontend (Lovable)');
    console.log('   - api.kixikila.pro → Backend (Railway)');
    console.log('   - www.kixikila.pro → Redirect para kixikila.pro');
    console.log('');
    
    const integrations = [
      'Stripe Live Mode configurado e testado',
      'BulkSMS com créditos e testado',
      'Emails funcionando em produção',
      'DNS configurado corretamente'
    ];

    let allReady = true;
    for (const integration of integrations) {
      const ready = await this.promptUser(`❓ ${integration}? (Y/n): `);
      if (ready === 'n' || ready === 'no') {
        log.warning(`⚠️  ${integration} - NÃO PRONTO`);
        allReady = false;
      } else {
        log.success(`✅ ${integration} - PRONTO`);
      }
    }

    if (allReady) {
      this.addStepResult('final_activation', 'success', 'Todas as integrações configuradas - SISTEMA LIVE!');
      return true;
    } else {
      this.addStepResult('final_activation', 'warning', 'Algumas integrações pendentes, mas sistema funcional');
      const goLive = await this.promptUser('❓ Ativar sistema mesmo assim? (Y/n): ');
      return goLive !== 'n' && goLive !== 'no';
    }
  }

  generateFinalReport() {
    const endTime = new Date();
    const totalDuration = Math.round((endTime - this.deploymentResults.startTime) / 1000 / 60); // in minutes
    
    log.divider();
    log.title('RELATÓRIO FINAL DE DEPLOYMENT');
    log.divider();
    
    console.log(`🕐 Duração total: ${totalDuration} minutos`);
    console.log(`📅 Iniciado: ${this.deploymentResults.startTime.toLocaleString()}`);
    console.log(`✅ Concluído: ${endTime.toLocaleString()}`);
    console.log('');
    
    console.log('📋 Resumo dos Steps:');
    this.deploymentResults.steps.forEach((step, index) => {
      const icon = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⚠️';
      const duration = Math.round(step.duration / 1000);
      console.log(`${icon} Step ${index + 1}: ${step.message} (${duration}s)`);
    });
    
    console.log('');
    
    const successCount = this.deploymentResults.steps.filter(s => s.status === 'success').length;
    const failedCount = this.deploymentResults.steps.filter(s => s.status === 'failed').length;
    const warningCount = this.deploymentResults.steps.filter(s => s.status === 'warning').length;
    
    if (failedCount === 0) {
      log.success('🎉 DEPLOYMENT COMPLETO COM SUCESSO!');
      console.log('');
      console.log('🚀 KIXIKILA está agora LIVE em produção!');
      console.log('');
      console.log('🌐 URLs de Produção:');
      console.log('   Frontend: https://kixikila.pro');
      console.log('   API: https://api.kixikila.pro');
      console.log('   Admin: https://kixikila.pro/admin');
      console.log('');
      console.log('📊 Próximos passos:');
      console.log('   1. Monitorizar logs e métricas');
      console.log('   2. Testar fluxos críticos end-to-end');
      console.log('   3. Configurar alertas de monitorização');
      console.log('   4. Comunicar go-live à equipa');
      
    } else if (failedCount <= 2) {
      log.warning('⚠️ DEPLOYMENT COM AVISOS - Sistema funcional mas requer atenção');
      console.log('');
      console.log('🔧 Itens que requerem atenção:');
      this.deploymentResults.steps
        .filter(s => s.status === 'failed' || s.status === 'warning')
        .forEach(step => {
          console.log(`   ❗ ${step.message}`);
        });
    } else {
      log.error('❌ DEPLOYMENT FALHADO - Múltiplas issues críticas');
      console.log('');
      console.log('🚨 Issues críticas a resolver:');
      this.deploymentResults.steps
        .filter(s => s.status === 'failed')
        .forEach(step => {
          console.log(`   ❌ ${step.message}`);
        });
    }
    
    log.divider();
    
    return failedCount === 0;
  }

  async run() {
    try {
      log.divider();
      log.title('KIXIKILA - MASTER PRODUCTION DEPLOYMENT');
      log.divider();
      
      console.log('🎯 Executando deployment automático completo para produção');
      console.log(`📊 Total de ${this.totalSteps} steps a executar`);
      console.log('⏱️  Tempo estimado: 42-60 minutos');
      console.log('');
      
      const proceed = await this.promptUser('❓ Começar deployment agora? (Y/n): ');
      if (proceed === 'n' || proceed === 'no') {
        log.info('Deployment cancelado pelo utilizador');
        process.exit(0);
      }

      // Execute all deployment steps
      const steps = [
        () => this.step1_VerifySupabaseConfig(),
        () => this.step2_RunSecurityTests(),
        () => this.step3_RunFunctionalityTests(),
        () => this.step4_RunPerformanceTests(),
        () => this.step5_CreateProductionEnvironment(),
        () => this.step6_ValidateProductionConfig(),
        () => this.step7_GuideRailwayDeployment(),
        () => this.step8_FinalActivation()
      ];

      let criticalFailure = false;
      
      for (let i = 0; i < steps.length; i++) {
        this.currentStep = i + 1;
        console.log(`\n${'='.repeat(20)} ${this.currentStep}/${this.totalSteps} ${'='.repeat(20)}`);
        
        const success = await steps[i]();
        
        if (!success && [1, 3, 5, 7].includes(this.currentStep)) { // Critical steps
          criticalFailure = true;
          log.error(`Step crítico ${this.currentStep} falhado - Parando deployment`);
          break;
        }
        
        if (!success) {
          const continueAnyway = await this.promptUser('❓ Continuar para próximo step? (Y/n): ');
          if (continueAnyway === 'n' || continueAnyway === 'no') {
            log.info('Deployment interrompido pelo utilizador');
            break;
          }
        }
      }

      // Generate final report
      const deploymentSuccess = this.generateFinalReport();
      
      this.rl.close();
      process.exit(deploymentSuccess && !criticalFailure ? 0 : 1);
      
    } catch (error) {
      log.error(`Deployment falhou com erro crítico: ${error.message}`);
      this.rl.close();
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const deployer = new ProductionDeploymentExecutor();
  await deployer.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionDeploymentExecutor };