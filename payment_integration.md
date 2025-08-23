# Payment Integration Plan for Conference Hub

## Overview
This document outlines the comprehensive plan to integrate Paystack payments into the Conference Hub application using Ghana Cedis (GHS) currency. The integration will add a payment layer to the existing booking flow while maintaining backward compatibility.

## Current vs New Booking Flow

### Current Flow
```
User Request → pending → Manager Approval → confirmed → completed
```

### New Payment Flow
```
User Request → pending → Manager Approval → approved → Payment Required → payment_pending → paid → confirmed → completed
```

---

## STEP 1: Database Schema Updates (Week 1)

### 1.1 Rooms Table Modifications
**Goal**: Add pricing capabilities to existing rooms

**Migration Script**:
```sql
-- Add pricing fields to existing rooms table
ALTER TABLE public.rooms 
ADD COLUMN price_per_hour DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN currency VARCHAR(3) DEFAULT 'GHS',
ADD COLUMN payment_required BOOLEAN DEFAULT true,
ADD COLUMN pricing_active BOOLEAN DEFAULT true,
ADD COLUMN price_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN price_updated_by UUID REFERENCES public.users(id);
```

**Expected Outcome**: 
- [ ] All existing rooms have default pricing fields
- [ ] New rooms can be created with pricing information
- [ ] Price history tracking is enabled

### 1.2 Bookings Table Modifications
**Goal**: Extend booking status to support payment flow

**Migration Script**:
```sql
-- Modify existing status constraint to include new payment statuses
ALTER TABLE public.bookings 
DROP CONSTRAINT bookings_status_check;

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

-- Add payment-related fields
ALTER TABLE public.bookings 
ADD COLUMN total_amount DECIMAL(10,2),
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'not_required' 
    CHECK (payment_status = ANY (ARRAY[
        'not_required'::text, 
        'pending'::text, 
        'processing'::text, 
        'paid'::text, 
        'failed'::text, 
        'refunded'::text
    ])),
ADD COLUMN payment_reference VARCHAR(255),
ADD COLUMN paystack_reference VARCHAR(255),
ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE;
```

**Expected Outcome**:
- [ ] Existing bookings maintain current status
- [ ] New booking statuses are available
- [ ] Payment tracking fields are ready

### 1.3 New Tables Creation
**Goal**: Create supporting tables for payment functionality

**Migration Script**:
```sql
-- Payment transactions table
CREATE TABLE public.payment_transactions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    payment_reference VARCHAR(255) UNIQUE,
    paystack_reference VARCHAR(255),
    paystack_transaction_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' 
        CHECK (status = ANY (ARRAY[
            'pending'::text, 
            'processing'::text, 
            'success'::text, 
            'failed'::text, 
            'abandoned'::text, 
            'cancelled'::text
        ])),
    payment_method VARCHAR(50),
    gateway_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT payment_transactions_booking_id_fkey 
        FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
    CONSTRAINT payment_transactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Room pricing history
CREATE TABLE public.room_pricing_history (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL,
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
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

-- Payment analytics summary
CREATE TABLE public.payment_analytics (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    facility_id UUID,
    room_id UUID,
    date DATE NOT NULL,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    successful_payments INTEGER DEFAULT 0,
    failed_payments INTEGER DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'GHS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT payment_analytics_pkey PRIMARY KEY (id),
    CONSTRAINT payment_analytics_facility_id_fkey 
        FOREIGN KEY (facility_id) REFERENCES public.facilities(id),
    CONSTRAINT payment_analytics_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES public.rooms(id),
    UNIQUE(facility_id, room_id, date)
);
```

**Expected Outcome**:
- [ ] Payment transactions can be tracked
- [ ] Room pricing history is maintained
- [ ] Analytics data structure is ready

### 1.4 Performance Indexes
**Goal**: Optimize database queries for payment operations

**Migration Script**:
```sql
-- Payment-related indexes
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_payment_reference ON public.bookings(payment_reference);
CREATE INDEX idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_reference ON public.payment_transactions(payment_reference);
CREATE INDEX idx_rooms_payment_required ON public.rooms(payment_required);
CREATE INDEX idx_payment_analytics_date ON public.payment_analytics(date);
CREATE INDEX idx_payment_analytics_facility_room ON public.payment_analytics(facility_id, room_id);
```

