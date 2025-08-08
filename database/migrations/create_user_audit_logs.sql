-- Create user audit logs table for tracking user management actions
CREATE TABLE IF NOT EXISTS user_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'deleted', 'activated', 'deactivated', 
    'suspended', 'locked', 'unlocked', 'role_changed', 'password_reset'
  )),
  details JSONB DEFAULT '{}',
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_performed_by ON user_audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_action ON user_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_performed_at ON user_audit_logs(performed_at DESC);

-- Enable Row Level Security
ALTER TABLE user_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON user_audit_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON user_audit_logs
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Only admins can insert audit logs (through functions)
CREATE POLICY "Only admins can insert audit logs" ON user_audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Add additional columns to users table for enhanced tracking
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the status check constraint to include new statuses
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users ADD CONSTRAINT users_status_check 
  CHECK (status IN ('active', 'inactive', 'suspended', 'locked'));

-- Create function to automatically log user changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if this is an actual change (not initial creation via trigger)
  IF TG_OP = 'UPDATE' AND OLD IS DISTINCT FROM NEW THEN
    INSERT INTO user_audit_logs (
      user_id,
      action,
      details,
      performed_by
    ) VALUES (
      NEW.id,
      'updated',
      jsonb_build_object(
        'old_values', to_jsonb(OLD),
        'new_values', to_jsonb(NEW),
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(OLD) ->> key IS DISTINCT FROM value::text
        )
      ),
      COALESCE(NEW.updated_by, auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_log_user_changes ON public.users;
CREATE TRIGGER trigger_log_user_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();

-- Create function to clean up old audit logs (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_audit_logs 
  WHERE performed_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT ON user_audit_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create view for audit log summary
CREATE OR REPLACE VIEW user_audit_summary AS
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(ual.id) as total_actions,
  MAX(ual.performed_at) as last_action,
  COUNT(CASE WHEN ual.action = 'created' THEN 1 END) as created_count,
  COUNT(CASE WHEN ual.action = 'updated' THEN 1 END) as updated_count,
  COUNT(CASE WHEN ual.action = 'deleted' THEN 1 END) as deleted_count,
  COUNT(CASE WHEN ual.action IN ('suspended', 'locked') THEN 1 END) as security_actions
FROM public.users u
LEFT JOIN user_audit_logs ual ON u.id = ual.user_id
GROUP BY u.id, u.name, u.email;

-- Grant access to the view
GRANT SELECT ON user_audit_summary TO authenticated;
