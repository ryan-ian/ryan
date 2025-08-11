# Database Migration: Add Rejection Reason to Bookings

This migration adds support for facility managers to provide rejection reasons when declining booking requests.

## Migration File
- `add_rejection_reason_to_bookings.sql`

## Changes Made

### 1. Database Schema Changes
- Added `rejection_reason` column to the `bookings` table (TEXT, nullable)
- Added column comment for documentation
- Updated the `active_pending_bookings` view to include the new column

### 2. Security & Permissions
- Added RLS policy allowing facility managers to update rejection reasons
- Created secure function `update_booking_with_rejection()` for safe status updates
- Granted appropriate permissions to authenticated users

### 3. Performance Optimization
- Added index on `rejection_reason` column for better query performance

## How to Apply the Migration

### Option 1: Using Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_rejection_reason_to_bookings.sql`
4. Execute the migration

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your PostgreSQL database and execute the migration file directly.

## Verification

After applying the migration, verify the changes:

```sql
-- Check if the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name = 'rejection_reason';

-- Check if the view was updated
\d+ active_pending_bookings

-- Test the new function
SELECT public.update_booking_with_rejection(
  'test-booking-id'::UUID, 
  'cancelled', 
  'Test rejection reason'
);
```

## Application Changes

The following application components have been updated to support rejection reasons:

### Frontend Components
- `app/facility-manager/page.tsx` - Added rejection reason input to dashboard
- `app/facility-manager/bookings/page.tsx` - Already had rejection reason support
- `app/conference-room-booking/bookings/booking-details-modal.tsx` - Display rejection reasons
- `components/bookings/booking-details-modal-modern.tsx` - Display rejection reasons

### Type Definitions
- `types/supabase.ts` - Updated Supabase types
- `lib/api-client.ts` - Updated API client types
- `types/index.ts` - Already included rejection_reason field

### API Routes
- Existing API routes already support the rejection_reason parameter

## Usage

### For Facility Managers
1. When rejecting a booking, a dialog will appear with a textarea
2. Enter the reason for rejection (optional but recommended)
3. The rejection reason will be stored and displayed to the user

### For Users
1. Rejected bookings will show the rejection reason in booking details
2. The reason appears in both the booking details modal and booking cards
3. Users can see why their booking was rejected

## Rollback

If you need to rollback this migration:

```sql
-- Remove the column
ALTER TABLE public.bookings DROP COLUMN IF EXISTS rejection_reason;

-- Drop the function
DROP FUNCTION IF EXISTS public.update_booking_with_rejection(UUID, TEXT, TEXT);

-- Recreate the view without rejection_reason
-- (You'll need to restore the original view definition)
```

## Notes

- The `rejection_reason` field is nullable and optional
- Only facility managers and admins can update booking status and rejection reasons
- The rejection reason is only stored when a booking is cancelled/rejected
- Existing bookings are not affected by this migration
- The migration includes proper error handling and logging
