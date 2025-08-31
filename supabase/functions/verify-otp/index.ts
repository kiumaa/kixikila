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

// Verify OTP using Twilio Verify API with improved error handling
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
    return { success: false, error: 'Serviço de verificação temporariamente indisponível. Contacte o suporte.' };
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
    console.log('📋 Twilio response status:', response.status);
    console.log('📋 Twilio response body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.status === 'approved' && result.valid === true) {
      console.log('✅ Twilio verification successful');
      return { success: true };
    } else {
      console.error('❌ Twilio verification failed:', result);
      
      // Handle specific Twilio errors with user-friendly messages
      if (result.code === 20404 || result.message?.includes('not found')) {
        console.error('🚨 Twilio service configuration error - check TWILIO_VERIFY_SERVICE_SID');
        return { success: false, error: 'Serviço de verificação não encontrado. Contacte o suporte técnico.' };
      } else if (result.code === 20003 || result.code === 20401) {
        console.error('🚨 Twilio authentication error - check credentials');
        return { success: false, error: 'Credenciais de autenticação inválidas. Contacte o suporte técnico.' };
      } else if (result.status === 'denied' || result.status === 'canceled') {
        return { success: false, error: 'Código inválido ou expirado. Solicite um novo código.' };
      } else if (result.code === 60200) {
        return { success: false, error: 'Demasiadas tentativas. Aguarde antes de tentar novamente.' };
      } else if (result.code === 60202) {
        return { success: false, error: 'Código expirado. Solicite um novo código.' };
      } else {
        const errorMsg = result.message || result.error_message || 'Código inválido';
        console.error('🔍 Unhandled Twilio error:', { code: result.code, status: result.status, message: errorMsg });
        return { success: false, error: `Erro na verificação: ${errorMsg}` };
      }
    }
  } catch (error) {
    console.error('💥 Network/fetch error verifying Twilio OTP:', error);
    return { success: false, error: 'Erro de rede. Verifique sua conexão e tente novamente.' };
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

      if (!existingUser) {
        // User doesn't exist, create new user
        console.log(`🆕 Creating new user for phone: ${phone}`);
        
        const tempPassword = generateSecurePassword();
        const cleanPhone = phone.replace(/\D/g, '');
        const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const tempEmail = `user_${cleanPhone}_${uniqueId}@kixikila.pro`;

        console.log('📧 Generated unique email:', tempEmail);

        // Create Supabase Auth user first
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: tempPassword,
          phone: phone,
          phone_confirmed: true,
          user_metadata: {
            full_name: 'Novo Utilizador',
            phone: phone,
            phone_verified: true
          }
        });

        if (authError || !authUser.user) {
          console.error('❌ Error creating Supabase auth user:', authError);
          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Erro ao criar conta. Tente novamente ou contacte o suporte.' 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Auth user created with ID:', authUser.user.id);

        // Create user in our custom table with the same ID
        const newUser = {
          id: authUser.user.id,
          phone: phone,
          email: tempEmail,
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
          // Rollback: delete the auth user we just created
          console.log('🔄 Rolling back auth user creation...');
          await supabase.auth.admin.deleteUser(authUser.user.id);
          
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