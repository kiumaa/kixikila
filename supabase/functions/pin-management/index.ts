import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PinRequest {
  action: 'set' | 'verify' | 'change';
  pin?: string;
  newPin?: string;
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

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, pin, newPin }: PinRequest = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'set':
        return await setPIN(supabase, user.id, pin!);
      case 'verify':
        return await verifyPIN(supabase, user.id, pin!);
      case 'change':
        return await changePIN(supabase, user.id, pin!, newPin!);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('PIN management error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

// Set a new PIN for user
async function setPIN(supabase: any, userId: string, pin: string): Promise<Response> {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return new Response(
      JSON.stringify({ error: 'PIN deve ter exatamente 6 dígitos' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Hash the PIN using crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + userId); // Salt with user ID
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Check if PIN already exists
    const { data: existingPin } = await supabase
      .from('auth_pin')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingPin) {
      // Update existing PIN
      result = await supabase
        .from('auth_pin')
        .update({ pin_hash: hashHex })
        .eq('user_id', userId);
    } else {
      // Insert new PIN
      result = await supabase
        .from('auth_pin')
        .insert({ user_id: userId, pin_hash: hashHex });
    }

    if (result.error) {
      console.error('PIN set error:', result.error);
      return new Response(
        JSON.stringify({ error: 'Falha ao definir PIN' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ PIN definido para user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PIN definido com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Set PIN error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Verify PIN
async function verifyPIN(supabase: any, userId: string, pin: string): Promise<Response> {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return new Response(
      JSON.stringify({ error: 'PIN deve ter exatamente 6 dígitos' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get stored PIN hash
    const { data: storedPin, error } = await supabase
      .from('auth_pin')
      .select('pin_hash')
      .eq('user_id', userId)
      .single();

    if (error || !storedPin) {
      return new Response(
        JSON.stringify({ error: 'PIN não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash provided PIN
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + userId); // Salt with user ID
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare hashes
    const isValid = hashHex === storedPin.pin_hash;

    console.log(`🔐 PIN verification for user ${userId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        valid: isValid,
        message: isValid ? 'PIN correto' : 'PIN incorreto'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verify PIN error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Change PIN (verify current PIN then set new one)
async function changePIN(supabase: any, userId: string, currentPin: string, newPin: string): Promise<Response> {
  // First verify current PIN
  const verifyResult = await verifyPIN(supabase, userId, currentPin);
  const verifyData = await verifyResult.json();
  
  if (!verifyData.valid) {
    return new Response(
      JSON.stringify({ error: 'PIN atual incorreto' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Then set new PIN
  return await setPIN(supabase, userId, newPin);
}

serve(handler);