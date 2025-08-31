import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const emailConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().min(1),
  password: z.string().min(1),
  from_name: z.string().min(1),
  from_address: z.string().email()
});

async function verifyAdmin(token: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const adminUser = await verifyAdmin(token);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get email configuration
    const { data: configs, error } = await supabaseAdmin
      .from('system_configurations')
      .select('config_key, config_value')
      .eq('config_type', 'email');

    if (error) {
      throw error;
    }

    // Transform to expected format
    const emailConfig = configs?.reduce((acc, config) => {
      acc[config.config_key] = config.config_value;
      return acc;
    }, {} as any) || {};

    return NextResponse.json({
      success: true,
      data: emailConfig
    });

  } catch (error) {
    console.error('Get email config error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const adminUser = await verifyAdmin(token);
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const config = emailConfigSchema.parse(body);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update email configuration
    for (const [key, value] of Object.entries(config)) {
      await supabaseAdmin
        .from('system_configurations')
        .upsert({
          config_key: key,
          config_value: value,
          config_type: 'email',
          is_sensitive: ['password'].includes(key)
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Email configuration updated successfully'
    });

  } catch (error) {
    console.error('Update email config error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}