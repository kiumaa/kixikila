import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@kixikila.pt'
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    
    // Validate required environment variables
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is required')
    }
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
    }
    
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required')
    }
    
    // Validate admin credentials using database function
    const tempClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: validation, error: validationError } = await tempClient
      .rpc('validate_admin_credentials', {
        email: adminEmail,
        password: adminPassword
      })
      
    if (validationError || !validation?.valid) {
      const errors = validation?.errors || ['Invalid credentials']
      throw new Error(`Credential validation failed: ${errors.join(', ')}`)
    }
    
    // Criar cliente Supabase com service role para criar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Criar usuário admin no sistema de autenticação
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador Kixikila'
      }
    })

    if (authError) {
      console.error('Erro ao criar usuário auth:', authError)
      return new Response(
        JSON.stringify({ error: authError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Aguardar um pouco para a trigger handle_new_user() criar a entrada na tabela users
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualizar o role do usuário para admin
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: 'admin',
        is_active: true,
        email_verified: true
      })
      .eq('id', authUser.user.id)

    if (updateError) {
      console.error('Erro ao atualizar role:', updateError)
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário admin criado com sucesso',
        user_id: authUser.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})