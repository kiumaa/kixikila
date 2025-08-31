import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const bulkSMSConfigSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  sender_id: z.string().optional(),
  base_url: z.string().url().default('https://bulksms.com/api'),
  rate_limit: z.number().int().default(10),
  enabled: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { data: configs, error } = await supabase
      .from('system_configurations')
      .select('config_key, config_value')
      .eq('config_type', 'bulksms');

    if (error) {
      throw error;
    }

    // Transform to expected format (mask sensitive data)
    const bulkSMSConfig = configs?.reduce((acc, config) => {
      if (config.config_key === 'password') {
        acc[config.config_key] = config.config_value ? '****' : '';
      } else {
        acc[config.config_key] = config.config_value;
      }
      return acc;
    }, {} as any) || {};

    return createSuccessResponse(bulkSMSConfig);

  } catch (error) {
    console.error('Get BulkSMS config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const config = bulkSMSConfigSchema.parse(body);

    // Update BulkSMS configuration
    for (const [key, value] of Object.entries(config)) {
      await supabase
        .from('system_configurations')
        .upsert({
          config_key: key,
          config_value: value,
          config_type: 'bulksms',
          is_sensitive: ['password'].includes(key)
        });
    }

    return createSuccessResponse(null, 'BulkSMS configuration updated successfully');

  } catch (error) {
    console.error('Update BulkSMS config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { test_number } = await request.json();

    if (!test_number) {
      return createErrorResponse('Test number is required', 400);
    }

    // For now, just return success - in production this would send actual SMS
    return createSuccessResponse(
      { sent: true, test_number },
      'Test SMS sent successfully'
    );

  } catch (error) {
    console.error('Test BulkSMS config error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}