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

    if (!phone || !token || !type) {
      return new Response(
        JSON.stringify({ error: 'Phone number, token and type are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('code', token)
      .eq('type', type)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpData || otpData.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Código OTP inválido ou expirado' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const otpRecord = otpData[0];

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Muitas tentativas. Solicite um novo código.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString()
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error updating OTP:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists in auth.users
    let userData;
    let sessionData = null;
    
    // Generate cryptographically secure temporary password
    const tempPassword = generateSecurePassword();
    const tempEmail = `user_${phone.replace(/\D/g, '')}_${Date.now()}@kixikila.pro`;

    try {
      // First check if user exists in our custom users table
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist, create both Auth user and custom user
        console.log(`Creating new user for phone: ${phone}`);
        
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
          // Cleanup auth user if custom user creation fails
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
        
        // Create session for new user
        const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: tempEmail,
          options: {
            data: {
              phone: phone,
              phone_verified: true
            }
          }
        });

        if (!sessionError && sessionResponse) {
          sessionData = {
            access_token: sessionResponse.properties?.access_token,
            refresh_token: sessionResponse.properties?.refresh_token,
            user: authUser.user,
            expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
          };
        }

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
        // User exists, update login info
        userData = existingUser;
        
        await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            phone_verified: true 
          })
          .eq('id', userData.id);

        // For existing users, create session using their auth user
        const { data: sessionResponse, error: sessionError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userData.email,
          options: {
            data: {
              phone: phone,
              phone_verified: true
            }
          }
        });

        if (!sessionError && sessionResponse) {
          sessionData = {
            access_token: sessionResponse.properties?.access_token,
            refresh_token: sessionResponse.properties?.refresh_token,
            expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
          };
        }
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

    console.log(`OTP verified successfully for ${phone}, user ID: ${userData?.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        data: {
          user: userData,
          session: sessionData,
          // SECURITY: Never return passwords in API responses
          authEmail: userData.email // For frontend auth only
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});