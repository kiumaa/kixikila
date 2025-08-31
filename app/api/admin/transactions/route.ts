import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const getTransactionsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  user_id: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  group_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    
    const url = new URL(request.url);
    const { 
      page = '1', 
      limit = '50', 
      user_id, 
      type, 
      status, 
      group_id,
      date_from,
      date_to 
    } = getTransactionsSchema.parse(Object.fromEntries(url.searchParams));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('transactions')
      .select(`
        *,
        users (
          full_name,
          email
        ),
        groups (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    // Apply filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (group_id) {
      query = query.eq('group_id', group_id);
    }
    if (date_from) {
      query = query.gte('created_at', date_from);
    }
    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    // Calculate summary stats
    const { data: stats } = await supabase
      .from('transactions')
      .select('type, status, amount')
      .then(({ data }) => {
        if (!data) return { data: null };
        
        const summary = data.reduce((acc, tx) => {
          acc.totalAmount += Number(tx.amount);
          acc.totalCount += 1;
          acc.byType[tx.type] = (acc.byType[tx.type] || 0) + 1;
          acc.byStatus[tx.status] = (acc.byStatus[tx.status] || 0) + 1;
          return acc;
        }, {
          totalAmount: 0,
          totalCount: 0,
          byType: {} as Record<string, number>,
          byStatus: {} as Record<string, number>
        });
        
        return { data: summary };
      });

    return createSuccessResponse({
      transactions: transactions || [],
      summary: stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Admin get transactions error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}