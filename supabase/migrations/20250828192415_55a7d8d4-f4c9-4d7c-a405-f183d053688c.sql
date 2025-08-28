-- Fix the function search path warning by updating functions to have stable search paths
CREATE OR REPLACE FUNCTION public.classify_user_data_sensitivity(column_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    CASE column_name
        WHEN 'wallet_balance', 'total_earned', 'total_withdrawn', 'total_saved' THEN
            RETURN 'FINANCIAL';
        WHEN 'email', 'phone', 'address', 'date_of_birth' THEN
            RETURN 'PII';
        WHEN 'kyc_status', 'trust_score' THEN
            RETURN 'SENSITIVE';
        ELSE
            RETURN 'STANDARD';
    END CASE;
END;
$$;