**Expected Outcome**:
- [ ] Payment queries are optimized
- [ ] Analytics queries perform well
- [ ] Database performance is maintained

**Step 1 Completion Checklist**:
- [ ] All database migrations executed successfully
- [ ] Existing data integrity maintained
- [ ] New tables created and indexed
- [ ] Database performance optimized

---

## STEP 2: Environment Setup & Dependencies (Week 1)

### 2.1 Paystack Configuration
**Goal**: Set up Paystack account and configuration for Ghana

**Actions Required**:
1. Create Paystack account (Ghana)
2. Obtain API keys (test and live)
3. Configure webhook endpoints
4. Set up environment variables

**Environment Variables**:
```env
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Payment Configuration
DEFAULT_CURRENCY=GHS
PAYMENT_TIMEOUT_MINUTES=15
MIN_PAYMENT_AMOUNT=5.00
MAX_PAYMENT_AMOUNT=5000.00
```

**Expected Outcome**:
- [ ] Paystack account configured for Ghana
- [ ] Test API keys working
- [ ] Environment variables set

### 2.2 Dependencies Installation
**Goal**: Install required packages for payment integration

**Package Installation**:
```bash
npm install @paystack/inline-js
npm install @types/paystack
npm install crypto-js
npm install @types/crypto-js
```

**Expected Outcome**:
- [ ] All payment-related packages installed
- [ ] TypeScript types available
- [ ] Dependencies compatible with existing project

**Step 2 Completion Checklist**:
- [ ] Paystack account configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Test payment successful

---

## STEP 3: Type Definitions Update (Week 2)

### 3.1 Update Existing Types
**Goal**: Extend existing interfaces to support payment functionality

**Files to Update**: `types/index.ts`

**Room Interface Updates**:
```typescript
export interface Room {
  // ... existing fields
  price_per_hour: number;
  currency: string;
  payment_required: boolean;
  pricing_active: boolean;
  price_updated_at: string;
  price_updated_by?: string;
}
```

**Booking Interface Updates**:
```typescript
export interface Booking {
  // ... existing fields
  total_amount?: number;
  payment_status: PaymentStatus;
  payment_reference?: string;
  paystack_reference?: string;
  payment_date?: string;
  payment_method?: string;
  payment_expires_at?: string;
}
```

### 3.2 New Type Definitions
**Goal**: Create new interfaces for payment functionality

**New Types**:
```typescript
export type PaymentStatus = 
  | 'not_required' 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export type BookingStatus = 
  | 'pending' 
  | 'approved' 
  | 'payment_pending' 
  | 'paid' 
  | 'confirmed' 
  | 'cancelled' 
  | 'completed';

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_reference: string;
  paystack_reference?: string;
  paystack_transaction_id?: string;
  status: PaymentTransactionStatus;
  payment_method?: string;
  gateway_response?: any;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export type PaymentTransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'abandoned' 
  | 'cancelled';

export interface RoomPricingHistory {
  id: string;
  room_id: string;
  old_price?: number;
  new_price: number;
  currency: string;
  changed_by: string;
  change_reason?: string;
  effective_from: string;
  created_at: string;
}

export interface PaymentAnalytics {
  id: string;
  facility_id?: string;
  room_id?: string;
  date: string;
  total_revenue: number;
  total_bookings: number;
  successful_payments: number;
  failed_payments: number;
  average_booking_value: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentCalculation {
  startTime: Date;
  endTime: Date;
  pricePerHour: number;
  currency: string;
  totalAmount: number;
  durationHours: number;
}
```

**Expected Outcome**:
- [ ] All existing types updated with payment fields
- [ ] New payment-specific types defined
- [ ] TypeScript compilation successful
- [ ] Type safety maintained throughout application

**Step 3 Completion Checklist**:
- [ ] Type definitions updated
- [ ] No TypeScript compilation errors
- [ ] All payment fields properly typed
- [ ] Existing functionality unaffected

---

