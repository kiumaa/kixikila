#!/usr/bin/env node

/**
 * Comprehensive Signup/OTP Flow Test for KIXIKILA
 * Tests the complete user registration and phone verification process
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = 'https://hkesrohuaurcyonpktyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZXNyb2h1YXVyY3lvbnBrdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjIzMjksImV4cCI6MjA3MTg5ODMyOX0.SNDuFuzRerlL4qmlKGWFm8cf4UH21MmsbhxV4B8SVcg';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test utilities
const logInfo = (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`);
const logSuccess = (msg) => console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`);
const logError = (msg) => console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`);
const logWarning = (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`);
const logTitle = (msg) => console.log(`\n\x1b[1m\x1b[35m=== ${msg} ===\x1b[0m`);

// Test data generator
const generateTestData = () => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  
  return {
    fullName: `Teste Usuario ${randomId}`,
    phone: `+351${timestamp.toString().slice(-9)}`, // Portuguese format
    email: `teste${timestamp}@kixikila.test`,
    validPortuguesePhone: '+351912345678',
    invalidPhones: [
      '912345678', // Missing country code
      '+351abc123456', // Invalid characters
      '+351912345', // Too short
      '+44123456789', // Wrong country code
      '', // Empty
      null, // Null
    ]
  };
};

// Sleep utility
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test classes
class SignupFlowTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.testData = generateTestData();
    this.testUserId = null;
    this.lastOtpCode = null;
  }

  // Add test result
  addResult(test, passed, message, data = null) {
    this.testResults.details.push({
      test,
      passed,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.testResults.passed++;
      logSuccess(`${test}: ${message}`);
    } else {
      this.testResults.failed++;
      logError(`${test}: ${message}`);
    }
  }

  // Add warning
  addWarning(test, message, data = null) {
    this.testResults.warnings++;
    this.testResults.details.push({
      test,
      passed: null,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    logWarning(`${test}: ${message}`);
  }

  // Test 1: Phone Validation
  async testPhoneValidation() {
    logTitle('TESTE 1: Validação de Números de Telefone');

    // Test valid Portuguese phone
    const isValidPortuguese = this.validatePortuguesePhone(this.testData.validPortuguesePhone);
    this.addResult(
      'Phone Validation - Valid Portuguese',
      isValidPortuguese,
      `${this.testData.validPortuguesePhone} ${isValidPortuguese ? 'é válido' : 'é inválido'}`
    );

    // Test invalid phones
    for (const invalidPhone of this.testData.invalidPhones) {
      const isValid = this.validatePortuguesePhone(invalidPhone);
      this.addResult(
        'Phone Validation - Invalid Phone',
        !isValid,
        `${invalidPhone || 'null'} ${isValid ? 'incorretamente validado' : 'corretamente rejeitado'}`
      );
    }
  }

  // Phone validation helper
  validatePortuguesePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Portuguese phone format: +351 followed by 9 digits
    const portuguesePhoneRegex = /^\+351[0-9]{9}$/;
    return portuguesePhoneRegex.test(phone);
  }

  // Test 2: OTP Sending
  async testOtpSending() {
    logTitle('TESTE 2: Envio de OTP via SMS');

    try {
      // Test valid phone number
      logInfo(`Enviando OTP para: ${this.testData.phone}`);
      
      const { data, error } = await supabase.functions.invoke('send-otp-sms', {
        body: {
          phone: this.testData.phone,
          type: 'phone_verification'
        }
      });

      if (error) {
        this.addResult('OTP Sending', false, `Erro no envio: ${error.message}`, { error });
        return false;
      }

      if (data?.success) {
        this.addResult('OTP Sending', true, 'OTP enviado com sucesso', data);
        
        // Wait and check if OTP was stored
        await sleep(2000);
        const storedOtp = await this.getStoredOtp(this.testData.phone);
        
        if (storedOtp) {
          this.addResult('OTP Storage', true, `OTP armazenado na BD: ${storedOtp.code}`, storedOtp);
          this.lastOtpCode = storedOtp.code;
        } else {
          this.addResult('OTP Storage', false, 'OTP não encontrado na BD');
        }
        
        return true;
      } else {
        this.addResult('OTP Sending', false, `Falha no envio: ${data?.error || 'Erro desconhecido'}`, data);
        return false;
      }
    } catch (error) {
      this.addResult('OTP Sending', false, `Exceção: ${error.message}`, { error: error.message });
      return false;
    }
  }

  // Test 3: OTP Verification
  async testOtpVerification() {
    logTitle('TESTE 3: Verificação de OTP');

    if (!this.lastOtpCode) {
      this.addWarning('OTP Verification', 'Nenhum OTP disponível para teste');
      return;
    }

    // Test correct OTP
    await this.testCorrectOtp();
    
    // Test incorrect OTP
    await this.testIncorrectOtp();
    
    // Test expired OTP (if we can simulate it)
    await this.testExpiredOtp();
  }

  async testCorrectOtp() {
    try {
      logInfo(`Testando OTP correto: ${this.lastOtpCode}`);
      
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: this.testData.phone,
          token: this.lastOtpCode,
          type: 'phone_verification'
        }
      });

      if (error) {
        this.addResult('OTP Verification - Correct', false, `Erro: ${error.message}`, { error });
        return;
      }

      if (data?.success) {
        this.addResult('OTP Verification - Correct', true, 'OTP correto verificado com sucesso', data);
        
        // Check if user was created/updated
        if (data.data?.user) {
          this.testUserId = data.data.user.id;
          this.addResult('User Creation', true, `Usuário criado/atualizado: ${data.data.user.id}`, data.data.user);
        }
      } else {
        this.addResult('OTP Verification - Correct', false, `Falha na verificação: ${data?.error}`, data);
      }
    } catch (error) {
      this.addResult('OTP Verification - Correct', false, `Exceção: ${error.message}`, { error: error.message });
    }
  }

  async testIncorrectOtp() {
    try {
      const wrongOtp = '000000';
      logInfo(`Testando OTP incorreto: ${wrongOtp}`);
      
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone: this.testData.phone,
          token: wrongOtp,
          type: 'phone_verification'
        }
      });

      // We expect this to fail
      if (data?.success === false) {
        this.addResult('OTP Verification - Incorrect', true, 'OTP incorreto corretamente rejeitado', data);
      } else {
        this.addResult('OTP Verification - Incorrect', false, 'OTP incorreto foi aceito (FALHA DE SEGURANÇA)', data);
      }
    } catch (error) {
      this.addResult('OTP Verification - Incorrect', true, `OTP rejeitado com exceção: ${error.message}`);
    }
  }

  async testExpiredOtp() {
    try {
      // Force expire an OTP by updating the database
      if (this.testUserId) {
        const { error } = await supabaseAdmin
          .from('otp_codes')
          .update({ expires_at: new Date(Date.now() - 60000).toISOString() })
          .match({ user_id: this.testUserId, status: 'verified' });

        if (!error) {
          // Try to verify with expired OTP
          const { data } = await supabase.functions.invoke('verify-otp', {
            body: {
              phone: this.testData.phone,
              token: this.lastOtpCode,
              type: 'phone_verification'
            }
          });

          if (data?.success === false) {
            this.addResult('OTP Verification - Expired', true, 'OTP expirado corretamente rejeitado', data);
          } else {
            this.addResult('OTP Verification - Expired', false, 'OTP expirado foi aceito (FALHA DE SEGURANÇA)', data);
          }
        }
      }
    } catch (error) {
      this.addWarning('OTP Verification - Expired', `Não foi possível testar OTP expirado: ${error.message}`);
    }
  }

  // Test 4: Rate Limiting
  async testRateLimiting() {
    logTitle('TESTE 4: Rate Limiting');

    const testPhone = '+351999888777';
    const maxAttempts = 6; // Should trigger rate limit

    logInfo(`Testando rate limiting com ${maxAttempts} tentativas para ${testPhone}`);

    let successCount = 0;
    let rateLimitTriggered = false;

    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const { data, error } = await supabase.functions.invoke('send-otp-sms', {
          body: {
            phone: testPhone,
            type: 'phone_verification'
          }
        });

        if (data?.success) {
          successCount++;
          logInfo(`Tentativa ${i}: Sucesso`);
        } else if (data?.error?.includes('rate') || data?.error?.includes('limite')) {
          rateLimitTriggered = true;
          logInfo(`Tentativa ${i}: Rate limit ativado`);
          break;
        } else {
          logInfo(`Tentativa ${i}: Erro - ${data?.error}`);
        }

        // Small delay between attempts
        await sleep(1000);
      } catch (error) {
        logInfo(`Tentativa ${i}: Exceção - ${error.message}`);
      }
    }

    if (rateLimitTriggered) {
      this.addResult('Rate Limiting', true, `Rate limiting ativado após ${successCount} tentativas`, {
        successCount,
        totalAttempts: maxAttempts
      });
    } else if (successCount >= maxAttempts) {
      this.addResult('Rate Limiting', false, `Rate limiting NÃO ativado após ${successCount} tentativas (FALHA DE SEGURANÇA)`, {
        successCount,
        totalAttempts: maxAttempts
      });
    } else {
      this.addWarning('Rate Limiting', `Teste inconclusivo: ${successCount} sucessos de ${maxAttempts} tentativas`);
    }
  }

  // Test 5: Database Integrity
  async testDatabaseIntegrity() {
    logTitle('TESTE 5: Integridade da Base de Dados');

    // Check OTP codes table
    await this.checkOtpCodesTable();
    
    // Check users table
    await this.checkUsersTable();
    
    // Check OTP expiry
    await this.checkOtpExpiry();
  }

  async checkOtpCodesTable() {
    try {
      const { data, error } = await supabaseAdmin
        .from('otp_codes')
        .select('id, code, type, status, expires_at, created_at, attempts')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        this.addResult('OTP Codes Table', false, `Erro ao acessar tabela: ${error.message}`, { error });
        return;
      }

      this.addResult('OTP Codes Table', true, `Tabela acessível com ${data.length} registros recentes`, {
        count: data.length,
        sample: data.slice(0, 3)
      });

      // Check for long expiry times (security issue)
      const longExpiryOtps = data.filter(otp => {
        const expiryTime = new Date(otp.expires_at);
        const createdTime = new Date(otp.created_at);
        const diffMinutes = (expiryTime - createdTime) / (1000 * 60);
        return diffMinutes > 15; // More than 15 minutes
      });

      if (longExpiryOtps.length > 0) {
        this.addResult('OTP Expiry Security', false, `${longExpiryOtps.length} OTPs com expiração muito longa (>15 min)`, {
          longExpiryOtps: longExpiryOtps.map(otp => ({
            id: otp.id,
            expires_at: otp.expires_at,
            created_at: otp.created_at
          }))
        });
      } else {
        this.addResult('OTP Expiry Security', true, 'Todos os OTPs têm expiração adequada (≤15 min)');
      }

    } catch (error) {
      this.addResult('OTP Codes Table', false, `Exceção: ${error.message}`, { error: error.message });
    }
  }

  async checkUsersTable() {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, phone, phone_verified', { count: 'exact' })
        .limit(5);

      if (error) {
        this.addResult('Users Table', false, `Erro ao acessar tabela: ${error.message}`, { error });
        return;
      }

      this.addResult('Users Table', true, `Tabela acessível com ${count} usuários total`, {
        totalUsers: count,
        sample: data
      });

      // Check for users without phone verification
      const unverifiedPhones = data.filter(user => user.phone && !user.phone_verified);
      if (unverifiedPhones.length > 0) {
        this.addWarning('Phone Verification', `${unverifiedPhones.length} usuários com telefone não verificado`);
      }

    } catch (error) {
      this.addResult('Users Table', false, `Exceção: ${error.message}`, { error: error.message });
    }
  }

  async checkOtpExpiry() {
    try {
      const { data, error } = await supabaseAdmin
        .from('otp_codes')
        .select('id, expires_at, status')
        .lt('expires_at', new Date().toISOString())
        .eq('status', 'pending')
        .limit(10);

      if (error) {
        this.addResult('OTP Cleanup', false, `Erro ao verificar OTPs expirados: ${error.message}`, { error });
        return;
      }

      if (data.length > 0) {
        this.addWarning('OTP Cleanup', `${data.length} OTPs expirados ainda marcados como 'pending'`, {
          expiredOtps: data.length
        });
      } else {
        this.addResult('OTP Cleanup', true, 'Nenhum OTP expirado com status pending encontrado');
      }

    } catch (error) {
      this.addResult('OTP Cleanup', false, `Exceção: ${error.message}`, { error: error.message });
    }
  }

  // Helper: Get stored OTP
  async getStoredOtp(phone) {
    try {
      const { data, error } = await supabaseAdmin
        .from('otp_codes')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Error getting stored OTP:', error);
      return null;
    }
  }

  // Cleanup test data
  async cleanup() {
    logTitle('LIMPEZA DE DADOS DE TESTE');

    if (this.testUserId) {
      try {
        // Delete test OTP codes
        await supabaseAdmin
          .from('otp_codes')
          .delete()
          .eq('user_id', this.testUserId);

        // Delete test user
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', this.testUserId);

        logInfo('Dados de teste limpos com sucesso');
      } catch (error) {
        logWarning(`Erro na limpeza: ${error.message}`);
      }
    }
  }

  // Generate test report
  generateReport() {
    logTitle('RELATÓRIO FINAL DO TESTE');

    const { passed, failed, warnings, details } = this.testResults;
    const total = passed + failed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

    console.log(`\n📊 ESTATÍSTICAS:`);
    console.log(`   ✅ Testes aprovados: ${passed}`);
    console.log(`   ❌ Testes falhados: ${failed}`);
    console.log(`   ⚠️  Avisos: ${warnings}`);
    console.log(`   📈 Taxa de sucesso: ${successRate}%`);

    if (failed > 0) {
      console.log(`\n🔍 TESTES FALHADOS:`);
      details
        .filter(d => d.passed === false)
        .forEach(d => {
          console.log(`   • ${d.test}: ${d.message}`);
        });
    }

    if (warnings > 0) {
      console.log(`\n⚠️  AVISOS:`);
      details
        .filter(d => d.passed === null)
        .forEach(d => {
          console.log(`   • ${d.test}: ${d.message}`);
        });
    }

    console.log(`\n🎯 RECOMENDAÇÕES:`);
    
    if (failed === 0) {
      console.log('   ✨ Sistema de signup está funcionando corretamente!');
    } else {
      console.log('   🔧 Corrigir os testes falhados antes de produção');
    }
    
    if (warnings > 0) {
      console.log('   🔍 Verificar os avisos para otimizações');
    }

    console.log('   📱 Testar manualmente no frontend');
    console.log('   🌐 Testar em ambiente de produção');
    
    return {
      success: failed === 0,
      passed,
      failed,
      warnings,
      successRate: parseFloat(successRate)
    };
  }

  // Run all tests
  async runAllTests() {
    try {
      logTitle('INICIANDO TESTE COMPLETO DO SIGNUP/OTP');
      
      await this.testPhoneValidation();
      await this.testOtpSending();
      await this.testOtpVerification();
      await this.testRateLimiting();
      await this.testDatabaseIntegrity();
      
      return this.generateReport();
    } catch (error) {
      logError(`Erro geral no teste: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      await this.cleanup();
    }
  }
}

// Main execution
async function main() {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
  }

  const tester = new SignupFlowTester();
  const result = await tester.runAllTests();
  
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logError(`Falha na execução: ${error.message}`);
    process.exit(1);
  });
}

export { SignupFlowTester };