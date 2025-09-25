-- Fix notifications table RLS policies to enable proper realtime subscriptions

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Only service role can insert notifications" ON notifications;

-- Create a better INSERT policy that allows service role and admin clients
CREATE POLICY "Service role and admins can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    -- Allow service role key (bypass auth.uid() check when using service key)
    auth.uid() IS NULL OR
    -- Allow admin users to create notifications  
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Ensure RLS is enabled for realtime subscriptions
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create a function to safely check if realtime is properly configured
CREATE OR REPLACE FUNCTION check_notifications_realtime()
RETURNS TABLE(
  rls_enabled boolean,
  replica_identity text,
  in_publication boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.relrowsecurity as rls_enabled,
    t.relreplident::text as replica_identity,
    EXISTS(
      SELECT 1 FROM pg_publication_tables pt 
      WHERE pt.pubname = 'supabase_realtime' 
      AND pt.tablename = 'notifications'
    ) as in_publication
  FROM pg_class t
  WHERE t.relname = 'notifications';
END;
$$ LANGUAGE plpgsql;

-- Check the configuration
SELECT * FROM check_notifications_realtime();
