import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyOtpRequest {
  phone: string;
  token: string;
  type: 'phone_verification' | 'login';
}

// Verify OTP using Twilio Verify API - PRODUCTION MODE
const verifyTwilioOtp = async (phone: string, code: string): Promise<{ success: boolean; error?: string }> => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');
  
  console.log('🔐 Twilio credentials check:', {
    accountSid: accountSid ? 'present' : 'missing',
    authToken: authToken ? 'present' : 'missing',
    verifyServiceSid: verifyServiceSid ? 'present' : 'missing'
  });
  
  if (!accountSid || !authToken || !verifyServiceSid) {
    console.error('❌ Twilio credentials missing - check environment variables');
    return { success: false, error: 'Serviço de autenticação temporariamente indisponível' };
  }

  try {
    // Ensure phone has country code (accept international numbers)
    const formattedPhone = phone.startsWith('+') ? phone : `+351${phone}`;
    console.log('📞 Attempting Twilio verification for:', formattedPhone, 'with service:', verifyServiceSid);
    
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Code: code
        })
      }
    );

    const result = await response.json();
    console.log('Twilio Verify check response status:', response.status);
    console.log('Twilio Verify check response:', result);
    
    if (response.ok && result.status === 'approved') {
      console.log('✅ Twilio verification successful');
      return { success: true };
    } else {
      console.error('❌ Twilio verification failed:', result);
      
      // Handle specific Twilio errors
      if (result.code === 20404) {
        return { success: false, error: 'Serviço de verificação não configurado corretamente' };
      } else if (result.code === 20003) {
        return { success: false, error: 'Não autorizado - verifique credenciais Twilio' };
      } else if (result.status === 'denied') {
        return { success: false, error: 'Código inválido ou expirado' };
      } else {
        return { success: false, error: result.message || 'Código inválido ou expirado' };
      }
    }
  } catch (error) {
    console.error('Error verifying Twilio OTP:', error);
    return { success: false, error: 'Erro de rede ao verificar código' };
  }
};

// Generate secure random password
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, token, type }: VerifyOtpRequest = await req.json();
    console.log('🔍 OTP Verification Request:', { phone, tokenLength: token?.length, type });

    if (!phone || !token || !type) {
      console.error('❌ Missing required fields:', { phone: !!phone, token: !!token, type: !!type });
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Número de telefone, token e tipo são obrigatórios' 
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP with Twilio first
    console.log('🔐 Starting Twilio OTP verification...');
    const twilioResult = await verifyTwilioOtp(phone, token);
    console.log('🔐 Twilio verification result:', twilioResult);

    if (!twilioResult.success) {
      console.error('❌ Twilio verification failed:', twilioResult.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: twilioResult.error || 'Código OTP inválido ou expirado' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Twilio verification successful, proceeding with user authentication...');

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    let userData;
    let sessionData = null;

    try {
      // Check if user exists in our custom users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create new user
        console.log(`Creating new user for phone: ${phone}`);
        
        const tempPassword = generateSecurePassword();
        const tempEmail = `user_${phone.replace(/\D/g, '')}_${Date.now()}@kixikila.pro`;

        // Create Supabase Auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          phone: phone,
          phone_confirmed: true,
          user_metadata: {
            full_name: 'Usuário',
            phone: phone,
            phone_verified: true
          }
        });

        if (authError || !authUser.user) {
          console.error('Error creating auth user:', authError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar conta de usuário' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create user in our custom table
        const newUser = {
          id: authUser.user.id,
          phone: phone,
          email: tempEmail,
          full_name: 'Usuário',
          phone_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) {
          console.error('Error creating custom user:', createError);
          await supabase.auth.admin.deleteUser(authUser.user.id);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar perfil de usuário' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userData = createdUser;

        // Generate session tokens for the new user
        const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tempEmail
        });

        if (!sessionError && sessionResponse) {
          sessionData = {
            access_token: sessionResponse.properties?.access_token,
            refresh_token: sessionResponse.properties?.refresh_token,
            expires_at: Date.now() + (60 * 60 * 1000), // 1 hour
            user: {
              id: authUser.user.id,
              email: tempEmail,
              phone: phone,
              phone_confirmed_at: new Date().toISOString()
            }
          };
        }

        // Generate secure session tokens for authentication
        // Note: Never expose passwords or sensitive credentials in responses
        const authData = {
          requiresPasswordReset: true,
          emailForReset: tempEmail
        };

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Conta criada e verificada com sucesso',
            data: {
              user: userData,
              session: sessionData,
              authData: authData
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else if (userError) {
        console.error('Error fetching user:', userError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Erro ao buscar usuário' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // User exists, update login info and generate session
        userData = existingUser;
        
        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            phone_verified: true 
          })
          .eq('id', userData.id);

        // Generate session for existing user
        const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userData.email
        });

        if (!sessionError && sessionResponse) {
          sessionData = {
            access_token: sessionResponse.properties?.access_token,
            refresh_token: sessionResponse.properties?.refresh_token,
            expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
          };
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Login realizado com sucesso',
            data: {
              user: userData,
              session: sessionData
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (error) {
      console.error('Error in user creation/retrieval:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro interno do servidor' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});