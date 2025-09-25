-- Master Migration Script: Payment System Integration
-- Run this script to execute all payment-related database migrations
-- 
-- IMPORTANT: Run these migrations in order!
-- 
-- Usage:
-- 1. Copy and paste each section into Supabase SQL Editor
-- 2. Run one section at a time
-- 3. Verify each migration before proceeding to the next

-- =============================================================================
-- MIGRATION 1: Create Payments Table
-- =============================================================================

-- Migration: Create payments table for payment transactions
-- This table tracks all payment transactions made through Paystack

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(50) NOT NULL CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'success'::text, 
    'failed'::text, 
    'refunded'::text
  ])),
  payment_method VARCHAR(50), -- mobile_money, card, ussd, bank_transfer
  mobile_network VARCHAR(50), -- mtn, vodafone, airteltigo
  mobile_number VARCHAR(20),
  paystack_response JSONB, -- Store full Paystack response
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_paystack_reference ON public.payments(paystack_reference);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment records
CREATE POLICY "Users can view their own payments" 
  ON public.payments FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admins can view all payment records
CREATE POLICY "Admins can view all payments" 
  ON public.payments FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view payments for their facilities
CREATE POLICY "Facility managers can view facility payments" 
  ON public.payments FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'facility_manager'
    ) AND
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Only system can insert payment records (via API)
CREATE POLICY "System can insert payments" 
  ON public.payments FOR INSERT 
  WITH CHECK (false);

-- Only system can update payment records (via API)
CREATE POLICY "System can update payments" 
  ON public.payments FOR UPDATE 
  USING (false);

-- Only system can delete payment records (via API)
CREATE POLICY "System can delete payments" 
  ON public.payments FOR DELETE 
  USING (false);

-- =============================================================================
-- MIGRATION 2: Create Refunds Table
-- =============================================================================

-- Migration: Create refunds table for refund tracking
-- This table tracks all refund requests and their status

CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  paystack_refund_id VARCHAR(255), -- Paystack's refund transaction ID
  status VARCHAR(50) NOT NULL CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'processing'::text, 
    'completed'::text, 
    'failed'::text
  ])),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  initiated_by UUID REFERENCES public.users(id), -- Who initiated the refund
  
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE,
  CONSTRAINT refunds_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT refunds_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_created_at ON public.refunds(created_at);
CREATE INDEX idx_refunds_paystack_refund_id ON public.refunds(paystack_refund_id);

-- Add RLS policies
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund records
CREATE POLICY "Users can view their own refunds" 
  ON public.refunds FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admins and facility managers can view refunds for their facilities
CREATE POLICY "Facility managers can view facility refunds" 
  ON public.refunds FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    ) OR
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Only system can insert refund records (via API)
CREATE POLICY "System can insert refunds" 
  ON public.refunds FOR INSERT 
  WITH CHECK (false);

-- Only system can update refund records (via API)
CREATE POLICY "System can update refunds" 
  ON public.refunds FOR UPDATE 
  USING (false);

-- Only system can delete refund records (via API)
CREATE POLICY "System can delete refunds" 
  ON public.refunds FOR DELETE 
  USING (false);

-- =============================================================================
-- MIGRATION 3: Update Bookings Table with Payment Fields
-- =============================================================================

-- First, update the status constraint to include new payment statuses
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'approved'::text, 
    'payment_pending'::text, 
    'paid'::text, 
    'confirmed'::text, 
    'cancelled'::text, 
    'completed'::text
]));

-- Add payment-related fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'not_required' 
    CHECK (payment_status = ANY (ARRAY[
        'not_required'::text, 
        'pending'::text, 
        'processing'::text, 
        'paid'::text, 
        'failed'::text, 
        'refunded'::text
    ])),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON public.bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_paystack_reference ON public.bookings(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_expires_at ON public.bookings(payment_expires_at);

-- Update existing bookings to have appropriate payment status
UPDATE public.bookings 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL;

-- =============================================================================
-- MIGRATION 4: Update Facilities Table with Split Payment Fields
-- =============================================================================

-- Add split payment fields to facilities table
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS paystack_subaccount_code VARCHAR(255),
ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS settlement_bank VARCHAR(255),
ADD COLUMN IF NOT EXISTS settlement_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS settlement_account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_setup_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subaccount_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_settlement_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_facilities_paystack_subaccount ON public.facilities(paystack_subaccount_code);
CREATE INDEX IF NOT EXISTS idx_facilities_payment_setup ON public.facilities(payment_setup_completed);
CREATE INDEX IF NOT EXISTS idx_facilities_manager_payment ON public.facilities(manager_id, payment_setup_completed);

-- Add constraint to ensure commission percentage is reasonable
ALTER TABLE public.facilities 
ADD CONSTRAINT IF NOT EXISTS facilities_commission_percentage_check 
CHECK (commission_percentage >= 0 AND commission_percentage <= 50);

-- Update existing facilities to have default commission
UPDATE public.facilities 
SET commission_percentage = 10.00 
WHERE commission_percentage IS NULL;

-- =============================================================================
-- MIGRATION 5: Create Room Pricing History Table
-- =============================================================================

CREATE TABLE public.room_pricing_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  changed_by UUID NOT NULL,
  change_reason TEXT,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT room_pricing_history_pkey PRIMARY KEY (id),
  CONSTRAINT room_pricing_history_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_pricing_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_room_pricing_history_room_id ON public.room_pricing_history(room_id);
CREATE INDEX idx_room_pricing_history_changed_by ON public.room_pricing_history(changed_by);
CREATE INDEX idx_room_pricing_history_effective_from ON public.room_pricing_history(effective_from);

-- Add RLS policies
ALTER TABLE public.room_pricing_history ENABLE ROW LEVEL SECURITY;

-- Facility managers can view pricing history for their rooms
CREATE POLICY "Facility managers can view room pricing history" 
  ON public.room_pricing_history FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    ) OR
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- =============================================================================
-- MIGRATION 6: Create Payment Analytics Table
-- =============================================================================

CREATE TABLE public.payment_analytics (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  facility_id UUID,
  room_id UUID,
  date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  refunded_payments INTEGER DEFAULT 0,
  average_booking_value DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'GHS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT payment_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT payment_analytics_facility_id_fkey 
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE,
  CONSTRAINT payment_analytics_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  
  UNIQUE(facility_id, room_id, date)
);

-- Add indexes for analytics queries
CREATE INDEX idx_payment_analytics_date ON public.payment_analytics(date);
CREATE INDEX idx_payment_analytics_facility_room ON public.payment_analytics(facility_id, room_id);
CREATE INDEX idx_payment_analytics_facility_date ON public.payment_analytics(facility_id, date);

-- Add RLS policies
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can view all analytics
CREATE POLICY "Admins can view all payment analytics" 
  ON public.payment_analytics FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view analytics for their facilities
CREATE POLICY "Facility managers can view their analytics" 
  ON public.payment_analytics FOR SELECT 
  USING (
    facility_id IN (
      SELECT id FROM public.facilities WHERE manager_id = auth.uid()
    )
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these queries to verify the migrations were successful:

-- Check if all tables were created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'refunds', 'room_pricing_history', 'payment_analytics')
ORDER BY table_name;

-- Check if bookings table was updated with payment fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bookings' 
  AND column_name IN ('payment_id', 'total_cost', 'payment_status', 'payment_reference')
ORDER BY column_name;

-- Check if facilities table was updated with split payment fields
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'facilities' 
  AND column_name IN ('paystack_subaccount_code', 'commission_percentage', 'payment_setup_completed')
ORDER BY column_name;

-- Check indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%payment%'
ORDER BY tablename, indexname;
