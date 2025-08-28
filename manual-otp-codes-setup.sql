
-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- OTP details
    type VARCHAR(50) NOT NULL,
    code VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage tracking
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own OTP codes" ON otp_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OTP codes" ON otp_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own OTP codes" ON otp_codes
    FOR UPDATE USING (user_id = auth.uid());