## STEP 4: Backend Payment Utilities (Week 2)

### 4.1 Payment Calculation Functions
**Goal**: Create utility functions for payment calculations

**File**: `lib/payment-utils.ts`

**Functions to Implement**:
```typescript
export function calculateBookingAmount(
  startTime: Date, 
  endTime: Date, 
  pricePerHour: number
): PaymentCalculation {
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
  const totalAmount = durationHours * pricePerHour;
  
  return {
    startTime,
    endTime,
    pricePerHour,
    currency: 'GHS',
    totalAmount,
    durationHours
  };
}

export function generatePaymentReference(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `CHB_${timestamp}_${random}`.toUpperCase();
}

export function isPaymentExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getPaymentExpiryTime(minutes: number = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
```

**Expected Outcome**:
- [ ] Payment calculations are accurate
- [ ] Reference generation is unique
- [ ] Expiry logic works correctly
- [ ] Functions are properly tested

### 4.2 Paystack Integration Layer
**Goal**: Create Paystack API integration functions

**File**: `lib/paystack.ts`

**Functions to Implement**:
```typescript
export async function initializePayment(params: {
  email: string;
  amount: number; // in pesewas (GHS * 100)
  reference: string;
  callback_url?: string;
}): Promise<PaystackInitResponse> {
  // Initialize payment with Paystack
}

export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  // Verify payment with Paystack
}

export async function validateWebhook(
  payload: string, 
  signature: string
): Promise<boolean> {
  // Validate webhook signature
}
```

**Expected Outcome**:
- [ ] Paystack API integration working
- [ ] Payment initialization successful
- [ ] Payment verification functional
- [ ] Webhook validation secure

**Step 4 Completion Checklist**:
- [ ] Payment utilities implemented
- [ ] Paystack integration functional
- [ ] All functions tested
- [ ] Error handling implemented

---

## STEP 5: Database Access Layer Updates (Week 2)

### 5.1 Update Existing Functions
**Goal**: Modify existing data access functions to support payments

**File**: `lib/supabase-data.ts`

**Functions to Update**:
- `createBooking()` - Add payment calculation
- `updateBooking()` - Support payment status updates
- `getBookingById()` - Include payment information
- `getRoomById()` - Include pricing information

### 5.2 New Payment Functions
**Goal**: Create new functions for payment operations

**Functions to Implement**:
```typescript
// Payment Transactions
export async function createPaymentTransaction(transaction: Partial<PaymentTransaction>): Promise<PaymentTransaction>
export async function updatePaymentTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<PaymentTransaction>
export async function getPaymentTransactionByReference(reference: string): Promise<PaymentTransaction | null>

// Room Pricing
export async function updateRoomPricing(roomId: string, price: number, updatedBy: string, reason?: string): Promise<Room>
export async function getRoomPricingHistory(roomId: string): Promise<RoomPricingHistory[]>
export async function bulkUpdateRoomPricing(updates: Array<{roomId: string, price: number}>): Promise<void>

// Payment Analytics
export async function updatePaymentAnalytics(date: string, facilityId?: string, roomId?: string): Promise<void>
export async function getPaymentAnalytics(filters: AnalyticsFilters): Promise<PaymentAnalytics[]>
```

**Expected Outcome**:
- [ ] All CRUD operations for payment data
- [ ] Existing functions support payment fields
- [ ] Error handling implemented
- [ ] Performance optimized

**Step 5 Completion Checklist**:
- [ ] Data access functions updated
- [ ] New payment functions implemented
- [ ] Database operations tested
- [ ] Error handling comprehensive

---

## STEP 6: API Endpoints Development (Week 3)

### 6.1 Payment API Routes
**Goal**: Create API endpoints for payment operations

**Files to Create**:
- `app/api/payments/initialize/route.ts`
- `app/api/payments/verify/route.ts`
- `app/api/payments/webhook/route.ts`
- `app/api/payments/status/[reference]/route.ts`

**Key Endpoints**:
```typescript
// POST /api/payments/initialize
// - Create payment transaction
// - Initialize with Paystack
// - Return payment URL

// POST /api/payments/verify
// - Verify payment with Paystack
// - Update booking status
// - Send confirmation

// POST /api/payments/webhook
// - Handle Paystack webhooks
// - Update payment status
// - Trigger notifications
```

