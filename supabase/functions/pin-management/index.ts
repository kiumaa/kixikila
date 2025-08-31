import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-kixikila-user-id',
};

// Hash PIN usando Web Crypto API (similar ao Argon2)
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + salt);
  
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );
  
  return Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verificar PIN
async function verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
  const pinHash = await hashPin(pin, salt);
  return pinHash === hash;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for custom authentication first
    const customUserId = req.headers.get('x-kixikila-user-id');
    let userId = null;
    
    if (customUserId) {
      // Verify the custom user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', customUserId)
        .single();
      
      if (!userError && userData) {
        userId = customUserId;
        console.log('✅ Custom authentication successful for user:', userId);
      } else {
        console.error('❌ Custom user not found:', customUserId);
        throw new Error('Invalid user authentication');
      }
    } else {
      // Try Supabase JWT authentication as fallback
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authentication provided');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error('Invalid authentication token');
      }
      
      userId = user.id;
      console.log('✅ Supabase JWT authentication successful for user:', userId);
    }

    const { action, pin, deviceId, deviceName } = await req.json();
    const salt = userId; // Usar userId como salt único

    console.log(`🔐 PIN Management - Action: ${action}, User: ${userId}`);

    switch (action) {
      case 'set': {
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          throw new Error('PIN deve ter exatamente 4 dígitos');
        }

        const pinHash = await hashPin(pin, salt);
        
        // Inserir ou atualizar PIN
        const { error: pinError } = await supabase
          .from('auth_pin')
          .upsert({
            user_id: userId,
            pin_hash: pinHash
          });

        if (pinError) {
          console.error('❌ Erro ao definir PIN:', pinError);
          throw pinError;
        }

        // Se fornecido deviceId, marcar como confiável
        if (deviceId) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

          const { error: deviceError } = await supabase
            .from('device_sessions')
            .upsert({
              user_id: userId,
              device_id: deviceId,
              device_name: deviceName || 'Dispositivo desconhecido',
              trusted: true,
              failed_pin_attempts: 0,
              expires_at: expiresAt.toISOString()
            });

          if (deviceError) {
            console.error('❌ Erro ao marcar dispositivo confiável:', deviceError);
            throw deviceError;
          }
        }

        console.log('✅ PIN definido com sucesso');
        return new Response(
          JSON.stringify({ success: true, message: 'PIN definido com sucesso' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
          throw new Error('PIN inválido');
        }

        // Buscar PIN hash do utilizador
        const { data: pinData, error: fetchError } = await supabase
          .from('auth_pin')
          .select('pin_hash')
          .eq('user_id', userId)
          .single();

        if (fetchError || !pinData) {
          throw new Error('PIN não configurado');
        }

        // Verificar se dispositivo está bloqueado
        if (deviceId) {
          const { data: deviceData } = await supabase
            .from('device_sessions')
            .select('failed_pin_attempts, lock_until')
            .eq('user_id', userId)
            .eq('device_id', deviceId)
            .single();

          if (deviceData?.lock_until && new Date(deviceData.lock_until) > new Date()) {
            const lockUntil = new Date(deviceData.lock_until);
            const minutesRemaining = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
            throw new Error(`Dispositivo bloqueado. Tente novamente em ${minutesRemaining} minutos`);
          }
        }

        // Verificar PIN
        const isValid = await verifyPin(pin, pinData.pin_hash, salt);

        if (!isValid) {
          // Incrementar tentativas falhadas
          if (deviceId) {
            const { data: deviceData } = await supabase
              .from('device_sessions')
              .select('failed_pin_attempts')
              .eq('user_id', userId)
              .eq('device_id', deviceId)
              .single();

            const failedAttempts = (deviceData?.failed_pin_attempts || 0) + 1;
            let lockUntil = null;

            // Bloquear após 5 tentativas
            if (failedAttempts >= 5) {
              lockUntil = new Date();
              lockUntil.setMinutes(lockUntil.getMinutes() + 15); // 15 minutos
            }

            await supabase
              .from('device_sessions')
              .upsert({
                user_id: userId,
                device_id: deviceId,
                failed_pin_attempts: failedAttempts,
                lock_until: lockUntil?.toISOString()
              });

            const remainingAttempts = Math.max(0, 5 - failedAttempts);
            if (failedAttempts >= 5) {
              throw new Error('Muitas tentativas falhadas. Dispositivo bloqueado por 15 minutos');
            } else {
              throw new Error(`PIN incorreto. Restam ${remainingAttempts} tentativas`);
            }
          }

          throw new Error('PIN incorreto');
        }

        // PIN correto - resetar tentativas falhadas
        if (deviceId) {
          await supabase
            .from('device_sessions')
            .upsert({
              user_id: userId,
              device_id: deviceId,
              failed_pin_attempts: 0,
              lock_until: null,
              last_seen: new Date().toISOString()
            });
        }

        console.log('✅ PIN verificado com sucesso');
        return new Response(
          JSON.stringify({ success: true, valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'trust-device': {
        if (!deviceId) {
          throw new Error('Device ID é obrigatório');
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

        const { error: deviceError } = await supabase
          .from('device_sessions')
          .upsert({
            user_id: userId,
            device_id: deviceId,
            device_name: deviceName || 'Dispositivo desconhecido',
            trusted: true,
            failed_pin_attempts: 0,
            expires_at: expiresAt.toISOString(),
            last_seen: new Date().toISOString()
          });

        if (deviceError) {
          console.error('❌ Erro ao marcar dispositivo confiável:', deviceError);
          throw deviceError;
        }

        console.log('✅ Dispositivo marcado como confiável');
        return new Response(
          JSON.stringify({ success: true, message: 'Dispositivo marcado como confiável' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'check-device': {
        if (!deviceId) {
          throw new Error('Device ID é obrigatório');
        }

        // Verificar se existe PIN configurado para o utilizador
        const { data: userPinData, error: pinFetchError } = await supabase
          .from('auth_pin')
          .select('pin_hash')
          .eq('user_id', userId)
          .single();

        const { data: deviceData, error: deviceError } = await supabase
          .from('device_sessions')
          .select('trusted, expires_at, lock_until')
          .eq('user_id', userId)
          .eq('device_id', deviceId)
          .single();

        if (deviceError && deviceError.code !== 'PGRST116') {
          console.error('❌ Erro ao verificar dispositivo:', deviceError);
          throw deviceError;
        }

        const isTrusted = deviceData?.trusted && 
                         new Date(deviceData.expires_at) > new Date() &&
                         (!deviceData.lock_until || new Date(deviceData.lock_until) <= new Date());

        return new Response(
          JSON.stringify({ 
            success: true, 
            trusted: isTrusted,
            hasPin: !!userPinData 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Ação não reconhecida');
    }

  } catch (error) {
    console.error('❌ Erro no PIN Management:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});