-- Fix email format check constraint issue
-- The constraint is too strict for valid email addresses

-- 1. First, let's see what constraints exist on meeting_invitations
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'meeting_invitations' 
    AND tc.constraint_type = 'CHECK';

-- 2. Drop the problematic email format check constraint
-- (We'll replace it with a better one or remove it entirely)
ALTER TABLE public.meeting_invitations 
DROP CONSTRAINT IF EXISTS meeting_invitations_email_format_check;

-- 3. Optional: Add a more permissive email format check
-- (You can run this if you want some email validation, or skip it)
/*
ALTER TABLE public.meeting_invitations 
ADD CONSTRAINT meeting_invitations_email_format_check 
CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
*/

-- 4. Re-enable RLS after fixing the constraint
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;
