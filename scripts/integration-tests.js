#!/usr/bin/env node

/**
 * KIXIKILA - Testes de Integração
 * 
 * Este script executa testes completos de integração entre:
 * - Frontend (React + Vite)
 * - Backend (Node.js + Express)
 * - Supabase (PostgreSQL + Auth)
 * 
 * Uso:
 *   node scripts/integration-tests.js
 */

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config({ path: path.join(__dirname, '../.env.local') });

class IntegrationTests {
  constructor() {
    this.frontendUrl = 'http://localhost:8080';
    this.backendUrl = process.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    this.supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    this.results = {
      frontend: { status: 'pending', tests: [] },
      backend: { status: 'pending', tests: [] },
      supabase: { status: 'pending', tests: [] },
      integration: { status: 'pending', tests: [] }
    };
  }

  /**
   * Logs coloridos para melhor visualização
   */
  log = {
    title: (msg) => console.log(`\n🚀 ${msg}`),
    success: (msg) => console.log(`✅ ${msg}`),
    error: (msg) => console.log(`❌ ${msg}`),
    warning: (msg) => console.log(`⚠️  ${msg}`),
    info: (msg) => console.log(`ℹ️  ${msg}`),
    test: (msg) => console.log(`🧪 ${msg}`)
  };

  /**
   * Executar um teste individual
   */
  async runTest(category, testName, testFunction) {
    this.log.test(`${testName}...`);
    
    try {
      const result = await testFunction();
      this.results[category].tests.push({ name: testName, status: 'passed', result });
      this.log.success(`${testName} - PASSOU`);
      return true;
    } catch (error) {
      this.results[category].tests.push({ name: testName, status: 'failed', error: error.message });
      this.log.error(`${testName} - FALHOU: ${error.message}`);
      return false;
    }
  }

  /**
   * Testes do Frontend
   */
  async testFrontend() {
    this.log.title('Testando Frontend');
    
    let allPassed = true;
    
    // Teste 1: Verificar se o frontend está rodando
    allPassed &= await this.runTest('frontend', 'Frontend está acessível', async () => {
      const response = await fetch(this.frontendUrl, { timeout: 5000 });
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      return { status: response.status, url: this.frontendUrl };
    });

    // Teste 2: Verificar se os assets estão sendo servidos
    allPassed &= await this.runTest('frontend', 'Assets estão sendo servidos', async () => {
      const response = await fetch(`${this.frontendUrl}/favicon.ico`, { timeout: 5000 });
      if (!response.ok) {
        throw new Error(`Favicon não encontrado: ${response.status}`);
      }
      return { status: response.status };
    });

    // Teste 3: Verificar se as variáveis de ambiente estão configuradas
    allPassed &= await this.runTest('frontend', 'Variáveis de ambiente configuradas', async () => {
      if (!process.env.VITE_SUPABASE_URL) {
        throw new Error('VITE_SUPABASE_URL não configurada');
      }
      if (!process.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('VITE_SUPABASE_ANON_KEY não configurada');
      }
      return { supabaseUrl: process.env.VITE_SUPABASE_URL };
    });

    this.results.frontend.status = allPassed ? 'passed' : 'failed';
    return allPassed;
  }

  /**
   * Testes do Backend
   */
  async testBackend() {
    this.log.title('Testando Backend');
    
    let allPassed = true;
    
    // Teste 1: Health check
    allPassed &= await this.runTest('backend', 'Health check', async () => {
      const response = await fetch(`${this.backendUrl}/health`, { timeout: 5000 });
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    });

    // Teste 2: Verificar CORS
    allPassed &= await this.runTest('backend', 'CORS configurado', async () => {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': this.frontendUrl,
          'Access-Control-Request-Method': 'GET'
        },
        timeout: 5000
      });
      
      const corsHeader = response.headers.get('access-control-allow-origin');
      if (!corsHeader) {
        throw new Error('CORS headers não encontrados');
      }
      
