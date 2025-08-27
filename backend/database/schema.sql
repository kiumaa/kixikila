-- KIXIKILA Database Schema
-- PostgreSQL Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('user', 'admin', 'vip');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing');
CREATE TYPE group_status AS ENUM ('active', 'completed', 'suspended', 'archived');
CREATE TYPE group_type AS ENUM ('savings', 'investment', 'loan', 'emergency_fund');
CREATE TYPE member_role AS ENUM ('admin', 'member', 'moderator');
CREATE TYPE member_status AS ENUM ('active', 'pending', 'suspended', 'left');
CREATE TYPE transaction_type AS ENUM ('contribution', 'withdrawal', 'transfer', 'fee', 'interest', 'penalty');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'canceled', 'refunded');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'mobile_money', 'cash', 'stripe', 'other');
CREATE TYPE notification_type AS ENUM (
  'group_invitation', 'contribution_reminder', 'contribution_received', 
  'goal_achieved', 'payment_due', 'payment_received', 'payment_failed',
  'subscription_activated', 'subscription_expired', 'security_alert', 
  'login_attempt', 'promotional', 'system_update', 'other'
);
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
CREATE TYPE otp_type AS ENUM ('email_verification', 'phone_verification', 'password_reset', 'two_factor');
CREATE TYPE otp_status AS ENUM ('pending', 'verified', 'expired', 'used');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  profile_picture_url TEXT,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'pending_verification',
  
  -- Verification fields
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Security fields
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Subscription fields
  subscription_status subscription_status,
  subscription_id VARCHAR(255), -- Stripe subscription ID
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  app_settings JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_type group_type DEFAULT 'savings',
  status group_status DEFAULT 'active',
  
  -- Financial settings
  target_amount DECIMAL(15,2),
  current_amount DECIMAL(15,2) DEFAULT 0,
  contribution_frequency VARCHAR(50), -- 'weekly', 'monthly', 'quarterly'
  contribution_amount DECIMAL(15,2),
  minimum_contribution DECIMAL(15,2),
  maximum_members INTEGER DEFAULT 50,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  next_contribution_date DATE,
  
  -- Settings
  is_private BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  allow_early_withdrawal BOOLEAN DEFAULT FALSE,
  penalty_rate DECIMAL(5,2) DEFAULT 0, -- Percentage
  
  -- Admin
  created_by UUID REFERENCES users(id),
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role member_role DEFAULT 'member',
  status member_status DEFAULT 'pending',
  
  -- Financial tracking
  total_contributed DECIMAL(15,2) DEFAULT 0,
  total_withdrawn DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  
  -- Dates
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Invitation
  invited_by UUID REFERENCES users(id),
  invitation_token VARCHAR(255),
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(group_id, user_id)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id),
  user_id UUID REFERENCES users(id),
  
  -- Transaction details
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AOA',
  
  -- Payment details
  payment_method payment_method,
  payment_reference VARCHAR(255),
  external_transaction_id VARCHAR(255),
  
  -- Description
  description TEXT,
  notes TEXT,
  
  -- Related transactions
  parent_transaction_id UUID REFERENCES transactions(id),
  
  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES users(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  
  -- Delivery
  channels notification_channel[] DEFAULT '{in_app}',
  status notification_status DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Delivery tracking
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Related entities
  group_id UUID REFERENCES groups(id),
  transaction_id UUID REFERENCES transactions(id),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP (One-Time Password) table
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- OTP details
  type otp_type NOT NULL,
  code_hash VARCHAR(255) NOT NULL, -- Hashed OTP code
  status otp_status DEFAULT 'pending',
  
  -- Contact info
  email VARCHAR(255),
  phone_number VARCHAR(20),
  
  -- Expiry and attempts
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Usage tracking
  verified_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configuration table
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  
  -- Action details
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  
  -- Device info
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Groups indexes
CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_type ON groups(group_type);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_created_at ON groups(created_at);
CREATE INDEX idx_groups_is_private ON groups(is_private);

-- Group members indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at);

-- Transactions indexes
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- OTPs indexes
CREATE INDEX idx_otps_user_id ON otps(user_id);
CREATE INDEX idx_otps_type ON otps(type);
CREATE INDEX idx_otps_status ON otps(status);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_phone ON otps(phone_number);

