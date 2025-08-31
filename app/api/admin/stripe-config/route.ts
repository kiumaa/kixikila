import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const stripeConfigSchema = z.object({
  publishable_key: z.string().min(1),
  secret_key: z.string().min(1),
  webhook_secret: z.string().min(1),
  webhook_url: z.string().url().optional(),
  currency: z.string().default('EUR'),
  test_mode: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { data: configs, error } = await supabase
      .from('system_configurations')
      .select('config_key, config_value')
      .eq('config_type', 'stripe');

    if (error) {
      throw error;
    }

    // Transform to expected format (mask sensitive data)
    const stripeConfig = configs?.reduce((acc, config) => {
      if (config.config_key === 'secret_key' || config.config_key === 'webhook_secret') {
        acc[config.config_key] = config.config_value ? '****' : '';
      } else {
        acc[config.config_key] = config.config_value;
      }
      return acc;
    }, {} as any) || {};

    return createSuccessResponse(stripeConfig);

  } catch (error) {
    console.error('Get Stripe config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const config = stripeConfigSchema.parse(body);

    // Update Stripe configuration
    for (const [key, value] of Object.entries(config)) {
      await supabase
        .from('system_configurations')
        .upsert({
          config_key: key,
          config_value: value,
          config_type: 'stripe',
          is_sensitive: ['secret_key', 'webhook_secret'].includes(key)
        });
    }

    return createSuccessResponse(null, 'Stripe configuration updated successfully');

  } catch (error) {
    console.error('Update Stripe config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}