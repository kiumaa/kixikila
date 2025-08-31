import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    // Verificar se o utilizador está autenticado
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const url = new URL(req.url);
    const method = req.method;
    const userId = user.id;

    console.log(`📋 KYC Management - Method: ${method}, User: ${userId}`);

    if (method === 'GET') {
      // Buscar estado KYC do utilizador
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (kycError && kycError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar estado KYC:', kycError);
        throw kycError;
      }

      // Se não existe registo, criar um pendente
      if (!kycData) {
        const { data: newKycData, error: createError } = await supabase
          .from('kyc_status')
          .insert({
            user_id: userId,
            status: 'pending'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar estado KYC:', createError);
          throw createError;
        }

        console.log('✅ Estado KYC criado');
        return new Response(
          JSON.stringify({ success: true, kyc: newKycData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Estado KYC obtido');
      return new Response(
        JSON.stringify({ success: true, kyc: kycData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'POST') {
      const { action, documentType, documentNumber } = await req.json();

      if (action === 'submit') {
        // Validações básicas
        if (!documentType || !documentNumber) {
          throw new Error('Tipo e número do documento são obrigatórios');
        }

        if (documentType === 'cc' && documentNumber.length !== 8) {
          throw new Error('Número do Cartão de Cidadão deve ter 8 dígitos');
        }

        if (documentType === 'passport' && documentNumber.length < 6) {
          throw new Error('Número do Passaporte deve ter pelo menos 6 caracteres');
        }

        // Atualizar estado KYC
        const { data: kycData, error: kycError } = await supabase
          .from('kyc_status')
          .upsert({
            user_id: userId,
            status: 'in_progress',
            document_type: documentType,
            document_number: documentNumber,
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();

        if (kycError) {
          console.error('❌ Erro ao submeter KYC:', kycError);
          throw kycError;
        }

        // Simular aprovação automática para demonstração (v1.1)
        // Em produção, isto seria feito por um processo externo
        setTimeout(async () => {
          await supabase
            .from('kyc_status')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              notes: 'Aprovação automática - Demo'
            })
            .eq('user_id', userId);
        }, 5000); // Aprovar após 5 segundos

        console.log('✅ KYC submetido');
        return new Response(
          JSON.stringify({ 
            success: true, 
            kyc: kycData,
            message: 'Documentos submetidos com sucesso. Análise em progresso...'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'skip') {
        // Marcar como "skip" (pendente mas user escolheu não fazer agora)
        const { data: kycData, error: kycError } = await supabase
          .from('kyc_status')
          .upsert({
            user_id: userId,
            status: 'pending',
            notes: 'Utilizador escolheu fazer mais tarde'
          })
          .select()
          .single();

        if (kycError) {
          console.error('❌ Erro ao marcar KYC como skip:', kycError);
          throw kycError;
        }

        console.log('✅ KYC marcado para depois');
        return new Response(
          JSON.stringify({ 
            success: true, 
            kyc: kycData,
            message: 'Podes fazer a verificação mais tarde no teu perfil'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Ação não reconhecida');
    }

    throw new Error('Método não suportado');

  } catch (error) {
    console.error('❌ Erro no KYC Management:', error);
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