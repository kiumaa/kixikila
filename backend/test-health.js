import { healthCheck } from './src/scripts/healthCheck.ts';

async function test() {
  console.log('Starting health check test...');
  try {
    const result = await healthCheck();
    console.log('Health check result:', result);
  } catch (error) {
    console.error('Health check error:', error);
  }
}

test();