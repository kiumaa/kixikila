-- Ensure users table exists with all required columns
DO $$
BEGIN
    -- Check if users table has all required columns and add if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_login') THEN
        ALTER TABLE users ADD COLUMN first_login boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_withdrawn') THEN
        ALTER TABLE users ADD COLUMN total_withdrawn numeric DEFAULT 0.00;
    END IF;
    
    -- Update any missing columns with proper constraints
    UPDATE users SET 
        first_login = COALESCE(first_login, true),
        total_withdrawn = COALESCE(total_withdrawn, 0.00)
    WHERE first_login IS NULL OR total_withdrawn IS NULL;
END $$;