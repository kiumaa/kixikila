-- Audit Logs Table Schema
-- This table stores security audit events for monitoring and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    resource VARCHAR(100),
    action VARCHAR(100),
    details JSONB,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id VARCHAR(255),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_timestamp ON audit_logs(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_timestamp ON audit_logs(risk_level, timestamp DESC);

-- Partial index for failed events
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_events ON audit_logs(timestamp DESC) WHERE success = false;

-- Partial index for high-risk events
CREATE INDEX IF NOT EXISTS idx_audit_logs_high_risk ON audit_logs(timestamp DESC) WHERE risk_level IN ('HIGH', 'CRITICAL');

-- Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy: System can insert audit logs (for service account)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Function to automatically delete old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Delete audit logs older than 2 years, except CRITICAL events
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '2 years'
    AND risk_level != 'CRITICAL';
    
    -- Delete CRITICAL events older than 5 years
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '5 years'
    AND risk_level = 'CRITICAL';
END;
$$ LANGUAGE plpgsql;

-- Function to get audit statistics
CREATE OR REPLACE FUNCTION get_audit_stats(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_events BIGINT,
    failed_events BIGINT,
    critical_events BIGINT,
    high_risk_events BIGINT,
    unique_users BIGINT,
    unique_ips BIGINT,
    top_event_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE success = false) as failed_events,
        COUNT(*) FILTER (WHERE risk_level = 'CRITICAL') as critical_events,
        COUNT(*) FILTER (WHERE risk_level IN ('HIGH', 'CRITICAL')) as high_risk_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT ip_address) as unique_ips,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'event_type', event_type,
                    'count', count
                ) ORDER BY count DESC
            )
            FROM (
                SELECT event_type, COUNT(*) as count
                FROM audit_logs
                WHERE timestamp BETWEEN start_date AND end_date
                GROUP BY event_type
                ORDER BY count DESC
                LIMIT 10
            ) top_events
        ) as top_event_types
    FROM audit_logs
    WHERE timestamp BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
    lookback_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    ip_address INET,
    user_id UUID,
    suspicious_patterns JSONB,
    risk_score INTEGER,
    event_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH suspicious_ips AS (
        SELECT 
            al.ip_address,
            al.user_id,
            COUNT(*) as event_count,
            COUNT(*) FILTER (WHERE success = false) as failed_count,
            COUNT(*) FILTER (WHERE risk_level IN ('HIGH', 'CRITICAL')) as high_risk_count,
            COUNT(DISTINCT al.user_id) as unique_users,
            array_agg(DISTINCT al.event_type) as event_types
        FROM audit_logs al
        WHERE al.timestamp > NOW() - (lookback_hours || ' hours')::INTERVAL
        GROUP BY al.ip_address, al.user_id
    )
    SELECT 
        si.ip_address,
        si.user_id,
        jsonb_build_object(
            'high_failure_rate', si.failed_count::float / si.event_count > 0.5,
            'multiple_users', si.unique_users > 3,
            'high_volume', si.event_count > 100,
            'diverse_events', array_length(si.event_types, 1) > 5
        ) as suspicious_patterns,
        (
            CASE WHEN si.failed_count::float / si.event_count > 0.5 THEN 30 ELSE 0 END +
            CASE WHEN si.unique_users > 3 THEN 25 ELSE 0 END +
            CASE WHEN si.event_count > 100 THEN 20 ELSE 0 END +
            CASE WHEN si.high_risk_count > 5 THEN 25 ELSE 0 END
        ) as risk_score,
        si.event_count
    FROM suspicious_ips si
    WHERE (
        si.failed_count::float / si.event_count > 0.3 OR
        si.unique_users > 2 OR
        si.event_count > 50 OR
        si.high_risk_count > 3
    )
    ORDER BY risk_score DESC, si.event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs();');

-- Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO service_role;
GRANT EXECUTE ON FUNCTION get_audit_stats TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs TO service_role;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Security audit log for tracking all significant events in the application';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event being logged (LOGIN_SUCCESS, ADMIN_ACTION, etc.)';
COMMENT ON COLUMN audit_logs.risk_level IS 'Risk assessment of the event (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context and metadata for the event';
COMMENT ON FUNCTION get_audit_stats IS 'Returns audit statistics for a given time period';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Analyzes recent audit logs to identify suspicious patterns';
COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Removes old audit logs according to retention policy';