### 6.2 Booking Flow API Updates
**Goal**: Update booking endpoints to support payment flow

**Files to Update**:
- `app/api/bookings/[id]/approve/route.ts`
- `app/api/bookings/[id]/route.ts`

**Expected Outcome**:
- [ ] Payment initialization working
- [ ] Payment verification functional
- [ ] Webhook handling secure
- [ ] Booking flow updated

**Step 6 Completion Checklist**:
- [ ] All API endpoints implemented
- [ ] Payment flow working end-to-end
- [ ] Webhook handling tested
- [ ] Error responses proper

---

## STEP 7: Frontend Payment Components (Week 3-4)

### 7.1 Core Payment Components
**Goal**: Create reusable payment components

**Components to Create**:
```typescript
// components/payments/PaymentModal.tsx
// - Paystack payment form
// - Payment status display
// - Error handling

// components/payments/PaymentSummary.tsx  
// - Show booking cost breakdown
// - Display payment details
// - Payment history

// components/payments/PaymentStatus.tsx
// - Payment status indicator
// - Status-specific messaging
// - Action buttons
```

### 7.2 Update Existing Components
**Goal**: Integrate payment information into existing UI

**Components to Update**:
```typescript
// components/RoomCard.tsx
// - Display price per hour
// - Show "Free" for non-paid rooms
// - Price formatting

// components/BookingForm.tsx
// - Calculate and show total cost
// - Payment terms display
// - Cost breakdown

// components/BookingDetails.tsx
// - Payment status section
// - Payment history
// - Payment actions
```

**Expected Outcome**:
- [ ] Payment UI components functional
- [ ] Existing components show pricing
- [ ] User experience smooth
- [ ] Mobile responsive design

**Step 7 Completion Checklist**:
- [ ] Payment components created
- [ ] Existing components updated
- [ ] UI/UX testing completed
- [ ] Mobile compatibility verified

---

## STEP 8: Admin Payment Management (Week 4)

### 8.1 Room Pricing Management
**Goal**: Enable facility managers to set and update room pricing

**Components to Create**:
```typescript
// components/admin/RoomPricingForm.tsx
// - Set price per hour
// - Enable/disable payments
// - Bulk pricing updates

// components/admin/PricingHistory.tsx
// - Show price change history
// - Track who made changes
// - Reason for changes
```

### 8.2 Payment Analytics Dashboard
**Goal**: Provide payment insights to facility managers

**Components to Create**:
```typescript
// components/analytics/PaymentDashboard.tsx
// - Revenue overview
// - Payment success rates
// - Booking statistics

// components/analytics/RevenueChart.tsx
// - Daily/weekly/monthly revenue
// - Room performance comparison
// - Trend analysis
```

**Expected Outcome**:
- [ ] Facility managers can set pricing
- [ ] Analytics dashboard functional
- [ ] Payment insights available
- [ ] Export functionality working

**Step 8 Completion Checklist**:
- [ ] Admin pricing interface complete
- [ ] Analytics dashboard functional
- [ ] Reporting features working
- [ ] Access controls implemented

---

## STEP 9: Integration Testing (Week 5)

### 9.1 Payment Flow Testing
**Goal**: Test complete payment integration end-to-end

**Test Scenarios**:
- [ ] User books paid room successfully
- [ ] Payment failure handling
- [ ] Payment expiry scenarios
- [ ] Manager approval with payment
- [ ] Booking cancellation with refunds

### 9.2 Performance Testing
**Goal**: Ensure payment features don't impact performance

**Performance Checks**:
- [ ] Database query performance
- [ ] Payment API response times
- [ ] Analytics dashboard load times
- [ ] Concurrent payment handling

### 9.3 Security Testing
**Goal**: Verify payment security measures

**Security Checks**:
- [ ] Webhook signature validation
- [ ] Payment verification security
- [ ] Access control for payment data
- [ ] Input sanitization

**Expected Outcome**:
- [ ] All payment flows working correctly
- [ ] Performance meets requirements
- [ ] Security measures effective
- [ ] User experience optimized