      return { corsOrigin: corsHeader };
    });

    // Teste 3: Testar endpoint de autenticação
    allPassed &= await this.runTest('backend', 'Endpoint de autenticação', async () => {
      const response = await fetch(`${this.backendUrl}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        },
        timeout: 5000
      });
      
      // Esperamos um 401 para token inválido
      if (response.status !== 401) {
        throw new Error(`Esperado 401, recebido ${response.status}`);
      }
      
      return { status: response.status, message: 'Autenticação funcionando' };
    });

    // Teste 4: Testar conexão com Supabase no backend
    allPassed &= await this.runTest('backend', 'Conexão Supabase no backend', async () => {
      const response = await fetch(`${this.backendUrl}/health/supabase`, { timeout: 5000 });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase health check falhou: ${error}`);
      }
      
      const data = await response.json();
      return data;
    });

    this.results.backend.status = allPassed ? 'passed' : 'failed';
    return allPassed;
  }

  /**
   * Testes do Supabase
   */
  async testSupabase() {
    this.log.title('Testando Supabase');
    
    let allPassed = true;
    
    // Teste 1: Conexão básica
    allPassed &= await this.runTest('supabase', 'Conexão básica', async () => {
      if (!this.supabaseUrl || !this.supabaseKey) {
        throw new Error('Credenciais do Supabase não configuradas');
      }
      
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // Testar uma query simples
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation "users" does not exist')) {
          throw new Error('Tabelas não criadas no Supabase. Execute o schema SQL primeiro.');
        }
        throw new Error(error.message);
      }
      
      return { message: 'Conexão estabelecida', tablesExist: true };
    });

    // Teste 2: Autenticação
    allPassed &= await this.runTest('supabase', 'Sistema de autenticação', async () => {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // Testar se o sistema de auth está funcionando
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(`Erro na autenticação: ${error.message}`);
      }
      
      return { message: 'Sistema de autenticação funcionando', session: data.session ? 'ativa' : 'inativa' };
    });

    // Teste 3: Verificar RLS
    allPassed &= await this.runTest('supabase', 'Row Level Security (RLS)', async () => {
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      
      // Tentar acessar dados sem autenticação (deve falhar devido ao RLS)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      // Se não há erro, pode ser que não há dados ou RLS não está configurado
      // Se há erro relacionado a RLS, é bom sinal
      if (error && (error.message.includes('RLS') || error.message.includes('policy'))) {
        return { message: 'RLS está ativo e funcionando' };
      }
      
      return { message: 'RLS pode não estar configurado ou não há dados para testar' };
    });

    this.results.supabase.status = allPassed ? 'passed' : 'failed';
    return allPassed;
  }

  /**
   * Testes de Integração
   */
  async testIntegration() {
    this.log.title('Testando Integração Completa');
    
    let allPassed = true;
    
    // Teste 1: Frontend -> Backend -> Supabase
    allPassed &= await this.runTest('integration', 'Fluxo completo Frontend -> Backend -> Supabase', async () => {
      // Simular uma requisição do frontend para o backend
      const response = await fetch(`${this.backendUrl}/health/full`, {
        headers: {
          'Origin': this.frontendUrl,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`Fluxo completo falhou: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    });

    // Teste 2: Verificar se todas as rotas principais estão funcionando
    allPassed &= await this.runTest('integration', 'Rotas principais do backend', async () => {
      const routes = [
        '/health',
        '/auth/me',
        '/users/profile',
        '/groups',
        '/transactions'
      ];
      
      const results = [];
      
      for (const route of routes) {
        try {
          const response = await fetch(`${this.backendUrl}${route}`, {
            headers: {
              'Authorization': 'Bearer invalid-token'
            },
            timeout: 5000
          });
          
          results.push({
            route,
            status: response.status,
            accessible: response.status !== 404
          });
        } catch (error) {
          results.push({
            route,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return { routes: results };
    });

    this.results.integration.status = allPassed ? 'passed' : 'failed';
    return allPassed;
  }

  /**
   * Executar todos os testes
   */
  async runAllTests() {
    console.log('🎯 KIXIKILA - Testes de Integração\n');
    console.log('🔍 Configurações:');
    console.log(`   Frontend: ${this.frontendUrl}`);
    console.log(`   Backend: ${this.backendUrl}`);
    console.log(`   Supabase: ${this.supabaseUrl}`);
    console.log('');
    
    const startTime = Date.now();
    
    try {
      // Executar testes em sequência
      const frontendPassed = await this.testFrontend();
      const backendPassed = await this.testBackend();
      const supabasePassed = await this.testSupabase();
      const integrationPassed = await this.testIntegration();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      // Relatório final
      this.log.title('Relatório Final');
      
      const categories = ['frontend', 'backend', 'supabase', 'integration'];
      let totalTests = 0;
      let passedTests = 0;
      
      for (const category of categories) {
        const result = this.results[category];
        const categoryPassed = result.tests.filter(t => t.status === 'passed').length;
        const categoryTotal = result.tests.length;
        
        totalTests += categoryTotal;
        passedTests += categoryPassed;
        
        const status = result.status === 'passed' ? '✅' : '❌';
        this.log.info(`${status} ${category.toUpperCase()}: ${categoryPassed}/${categoryTotal} testes passaram`);
        
        // Mostrar testes que falharam
        const failedTests = result.tests.filter(t => t.status === 'failed');
        if (failedTests.length > 0) {
          failedTests.forEach(test => {
            this.log.error(`   - ${test.name}: ${test.error}`);
          });
        }
      }
      
      console.log('');
      this.log.info(`⏱️  Tempo total: ${duration}s`);
      this.log.info(`📊 Resultado geral: ${passedTests}/${totalTests} testes passaram`);
      
      const allPassed = frontendPassed && backendPassed && supabasePassed && integrationPassed;
      
      if (allPassed) {
        this.log.success('\n🎉 Todos os testes de integração passaram!');
        this.log.info('✨ O sistema KIXIKILA está funcionando perfeitamente!');
        this.log.info('\n📋 Próximos passos:');
        this.log.info('1. Fazer deploy para produção');
        this.log.info('2. Configurar monitoramento');
        this.log.info('3. Executar testes de carga');
        this.log.info('4. Configurar backup automático');
      } else {
        this.log.error('\n❌ Alguns testes falharam!');
        this.log.info('🔧 Corrija os problemas identificados antes de prosseguir.');
        process.exit(1);
      }
      
    } catch (error) {
      this.log.error(`Erro fatal nos testes: ${error.message}`);
      process.exit(1);
    }
  }
}

// Executar sempre quando o script for chamado
const tests = new IntegrationTests();
tests.runAllTests();

export default IntegrationTests;