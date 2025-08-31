-- Fix security policies for better data protection
-- Drop the old policy and create a more restrictive one
DROP POLICY IF EXISTS "authenticated_can_view_public_profiles" ON public.users;

-- Users can only view their own data or be viewed by admins
CREATE POLICY "users_can_view_own_data_only"
ON public.users FOR SELECT
USING (id = auth.uid() OR is_current_user_admin());

-- Restrict transaction visibility to group members only for group transactions
DROP POLICY IF EXISTS "users_can_view_group_transactions_secure" ON public.transactions;

CREATE POLICY "users_can_view_group_transactions_secure" 
ON public.transactions FOR SELECT
USING (
  (group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = transactions.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.status = 'active'
  )) 
  OR user_id = auth.uid()
  OR is_current_user_admin()
);

-- Add audit logging trigger for sensitive operations
CREATE OR REPLACE FUNCTION audit_group_cycles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, entity_type, entity_id, action, new_values, metadata
  ) VALUES (
    NEW.winner_user_id,
    'group_cycles',
    NEW.id::text,
    'winner_drawn',
    to_jsonb(NEW),
    jsonb_build_object(
      'group_id', NEW.group_id,
      'prize_amount', NEW.prize_amount,
      'draw_method', NEW.draw_method,
      'security_logged', true
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for group cycles audit logging
DROP TRIGGER IF EXISTS trigger_audit_group_cycles ON public.group_cycles;
CREATE TRIGGER trigger_audit_group_cycles
  AFTER INSERT ON public.group_cycles
  FOR EACH ROW EXECUTE FUNCTION audit_group_cycles();