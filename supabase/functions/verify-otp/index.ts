// Import necessary modules and types
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers for handling browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOtpRequest {
  phone: string;
  token: string;
  type: string;
}

// Twilio OTP verification function
async function verifyTwilioOtp(phone: string, token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');

    console.log('🔐 Twilio credentials check: {');
    console.log(`  accountSid: "${accountSid ? 'present' : 'missing'}",`);
    console.log(`  authToken: "${authToken ? 'present' : 'missing'}",`);
    console.log(`  verifyServiceSid: "${verifyServiceSid ? 'present' : 'missing'}"`);
    console.log('}');

    if (!accountSid || !authToken || !verifyServiceSid) {
      console.error('❌ Missing Twilio credentials');
      return {
        success: false,
        error: 'Configuração Twilio incompleta. Contacte o suporte técnico.'
      };
    }

    console.log(`📞 Attempting Twilio verification for: ${phone} with service: ${verifyServiceSid}`);

    const url = `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`;
    const auth = btoa(`${accountSid}:${authToken}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phone,
        'Code': token
      }).toString()
    });

    console.log(`📋 Twilio response status: ${response.status}`);
    
    const responseData = await response.text();
    console.log(`📋 Twilio response body: ${responseData}`);

    if (response.ok) {
      const data = JSON.parse(responseData);
      if (data.status === 'approved') {
        console.log('✅ Twilio verification successful');
        return { success: true };
      } else {
        console.log(`❌ Twilio verification failed: status ${data.status}`);
        return {
          success: false,
          error: 'Código OTP inválido ou expirado'
        };
      }
    } else {
      // Handle specific error cases
      if (response.status === 404) {
        console.error('🚨 Twilio service configuration error - check TWILIO_VERIFY_SERVICE_SID');
        return {
          success: false,
          error: 'Serviço de verificação não encontrado. Contacte o suporte técnico.'
        };
      } else if (response.status === 429) {
        return {
          success: false,
          error: 'Muitas tentativas de verificação. Tente novamente em alguns minutos.'
        };
      } else {
        const errorData = JSON.parse(responseData);
        console.error(`❌ Twilio verification failed:`, errorData);
        return {
          success: false,
          error: 'Erro na verificação. Tente novamente ou contacte o suporte.'
        };
      }
    }

  } catch (error) {
    console.error('❌ Twilio verification error:', error);
    return {
      success: false,
      error: 'Erro de conectividade com o serviço de verificação.'
    };
  }
}

// Main Deno serverless function
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔐 Starting Twilio OTP verification...');

  try {
    // Parse request body
    const requestBody = await req.json();
    const { phone, token, type }: VerifyOtpRequest = requestBody;

    console.log(`🔍 OTP Verification Request: { phone: "${phone}", tokenLength: ${token?.length}, type: "${type}" }`);

    // Basic validation
    if (!phone || !token || !type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados de verificação incompletos' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP with Twilio
    const verifyResult = await verifyTwilioOtp(phone, token);
    console.log(`🔐 Twilio verification result: ${JSON.stringify(verifyResult)}`);

    if (!verifyResult.success) {
      console.log(`❌ Twilio verification failed: ${verifyResult.error}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: verifyResult.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If OTP is valid, handle user management
    console.log('✅ OTP verified successfully, proceeding with user management...');

    // Initialize Supabase client with service role for user management
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if user exists in our custom users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (userError) {
      console.error('❌ Error fetching user from database:', userError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro interno ao verificar utilizador. Tente novamente.' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userData;

    if (!existingUser) {
      // Create new user in our custom table only (no auth.users entry)
      console.log(`🆕 Creating new user for phone: ${phone}`);

      const newUser = {
        phone: phone,
        full_name: 'Novo Utilizador',
        phone_verified: true,
        is_active: true,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user in custom table:', createError);
        
        if (createError.code === '23505') { // Unique constraint violation
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Utilizador já existe. Tente fazer login.' 
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar perfil. Tente novamente.' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      console.log('✅ Custom user created successfully:', createdUser.id);
      userData = createdUser;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Conta criada e verificada com sucesso',
          data: {
            user: userData,
            isNewUser: true
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // User exists, update login info
      console.log(`✅ User found, updating login info for: ${existingUser.id}`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          phone_verified: true 
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.warn('⚠️ Could not update user login info:', updateError);
      }

      userData = existingUser;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Login realizado com sucesso',
          data: {
            user: userData,
            isExistingUser: true
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('💥 Critical error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor. Tente novamente.' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});