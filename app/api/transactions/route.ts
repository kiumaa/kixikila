import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const createTransactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal', 'group_contribution', 'group_payout', 'fee']),
  amount: z.number().positive(),
  description: z.string().min(1),
  group_id: z.string().uuid().optional(),
  payment_method: z.enum(['stripe', 'bank_transfer', 'cash']).default('stripe'),
  metadata: z.record(z.any()).optional()
});

const getTransactionsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  group_id: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const url = new URL(request.url);
    const { page = '1', limit = '20', type, status, group_id } = 
      getTransactionsSchema.parse(Object.fromEntries(url.searchParams));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        groups (
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (group_id) {
      query = query.eq('group_id', group_id);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    return createSuccessResponse({
      transactions: transactions || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const transactionData = createTransactionSchema.parse(body);

    // Generate reference
    const reference = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        ...transactionData,
        user_id: user.id,
        reference,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(transaction, 'Transaction created successfully');

  } catch (error) {
    console.error('Create transaction error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}