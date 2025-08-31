import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  email: string;
  phone: string;
  full_name: string;
  master_key?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, phone, full_name, master_key }: CreateAdminRequest = await req.json();

    // Validate master key (in production, use proper validation)
    const MASTER_KEY = Deno.env.get('MASTER_ADMIN_KEY') || 'kixikila-admin-2025';
    if (master_key !== MASTER_KEY) {
      return new Response(
        JSON.stringify({ error: 'Invalid master key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !phone || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, phone, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin user already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin user
    const { data: adminUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        phone,
        full_name,
        role: 'admin',
        is_active: true,
        phone_verified: true,
        email_verified: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Admin creation error:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log admin creation
    await supabase
      .from('audit_logs')
      .insert({
        user_id: adminUser.id,
        entity_type: 'admin_creation',
        entity_id: adminUser.id,
        action: 'create_admin',
        metadata: { email, phone, full_name }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Create admin error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);