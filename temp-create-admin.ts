import { supabase } from "@/integrations/supabase/client";

// Script temporário para criar o usuário admin
async function createAdminUser() {
  console.log('Criando usuário admin...');
  
  try {
    const { data, error } = await supabase.functions.invoke('create-admin-user', {
      body: {}
    });
    
    if (error) {
      console.error('Erro ao criar admin:', error);
      return;
    }
    
    console.log('Usuário admin criado com sucesso:', data);
  } catch (err) {
    console.error('Erro:', err);
  }
}

// Executar imediatamente
createAdminUser();