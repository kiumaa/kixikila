-- Improve handle_new_user function with enhanced logging and error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
    user_email text;
    user_phone text;
    user_full_name text;
BEGIN
    -- Log the trigger execution
    RAISE LOG 'Creating user profile for user ID: %', NEW.id;
    
    -- Extract data from raw_user_meta_data with fallbacks
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
    user_phone := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador');
    
    -- Log extracted data (without sensitive info)
    RAISE LOG 'Profile data - Name: %, Email exists: %, Phone exists: %', 
        user_full_name, 
        (user_email IS NOT NULL AND user_email != ''),
        (user_phone IS NOT NULL AND user_phone != '');
    
    BEGIN
        -- Insert user profile with enhanced data
        INSERT INTO public.users (
            id,
            full_name,
            email,
            phone,
            email_verified,
            phone_verified,
            kyc_status,
            is_active,
            trust_score,
            wallet_balance,
            total_saved,
            total_earned,
            total_withdrawn,
            active_groups,
            completed_cycles,
            first_login,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            user_full_name,
            NULLIF(user_email, ''),
            NULLIF(user_phone, ''),
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
            COALESCE(NEW.phone_confirmed_at IS NOT NULL, false),
            'pending',
            true,
            50, -- Default trust score
            0.00, -- Start with zero balance
            0.00,
            0.00,
            0.00,
            0, -- No groups initially
            0, -- No cycles completed
            true, -- First login flag
            NOW(),
            NOW()
        );
        
        RAISE LOG 'Successfully created user profile for user ID: %', NEW.id;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't block the signup
        RAISE WARNING 'Failed to create user profile for user ID %. Error: %', NEW.id, SQLERRM;
        
        -- Insert audit log for failed profile creation
        INSERT INTO public.audit_logs (
            user_id,
            entity_type,
            entity_id,
            action,
            metadata,
            created_at
        ) VALUES (
            NEW.id,
            'user_profile_creation',
            NEW.id::text,
            'failed_profile_creation',
            jsonb_build_object(
                'error', SQLERRM,
                'email_provided', (user_email IS NOT NULL AND user_email != ''),
                'phone_provided', (user_phone IS NOT NULL AND user_phone != ''),
                'full_name_provided', (user_full_name IS NOT NULL AND user_full_name != '')
            ),
            NOW()
        );
        
        -- Re-raise as warning, not error, to avoid blocking signup
        RAISE WARNING 'Profile creation failed but signup completed for user %', NEW.id;
    END;
    
    RETURN NEW;
END;
$$;