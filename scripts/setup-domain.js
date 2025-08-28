#!/usr/bin/env node

/**
 * KIXIKILA Domain Setup Script
 * 
 * Este script verifica a configuração de DNS e a conectividade
 * dos domínios de produção.
 */

const https = require('https');
const http = require('http');
const dns = require('dns');
const { promisify } = require('util');

const resolveDns = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

console.log('🌐 KIXIKILA - Verificação de Configuração de Domínio');
console.log('==================================================\n');

// Configurações de domínio
const DOMAINS = {
  frontend: {
    primary: 'kixikila.pro',
    www: 'www.kixikila.pro',
    expectedIP: '185.158.133.1'
  },
  backend: {
    api: 'api.kixikila.pro',
    expectedTarget: '.railway.app' // Sufixo esperado
  }
};

// Verificar resolução DNS
async function checkDNSResolution(domain, expectedIP = null) {
  try {
    console.log(`🔍 Verificando DNS para: ${domain}`);
    
    // Tentar resolução A record
    try {
      const addresses = await resolveDns(domain);
      console.log(`   A Record: ${addresses.join(', ')}`);
      
      if (expectedIP && addresses.includes(expectedIP)) {
        console.log(`   ✅ IP correto (${expectedIP})`);
        return { status: 'ok', type: 'A', addresses };
      } else if (expectedIP) {
        console.log(`   ⚠️  IP esperado: ${expectedIP}`);
        return { status: 'incorrect', type: 'A', addresses, expected: expectedIP };
      }
      
      return { status: 'ok', type: 'A', addresses };
    } catch (error) {
      // Se A record falhar, tentar CNAME
      try {
        const cnames = await resolveCname(domain);
        console.log(`   CNAME: ${cnames.join(', ')}`);
        return { status: 'ok', type: 'CNAME', cnames };
      } catch (cnameError) {
        console.log(`   ❌ DNS não resolvido: ${error.message}`);
        return { status: 'failed', error: error.message };
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro na resolução DNS: ${error.message}`);
    return { status: 'error', error: error.message };
  }
}

// Verificar conectividade HTTP/HTTPS
async function checkHTTPConnectivity(domain, path = '/', expectedStatus = [200, 301, 302]) {
  return new Promise((resolve) => {
    console.log(`🌐 Testando conectividade: https://${domain}${path}`);
    
    const req = https.get(`https://${domain}${path}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'KIXIKILA-Health-Check/1.0'
      }
    }, (res) => {
      const isSuccess = expectedStatus.includes(res.statusCode);
      const status = isSuccess ? '✅' : '⚠️';
      
      console.log(`   ${status} Status: ${res.statusCode}`);
      
      resolve({
        status: isSuccess ? 'ok' : 'warning',
        statusCode: res.statusCode,
        headers: res.headers
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Erro de conectividade: ${error.message}`);
      resolve({ status: 'failed', error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`   ❌ Timeout na conexão`);
      resolve({ status: 'timeout' });
    });
  });
}

// Verificar certificado SSL
function checkSSLCertificate(domain) {
  return new Promise((resolve) => {
    console.log(`🔒 Verificando certificado SSL: ${domain}`);
    
    const req = https.get(`https://${domain}`, {
      timeout: 10000,
      checkServerIdentity: () => undefined // Não verificar identidade para debug
    }, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (cert && Object.keys(cert).length > 0) {
        console.log(`   ✅ Certificado válido`);
        console.log(`   📅 Válido até: ${cert.valid_to}`);
        console.log(`   🏢 Emissor: ${cert.issuer.O || 'N/A'}`);
        
        resolve({
          status: 'ok',
          validTo: cert.valid_to,
          issuer: cert.issuer
        });
      } else {
        console.log(`   ❌ Certificado não encontrado`);
        resolve({ status: 'no_cert' });
      }
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Erro SSL: ${error.message}`);
      resolve({ status: 'failed', error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`   ❌ Timeout na verificação SSL`);
      resolve({ status: 'timeout' });
    });
  });
}

// Verificar health endpoint da API
async function checkHealthEndpoint() {
  const domain = DOMAINS.backend.api;
  const path = '/api/v1/health';
  
  console.log(`🏥 Verificando health endpoint...`);
  
  const result = await checkHTTPConnectivity(domain, path, [200]);
  
  if (result.status === 'ok') {
    console.log(`   ✅ API funcionando corretamente`);
  } else {
    console.log(`   ❌ API não está respondendo`);
  }
  
  return result;
}

// Relatório final
function generateReport(results) {
  console.log('\n📊 RELATÓRIO DE CONFIGURAÇÃO DE DOMÍNIO');
  console.log('=======================================\n');
  
  let allOk = true;
  
  // Frontend
  console.log('🖥️  FRONTEND:');
  if (results.frontend.dns.status === 'ok') {
    console.log(`   ✅ DNS configurado corretamente`);
  } else {
    console.log(`   ❌ DNS precisa ser configurado`);
    allOk = false;
  }
  
  if (results.frontend.ssl.status === 'ok') {
    console.log(`   ✅ SSL funcionando`);
  } else {
    console.log(`   ❌ SSL precisa ser configurado`);
    allOk = false;
  }
  
  // Backend
  console.log('\n🖥️  BACKEND:');
  if (results.backend.dns.status === 'ok') {
    console.log(`   ✅ DNS configurado`);
  } else {
    console.log(`   ❌ DNS precisa ser configurado`);
    allOk = false;
  }
  
  if (results.backend.health.status === 'ok') {
    console.log(`   ✅ API funcionando`);
  } else {
    console.log(`   ❌ API não está funcionando`);
    allOk = false;
  }
  
  // Status geral
  console.log('\n🎯 STATUS GERAL:');
  if (allOk) {
    console.log('   ✅ Todos os serviços estão funcionando corretamente!');
    console.log('   🚀 KIXIKILA está pronto para produção');
  } else {
    console.log('   ⚠️  Algumas configurações ainda precisam ser ajustadas');
    console.log('   📚 Consulte PRODUCTION_DEPLOYMENT_CHECKLIST.md');
  }
  
  return allOk;
}

// Função principal
async function main() {
  try {
    const results = {
      frontend: {},
      backend: {}
    };
    
    // Verificar frontend
    console.log('🔍 VERIFICANDO FRONTEND...\n');
    results.frontend.dns = await checkDNSResolution(
      DOMAINS.frontend.primary, 
      DOMAINS.frontend.expectedIP
    );
    results.frontend.connectivity = await checkHTTPConnectivity(DOMAINS.frontend.primary);
    results.frontend.ssl = await checkSSLCertificate(DOMAINS.frontend.primary);
    
    // Verificar backend
    console.log('\n🔍 VERIFICANDO BACKEND...\n');
    results.backend.dns = await checkDNSResolution(DOMAINS.backend.api);
    results.backend.connectivity = await checkHTTPConnectivity(DOMAINS.backend.api, '/api/v1/health');
    results.backend.health = await checkHealthEndpoint();
    
    // Gerar relatório
    const allOk = generateReport(results);
    
    // Instruções finais
    if (!allOk) {
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Configure os registros DNS conforme instruções');
      console.log('2. Aguarde propagação (24-48h)');
      console.log('3. Execute este script novamente para verificar');
      console.log('4. Configure SSL se necessário');
    }
    
    process.exit(allOk ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Erro durante verificação:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main };