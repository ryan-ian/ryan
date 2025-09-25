-- Migration: Create meeting_invitations table for tracking meeting invitations
-- This table stores invitations sent for approved bookings

-- Create the meeting_invitations table
CREATE TABLE IF NOT EXISTS public.meeting_invitations (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_email VARCHAR(255) NOT NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status = ANY (ARRAY[
    'pending'::text,
    'accepted'::text,
    'declined'::text
  ])),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT meeting_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_invitations_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT meeting_invitations_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Ensure unique invitation per booking per email
  CONSTRAINT meeting_invitations_booking_email_unique UNIQUE (booking_id, invitee_email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_booking_id ON public.meeting_invitations(booking_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_organizer_id ON public.meeting_invitations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_invitee_email ON public.meeting_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_status ON public.meeting_invitations(status);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_invited_at ON public.meeting_invitations(invited_at);

-- Add email validation constraint
ALTER TABLE public.meeting_invitations 
ADD CONSTRAINT meeting_invitations_email_format_check 
CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meeting_invitations_updated_at 
  BEFORE UPDATE ON public.meeting_invitations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view invitations for their own bookings
CREATE POLICY "Users can view invitations for their own bookings" 
  ON public.meeting_invitations FOR SELECT 
  USING (
    organizer_id = auth.uid() OR
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Users can create invitations for their own approved bookings
CREATE POLICY "Users can create invitations for their own approved bookings"
  ON public.meeting_invitations FOR INSERT
  WITH CHECK (
    organizer_id = auth.uid() AND
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- Users can update invitations for their own bookings
CREATE POLICY "Users can update invitations for their own bookings"
  ON public.meeting_invitations FOR UPDATE
  USING (
    organizer_id = auth.uid() OR
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Users can delete invitations for their own bookings
CREATE POLICY "Users can delete invitations for their own bookings"
  ON public.meeting_invitations FOR DELETE
  USING (
    organizer_id = auth.uid() OR
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON public.meeting_invitations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Admins can manage all invitations
CREATE POLICY "Admins can manage all invitations"
  ON public.meeting_invitations FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view invitations for bookings in their facilities
CREATE POLICY "Facility managers can view invitations for their facilities"
  ON public.meeting_invitations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT f.manager_id 
      FROM public.facilities f
      JOIN public.rooms r ON f.id = r.facility_id
      JOIN public.bookings b ON r.id = b.room_id
      WHERE b.id = booking_id
    )
  );

-- Add comment to table
COMMENT ON TABLE public.meeting_invitations IS 'Stores meeting invitations sent for approved bookings';
COMMENT ON COLUMN public.meeting_invitations.booking_id IS 'Reference to the booking for which invitation is sent';
COMMENT ON COLUMN public.meeting_invitations.organizer_id IS 'User who created the booking and sent the invitation';
COMMENT ON COLUMN public.meeting_invitations.invitee_email IS 'Email address of the person being invited';
COMMENT ON COLUMN public.meeting_invitations.status IS 'Status of the invitation: pending, accepted, declined';
COMMENT ON COLUMN public.meeting_invitations.invited_at IS 'Timestamp when the invitation was sent';
