-- Migration: Update facilities table with split payment fields
-- This adds Paystack subaccount information for automatic payment splitting

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
ADD CONSTRAINT facilities_commission_percentage_check 
CHECK (commission_percentage >= 0 AND commission_percentage <= 50);

-- Update existing facilities to have default commission
UPDATE public.facilities 
SET commission_percentage = 10.00 
WHERE commission_percentage IS NULL;

COMMENT ON COLUMN public.facilities.paystack_subaccount_code IS 'Paystack subaccount code for automatic payment splitting';
COMMENT ON COLUMN public.facilities.commission_percentage IS 'Percentage commission taken by platform (default 10%)';
COMMENT ON COLUMN public.facilities.settlement_bank IS 'Bank name for facility manager payments';
COMMENT ON COLUMN public.facilities.settlement_account_number IS 'Bank account number for settlements';
COMMENT ON COLUMN public.facilities.settlement_account_name IS 'Account holder name for settlements';
COMMENT ON COLUMN public.facilities.payment_setup_completed IS 'Whether facility manager has completed payment setup';
COMMENT ON COLUMN public.facilities.subaccount_created_at IS 'When Paystack subaccount was created';
COMMENT ON COLUMN public.facilities.last_settlement_date IS 'Date of last payment settlement';