-- System config indexes
CREATE INDEX idx_system_config_key ON system_config(key);
CREATE INDEX idx_system_config_is_public ON system_config(is_public);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Refresh tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);
CREATE INDEX idx_refresh_tokens_device_id ON refresh_tokens(device_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for common operations

-- Function to get user's active groups
CREATE OR REPLACE FUNCTION get_user_active_groups(user_uuid UUID)
RETURNS TABLE (
  group_id UUID,
  group_name VARCHAR(255),
  group_type group_type,
  member_role member_role,
  total_contributed DECIMAL(15,2),
  current_balance DECIMAL(15,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.name,
    g.group_type,
    gm.role,
    gm.total_contributed,
    gm.current_balance
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = user_uuid
    AND gm.status = 'active'
    AND g.status = 'active'
    AND g.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate group statistics
CREATE OR REPLACE FUNCTION get_group_statistics(group_uuid UUID)
RETURNS TABLE (
  total_members INTEGER,
  active_members INTEGER,
  total_contributions DECIMAL(15,2),
  average_contribution DECIMAL(15,2),
  completion_percentage DECIMAL(5,2)
) AS $$
DECLARE
  target_amount DECIMAL(15,2);
BEGIN
  -- Get target amount
  SELECT g.target_amount INTO target_amount
  FROM groups g
  WHERE g.id = group_uuid;
  
  RETURN QUERY
  SELECT 
    COUNT(gm.id)::INTEGER as total_members,
    COUNT(CASE WHEN gm.status = 'active' THEN 1 END)::INTEGER as active_members,
    COALESCE(SUM(gm.total_contributed), 0) as total_contributions,
    COALESCE(AVG(gm.total_contributed), 0) as average_contribution,
    CASE 
      WHEN target_amount > 0 THEN 
        LEAST((COALESCE(SUM(gm.total_contributed), 0) / target_amount * 100), 100)
      ELSE 0
    END as completion_percentage
  FROM group_members gm
  WHERE gm.group_id = group_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert default system configuration
INSERT INTO system_config (key, value, description, is_public) VALUES
('app_name', '"KIXIKILA"', 'Application name', true),
('app_version', '"1.0.0"', 'Application version', true),
('maintenance_mode', 'false', 'Maintenance mode flag', true),
('max_groups_per_user', '10', 'Maximum groups per regular user', true),
('max_groups_per_vip', '50', 'Maximum groups per VIP user', true),
('default_contribution_frequency', '"monthly"', 'Default contribution frequency', true),
('min_group_members', '2', 'Minimum members required for a group', true),
('max_group_members', '50', 'Maximum members allowed in a group', true),
('otp_expiry_minutes', '10', 'OTP expiry time in minutes', false),
('max_login_attempts', '5', 'Maximum failed login attempts before lockout', false),
('lockout_duration_minutes', '30', 'Account lockout duration in minutes', false),
('jwt_expiry_hours', '24', 'JWT token expiry in hours', false),
('refresh_token_expiry_days', '30', 'Refresh token expiry in days', false),
('notification_batch_size', '100', 'Notification processing batch size', false),
('file_upload_max_size_mb', '10', 'Maximum file upload size in MB', true),
('supported_currencies', '["AOA", "USD", "EUR"]', 'Supported currencies', true),
('default_currency', '"AOA"', 'Default currency', true),
('stripe_webhook_tolerance', '300', 'Stripe webhook timestamp tolerance in seconds', false),
('sms_rate_limit_per_hour', '10', 'SMS rate limit per user per hour', false),
('email_rate_limit_per_hour', '20', 'Email rate limit per user per hour', false);

-- Create Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Groups policies
CREATE POLICY "Users can view groups they are members of" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id::text = auth.uid()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid()::text = created_by::text);

CREATE POLICY "Group admins can update their groups" ON groups
  FOR UPDATE USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id::text = auth.uid()::text 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Group members policies
CREATE POLICY "Users can view group members of their groups" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id::text = auth.uid()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own membership" ON group_members
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Transactions policies
CREATE POLICY "Users can view transactions of their groups" ON transactions
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id::text = auth.uid()::text 
      AND status = 'active'
    )
  );

CREATE POLICY "Users can create their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- OTPs policies
CREATE POLICY "Users can view their own OTPs" ON otps
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Refresh tokens policies
CREATE POLICY "Users can view their own refresh tokens" ON refresh_tokens
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Create views for common queries

-- Active groups view
CREATE VIEW active_groups AS
SELECT 
  g.*,
  COUNT(gm.id) as member_count,
  SUM(gm.total_contributed) as total_contributions,
  CASE 
    WHEN g.target_amount > 0 THEN 
      LEAST((SUM(gm.total_contributed) / g.target_amount * 100), 100)
    ELSE 0
  END as completion_percentage
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'active'
WHERE g.status = 'active' AND g.deleted_at IS NULL
GROUP BY g.id;

-- User statistics view
CREATE VIEW user_statistics AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.role,
  u.status,
  COUNT(DISTINCT gm.group_id) as total_groups,
  COUNT(DISTINCT CASE WHEN gm.status = 'active' THEN gm.group_id END) as active_groups,
  COALESCE(SUM(gm.total_contributed), 0) as total_contributed,
  COALESCE(SUM(gm.total_withdrawn), 0) as total_withdrawn,
  COALESCE(SUM(gm.current_balance), 0) as current_balance
FROM users u
LEFT JOIN group_members gm ON u.id = gm.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.full_name, u.email, u.role, u.status;

-- Recent transactions view
CREATE VIEW recent_transactions AS
SELECT 
  t.*,
  u.full_name as user_name,
  g.name as group_name
FROM transactions t
JOIN users u ON t.user_id = u.id
LEFT JOIN groups g ON t.group_id = g.id
ORDER BY t.created_at DESC;

COMMIT;