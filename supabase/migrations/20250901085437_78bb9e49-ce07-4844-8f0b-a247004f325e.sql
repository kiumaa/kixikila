-- CORREÇÃO CRÍTICA DE SEGURANÇA: Atualizar políticas RLS para negar acesso público
-- As tabelas estão retornando dados quando deveriam negar acesso

-- Reforçar política da tabela users para negar acesso não autenticado
DROP POLICY IF EXISTS "users_own_data_secure_access" ON users;
CREATE POLICY "users_deny_unauthenticated_access" ON users 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = id OR 
      (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
    )
  );

-- Corrigir tabela transactions para negar acesso público
DROP POLICY IF EXISTS "users_own_transactions_only" ON transactions;
CREATE POLICY "transactions_authenticated_only" ON transactions 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) = 'admin'
    )
  );

-- Verificar se há política que permite acesso público às tabelas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname, qual 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual IS NULL OR qual = 'true' OR qual LIKE '%true%')
  LOOP
    RAISE WARNING 'Política potencialmente insegura: %.% - %', pol.schemaname, pol.tablename, pol.policyname;
  END LOOP;
END $$;