**Step 9 Completion Checklist**:
- [ ] End-to-end testing passed
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Bug fixes implemented

---

## STEP 10: Documentation & Training (Week 5)

### 10.1 User Documentation
**Goal**: Create guides for end users

**Documentation to Create**:
- User guide for booking paid rooms
- Payment process explanation
- FAQ for payment issues
- Mobile app usage guide

### 10.2 Admin Documentation
**Goal**: Create guides for facility managers

**Documentation to Create**:
- Room pricing setup guide
- Payment analytics interpretation
- Refund process documentation
- Troubleshooting guide

### 10.3 Developer Documentation
**Goal**: Document technical implementation

**Documentation to Create**:
- API endpoint documentation
- Database schema documentation
- Deployment guide
- Maintenance procedures

**Expected Outcome**:
- [ ] Comprehensive user documentation
- [ ] Admin training materials ready
- [ ] Technical documentation complete
- [ ] Support procedures established

**Step 10 Completion Checklist**:
- [ ] All documentation created
- [ ] Training materials prepared
- [ ] Support procedures defined
- [ ] Knowledge transfer completed

---

## STEP 11: Production Deployment (Week 6)

### 11.1 Pre-deployment Checklist
**Goal**: Ensure readiness for production deployment

**Checklist Items**:
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] Backup procedures verified
- [ ] Monitoring configured
- [ ] Error tracking setup

### 11.2 Deployment Process
**Goal**: Deploy payment features to production

**Deployment Steps**:
1. [ ] Deploy database migrations
2. [ ] Deploy backend API changes
3. [ ] Deploy frontend updates
4. [ ] Configure Paystack live keys
5. [ ] Test payment flow in production
6. [ ] Monitor system health
7. [ ] Enable payment features

### 11.3 Post-deployment Monitoring
**Goal**: Ensure system stability after deployment

**Monitoring Tasks**:
- [ ] Payment success rate monitoring
- [ ] Error rate tracking
- [ ] Performance monitoring
- [ ] User feedback collection

**Expected Outcome**:
- [ ] Payment system live and functional
- [ ] All monitoring in place
- [ ] User adoption tracking
- [ ] Support team ready

**Step 11 Completion Checklist**:
- [ ] Production deployment successful
- [ ] Payment system fully operational
- [ ] Monitoring and alerts configured
- [ ] Support documentation ready

---

## Success Metrics

### Technical Metrics
- [ ] Payment success rate > 95%
- [ ] API response time < 2 seconds
- [ ] Database query performance maintained
- [ ] Zero payment security incidents

### Business Metrics
- [ ] Room booking conversion rate
- [ ] Average booking value
- [ ] Revenue per facility
- [ ] User satisfaction scores

### User Experience Metrics
- [ ] Payment completion rate
- [ ] User support tickets
- [ ] Mobile usage statistics
- [ ] Feature adoption rate

---

## Rollback Plan

### Emergency Rollback Triggers
- Payment success rate < 80%
- Critical security vulnerability
- System performance degradation > 50%
- Data integrity issues

### Rollback Procedure
1. [ ] Disable payment features via feature flag
2. [ ] Revert to previous booking flow
3. [ ] Restore database if necessary
4. [ ] Communicate with users
5. [ ] Investigate and fix issues
6. [ ] Plan re-deployment

---

## Maintenance & Support

### Regular Maintenance Tasks
- [ ] Weekly payment reconciliation
- [ ] Monthly analytics review
- [ ] Quarterly security audit
- [ ] Annual Paystack integration review

### Support Procedures
- [ ] Payment issue escalation process
- [ ] Refund request handling
- [ ] Technical support documentation
- [ ] User communication templates

---

## Conclusion

This payment integration plan provides a comprehensive, step-by-step approach to adding Paystack payment functionality to the Conference Hub application. Each step builds upon the previous one, ensuring a smooth and secure implementation that enhances the booking experience while maintaining system reliability.

The plan is designed to be executed incrementally, allowing for testing and validation at each stage. This approach minimizes risk and ensures that any issues can be identified and resolved before they impact the production system.

