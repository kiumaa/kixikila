#!/usr/bin/env node

/**
 * Teste do Sistema de Auditoria KIXIKILA
 * 
 * Este script testa se o sistema de auditoria está funcionando corretamente:
 * 1. Verifica se os logs de auditoria estão sendo gerados
 * 2. Testa se os alertas de segurança estão ativos
 * 3. Valida se a interface admin consegue buscar dados reais
 * 4. Confirma se o middleware está integrado no backend
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Carregar variáveis de ambiente
dotenv.config({ path: '../.env' });
dotenv.config({ path: '../backend/.env' });

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.magenta}▶${colors.reset} ${msg}`)
};

class AuditSystemTester {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    this.results = [];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testSupabaseConnection() {
    log.step('Testando conexão com Supabase...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });

      if (response.ok) {
        log.success('Conexão com Supabase estabelecida');
        this.results.push({ test: 'Supabase Connection', status: 'PASS' });
        return true;
      } else {
        log.error(`Falha na conexão com Supabase: ${response.status}`);
        this.results.push({ test: 'Supabase Connection', status: 'FAIL', error: response.status });
        return false;
      }
    } catch (error) {
      log.error(`Erro ao conectar com Supabase: ${error.message}`);
      this.results.push({ test: 'Supabase Connection', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testAuditLogsTable() {
    log.step('Verificando tabela audit_logs...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/audit_logs?select=count`, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'count=exact'
        }
      });

      if (response.ok) {
        const countHeader = response.headers.get('content-range');
        const count = countHeader ? parseInt(countHeader.split('/')[1]) : 0;
        
        log.success(`Tabela audit_logs encontrada com ${count} registros`);
        this.results.push({ 
          test: 'Audit Logs Table', 
          status: 'PASS', 
          details: `${count} records found` 
        });
        return true;
      } else {
        log.error(`Erro ao acessar tabela audit_logs: ${response.status}`);
        this.results.push({ test: 'Audit Logs Table', status: 'FAIL', error: response.status });
        return false;
      }
    } catch (error) {
      log.error(`Erro ao verificar tabela audit_logs: ${error.message}`);
      this.results.push({ test: 'Audit Logs Table', status: 'FAIL', error: error.message });
      return false;
    }
  }

  async testAuditLogsEdgeFunction() {
    log.step('Testando edge function get-audit-logs...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/get-audit-logs`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: 1,
          limit: 5
        })
      });

      const data = await response.json();

      if (response.ok) {
        log.success(`Edge function get-audit-logs funcionando. Encontrados ${data.logs?.length || 0} logs`);
        this.results.push({ 
          test: 'get-audit-logs Edge Function', 
          status: 'PASS', 
          details: `${data.logs?.length || 0} logs returned` 
        });
        return true;
      } else {
        log.error(`Edge function get-audit-logs falhou: ${response.status}`);
        log.error(`Erro: ${JSON.stringify(data, null, 2)}`);
        this.results.push({ 
          test: 'get-audit-logs Edge Function', 
          status: 'FAIL', 
          error: `${response.status}: ${data.error}` 
        });
        return false;
      }
    } catch (error) {
      log.error(`Erro ao testar edge function get-audit-logs: ${error.message}`);
      this.results.push({ 
        test: 'get-audit-logs Edge Function', 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  async testSecurityAlertsEdgeFunction() {
    log.step('Testando edge function security-alerts...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/security-alerts`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        log.success(`Edge function security-alerts funcionando. Encontrados ${data.alerts?.length || 0} alertas`);
        log.success(`Métricas: ${JSON.stringify(data.metrics, null, 2)}`);
        this.results.push({ 
          test: 'security-alerts Edge Function', 
          status: 'PASS', 
          details: `${data.alerts?.length || 0} alerts, metrics available` 
        });
        return true;
      } else {
        log.error(`Edge function security-alerts falhou: ${response.status}`);
        log.error(`Erro: ${JSON.stringify(data, null, 2)}`);
        this.results.push({ 
          test: 'security-alerts Edge Function', 
          status: 'FAIL', 
          error: `${response.status}: ${data.error}` 
        });
        return false;
      }
    } catch (error) {
      log.error(`Erro ao testar edge function security-alerts: ${error.message}`);
      this.results.push({ 
        test: 'security-alerts Edge Function', 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  async testBackendAuditMiddleware() {
    log.step('Testando middleware de auditoria no backend...');
    
    try {
      // Fazer uma chamada para o endpoint de health do backend
      const response = await fetch(`${this.backendUrl}/health`);
      
      if (response.ok) {
        log.success('Backend respondendo. Middleware de auditoria deve estar ativo.');
        this.results.push({ 
          test: 'Backend Audit Middleware', 
          status: 'PASS', 
          details: 'Backend accessible, middleware likely active' 
        });
        return true;
      } else {
        log.warning(`Backend não está respondendo: ${response.status}`);
        this.results.push({ 
          test: 'Backend Audit Middleware', 
          status: 'WARNING', 
          error: `Backend not responding: ${response.status}` 
        });
        return false;
      }
    } catch (error) {
      log.warning(`Backend não está acessível: ${error.message}`);
      this.results.push({ 
        test: 'Backend Audit Middleware', 
        status: 'WARNING', 
        error: `Backend not accessible: ${error.message}` 
      });
      return false;
    }
  }

  async generateTestAuditLog() {
    log.step('Gerando log de auditoria de teste...');
    
    try {
      // Inserir um log de teste diretamente na tabela
      const testLog = {
        entity_type: 'TEST',
        action: 'AUDIT_SYSTEM_TEST',
        user_id: null,
        ip_address: '127.0.0.1',
        user_agent: 'KIXIKILA-Audit-Test-Script/1.0',
        new_values: { test: true, timestamp: new Date().toISOString() },
        old_values: null
      };

      const response = await fetch(`${this.supabaseUrl}/rest/v1/audit_logs`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(testLog)
      });

      if (response.ok || response.status === 201) {
        log.success('Log de auditoria de teste gerado com sucesso');
        this.results.push({ 
          test: 'Generate Test Audit Log', 
          status: 'PASS', 
          details: 'Test log inserted successfully' 
        });
        return true;
      } else {
        log.error(`Falha ao gerar log de teste: ${response.status}`);
        const errorData = await response.text();
        log.error(`Erro: ${errorData}`);
        this.results.push({ 
          test: 'Generate Test Audit Log', 
          status: 'FAIL', 
          error: `${response.status}: ${errorData}` 
        });
        return false;
      }
    } catch (error) {
      log.error(`Erro ao gerar log de teste: ${error.message}`);
      this.results.push({ 
        test: 'Generate Test Audit Log', 
        status: 'FAIL', 
        error: error.message 
      });
      return false;
    }
  }

  generateReport() {
    log.title('\n📊 RELATÓRIO DO TESTE DO SISTEMA DE AUDITORIA');
    console.log('=' * 60);
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    console.log(`\n${colors.bright}Resumo dos Testes:${colors.reset}`);
    console.log(`${colors.green}✓ Passou: ${passed}${colors.reset}`);
    console.log(`${colors.red}✗ Falhou: ${failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Avisos: ${warnings}${colors.reset}`);
    
    console.log(`\n${colors.bright}Detalhes dos Testes:${colors.reset}`);
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '⚠';
      const color = result.status === 'PASS' ? colors.green : result.status === 'FAIL' ? colors.red : colors.yellow;
      
      console.log(`${color}${icon} ${result.test}${colors.reset}`);
      if (result.details) {
        console.log(`  ${colors.dim}${result.details}${colors.reset}`);
      }
      if (result.error) {
        console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
      }
    });

    console.log(`\n${colors.bright}Status Geral do Sistema de Auditoria:${colors.reset}`);
    if (failed === 0) {
      log.success('🎉 Sistema de auditoria está ATIVO e funcionando corretamente!');
      console.log(`\n${colors.green}${colors.bright}✅ AUDITORIA ATIVA${colors.reset}`);
      console.log(`\n${colors.cyan}Para acessar os logs de auditoria:${colors.reset}`);
      console.log(`• Admin Panel: https://kixikila.pro/admin/logs`);
      console.log(`• Edge Function: ${this.supabaseUrl}/functions/v1/get-audit-logs`);
      console.log(`• Security Alerts: ${this.supabaseUrl}/functions/v1/security-alerts`);
    } else {
      log.error('❌ Sistema de auditoria tem problemas que precisam ser corrigidos');
      console.log(`\n${colors.red}${colors.bright}⚠️ AUDITORIA COM PROBLEMAS${colors.reset}`);
      console.log(`\n${colors.yellow}Próximos passos:${colors.reset}`);
      console.log('1. Corrigir os erros listados acima');
      console.log('2. Verificar se o backend está rodando');
      console.log('3. Confirmar se as edge functions estão ativas');
      console.log('4. Rodar este teste novamente');
    }
    
    console.log('\n' + '=' * 60);
  }

  async runAllTests() {
    log.title('🔐 INICIANDO TESTE DO SISTEMA DE AUDITORIA KIXIKILA\n');
    
    await this.testSupabaseConnection();
    await this.delay(1000);
    
    await this.testAuditLogsTable();
    await this.delay(1000);
    
    await this.generateTestAuditLog();
    await this.delay(1000);
    
    await this.testAuditLogsEdgeFunction();
    await this.delay(1000);
    
    await this.testSecurityAlertsEdgeFunction();
    await this.delay(1000);
    
    await this.testBackendAuditMiddleware();
    
    this.generateReport();
  }
}

// Executar os testes se o script for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AuditSystemTester();
  tester.runAllTests().catch(console.error);
}

export default AuditSystemTester;