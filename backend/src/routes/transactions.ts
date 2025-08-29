import { Router } from 'express';
import { logger } from '../utils/logger';
import { financialRateLimit, apiRateLimit } from '../middleware/rateLimiting';
import { auditFinancialOperation } from '../middleware/auditLogger';
import { supabase } from '../services/supabase';

const router = Router();

/**
 * @route GET /api/v1/transactions
 * @desc Get user transactions
 * @access Private
 */
router.get('/', apiRateLimit, async (req, res) => {
  try {
    const { limit = 50, offset = 0, type, status, group_id } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    logger.info('Getting transactions', { userId, limit, offset, type, status, group_id });
    
    // Build query
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Add filters
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (group_id) query = query.eq('group_id', group_id);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Database error getting transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get transactions'
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: count || 0
      }
    });
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/v1/transactions
 * @desc Create new transaction
 * @access Private
 */
router.post('/', financialRateLimit, auditFinancialOperation, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      type, 
      amount, 
      description, 
      group_id, 
      payment_method = 'stripe',
      payment_reference,
      metadata = {}
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!type || !amount || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, amount, description'
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    logger.info('Creating transaction', { 
      userId, 
      type, 
      amount, 
      description,
      group_id,
      payment_method 
    });

    // Create transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type,
        amount,
        description,
        group_id: group_id || null,
        payment_method,
        payment_reference,
        metadata,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error creating transaction:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction'
      });
    }

    res.status(201).json({
      success: true,
      data,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    logger.error('Error creating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/v1/transactions/:id
 * @desc Get transaction details
 * @access Private
 */
router.get('/:id', apiRateLimit, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    logger.info('Getting transaction details', { userId, transactionId: id });
    
    // Get transaction and verify ownership
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      logger.error('Database error getting transaction:', error);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error getting transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/v1/transactions/group/:groupId
 * @desc Get group transactions
 * @access Private
 */
router.get('/group/:groupId', apiRateLimit, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    logger.info('Getting group transactions', { userId, groupId });

    // Verify user is member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to group transactions'
      });
    }

    // Get group transactions
    const { data, error, count } = await supabase
      .from('transactions')
      .select(`
        *,
        users (full_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      logger.error('Database error getting group transactions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get group transactions'
      });
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: count || 0
      }
    });
  } catch (error) {
    logger.error('Error getting group transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/v1/transactions/:id/status
 * @desc Update transaction status
 * @access Private
 */
router.put('/:id/status', apiRateLimit, auditFinancialOperation, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction status'
      });
    }

    logger.info('Updating transaction status', { userId, transactionId: id, status });

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status,
        notes,
        processed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      logger.error('Database error updating transaction:', error);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found or update failed'
      });
    }

    res.json({
      success: true,
      data,
      message: 'Transaction status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;