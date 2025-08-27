import { Router } from 'express';
import { testConnection } from '../services/supabase.ts';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';

const router = Router();

/**
 * @route GET /api/v1/health
 * @desc Basic health check
 * @access Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: config.apiVersion
  });
});

/**
 * @route GET /api/v1/health/supabase
 * @desc Supabase connection health check
 * @access Public
 */
router.get('/supabase', async (req, res) => {
  try {
    logger.info('Testing Supabase connection...');
    const isConnected = await testConnection();
    
    if (isConnected) {
      res.status(200).json({
        status: 'OK',
        service: 'supabase',
        connected: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'ERROR',
        service: 'supabase',
        connected: false,
        error: 'Connection test failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Supabase health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      service: 'supabase',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/v1/health/full
 * @desc Complete system health check
 * @access Public
 */
router.get('/full', async (req, res) => {
  try {
    const results = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: config.apiVersion,
      services: {
        supabase: { status: 'unknown', connected: false }
      }
    };

    // Test Supabase connection
    try {
      const supabaseConnected = await testConnection();
      results.services.supabase = {
        status: supabaseConnected ? 'OK' : 'ERROR',
        connected: supabaseConnected
      };
    } catch (error) {
      results.services.supabase = {
        status: 'ERROR',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Determine overall status
    const allServicesOk = Object.values(results.services).every(
      service => service.status === 'OK'
    );
    
    results.status = allServicesOk ? 'OK' : 'DEGRADED';
    
    const statusCode = allServicesOk ? 200 : 503;
    res.status(statusCode).json(results);
    
  } catch (error) {
    logger.error('Full health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;