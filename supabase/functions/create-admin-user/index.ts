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
    // Criar cliente Supabase com service role para criar usuários
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Criar usuário admin no sistema de autenticação
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@kixikila.pro',
      password: '@Kixikila2025!',
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