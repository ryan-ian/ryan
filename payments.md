## 💳 **Payment System Planning: Paystack Integration with Mobile Money**

### **Overview**
Design a comprehensive payment-first booking system where users pay upfront via Paystack (mobile money), facility managers approve/reject bookings, and automatic refunds are processed for rejections.

### **Payment Flow Architecture**

#### **1. User Booking Flow**
```
User selects room → Date/Time selection → Review booking → 
Payment (Mobile Money) → Booking request sent → 
Facility Manager approval → Confirmation/Refund
```

#### **2. Payment States**
- **Pending Payment**: User hasn't paid yet
- **Payment Processing**: Paystack processing payment
- **Payment Completed**: Money received, booking request sent
- **Booking Approved**: Facility manager approved, room reserved
- **Booking Rejected**: Facility manager rejected, refund initiated
- **Refund Completed**: Money returned to user

### **Technical Implementation Plan**

#### **Phase 1: Paystack Setup & Configuration**
- **Paystack Account Setup**
  - Create Paystack business account
  - Configure mobile money payment channels (MTN, Vodafone, AirtelTigo)
  - Set up webhook endpoints for payment notifications
  - Configure split payment for facility managers

- **Environment Variables**
  ```
  PAYSTACK_PUBLIC_KEY=pk_test_...
  PAYSTACK_SECRET_KEY=sk_test_...
  PAYSTACK_WEBHOOK_SECRET=whsec_...
  ```

#### **Phase 2: Database Schema Extensions**

##### **New Tables**
```sql
-- Payment transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  paystack_reference VARCHAR UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(50) NOT NULL, -- pending, success, failed, refunded
  payment_method VARCHAR(50), -- mobile_money, card
  mobile_network VARCHAR(50), -- mtn, vodafone, airteltigo
  mobile_number VARCHAR(20),
  paystack_response JSONB,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Refund tracking
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id),
  booking_id UUID REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  paystack_refund_id VARCHAR,
  status VARCHAR(50) NOT NULL, -- pending, processing, completed, failed
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

##### **Update Existing Tables**
```sql
-- Add payment fields to bookings
ALTER TABLE bookings ADD COLUMN payment_id UUID REFERENCES payments(id);
ALTER TABLE bookings ADD COLUMN total_cost DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';

-- Add split payment fields to facilities
ALTER TABLE facilities ADD COLUMN paystack_subaccount_code VARCHAR;
ALTER TABLE facilities ADD COLUMN commission_percentage DECIMAL(5,2) DEFAULT 10.00;
```

#### **Phase 3: Paystack Integration Components**

##### **Payment Components**
- **`components/payment/PaymentForm.tsx`**
  - Mobile money payment form
  - Network selection (MTN, Vodafone, AirtelTigo)
  - Phone number input with validation
  - Payment amount display
  - Paystack payment initialization

- **`components/payment/PaymentStatus.tsx`**
  - Real-time payment status tracking
  - Payment confirmation display
  - Error handling for failed payments

##### **Booking Flow Components**
- **`components/booking/BookingReview.tsx`**
  - Booking summary with cost calculation
  - Payment button integration
  - Terms and conditions

- **`components/booking/BookingConfirmation.tsx`**
  - Post-payment booking confirmation
  - Facility manager approval pending status
  - Booking details display

#### **Phase 4: API Routes for Payment Processing**

##### **Payment APIs**
- **`/api/payments/initialize`**
  - Initialize Paystack payment
  - Calculate total cost based on room hourly rate
  - Create payment record
  - Return Paystack payment URL/reference

- **`/api/payments/verify`**
  - Verify payment with Paystack
  - Update payment status
  - Send booking request to facility manager
  - Send notifications

- **`/api/payments/webhook`**
  - Handle Paystack webhooks
  - Update payment status
  - Trigger booking request workflow

##### **Refund APIs**
- **`/api/refunds/initiate`**
  - Initiate refund for rejected bookings
  - Create refund record
  - Call Paystack refund API

- **`/api/refunds/webhook`**
  - Handle refund status updates
  - Update refund records
  - Send user notifications

#### **Phase 5: Facility Manager Approval System**

##### **Approval Interface**
- **`app/facility-manager/bookings/pending/page.tsx`**
  - List pending approval bookings
  - Show payment verification status
  - Approve/reject booking buttons
  - Rejection reason form

##### **Approval Logic**
- **Booking Approval**
  - Mark booking as confirmed
  - Update room availability
  - Send confirmation to user
  - Release payment to facility manager

- **Booking Rejection**
  - Mark booking as cancelled
  - Initiate automatic refund
  - Send rejection notification to user
  - Log rejection reason

#### **Phase 6: Split Payment Configuration**

##### **Facility Manager Onboarding**
- **Paystack Subaccount Creation**
  - Create subaccount for each facility
  - Store subaccount code in facility record
  - Configure commission percentage

##### **Payment Split Logic**
- **Platform Commission**: 10% (configurable)
- **Facility Manager**: 90% (automatically transferred)
- **Split Payment**: Configured in Paystack payment initialization

#### **Phase 7: Mobile Money Integration**

##### **Supported Networks**
- **MTN Mobile Money**
- **Vodafone Cash**
- **AirtelTigo Money**

##### **Payment Flow**
```
User enters phone number → Select network → 
Paystack generates payment → User receives USSD/prompt → 
User authorizes on phone → Payment confirmed → 
Booking request sent
```

#### **Phase 8: Notification System**

##### **User Notifications**
- Payment confirmation
- Booking request sent
- Booking approved/rejected
- Refund processed

##### **Facility Manager Notifications**
- New booking request (with payment verified)
- Payment received notification
- Urgent approval requests

#### **Phase 9: Error Handling & Edge Cases**

##### **Payment Failures**
- Network timeout handling
- Insufficient funds
- Invalid phone numbers
- Payment cancellation by user

##### **Booking Conflicts**
- Room becomes unavailable during payment
- Double booking prevention
- Automatic refund for conflicts

##### **Refund Scenarios**
- Facility manager rejection
- System cancellation
- User cancellation (with penalties)
- Technical failures

### **Security Considerations**

#### **Payment Security**
- Webhook signature verification
- Secure API key management
- PCI compliance for card payments
- Fraud detection integration

#### **Data Protection**
- Encrypt sensitive payment data
- Audit trails for all transactions
- Secure storage of mobile numbers
- GDPR compliance for user data

### **User Experience Design**

#### **Payment UX**
- Clear cost breakdown before payment
- Mobile-optimized payment forms
- Real-time payment status updates
- Clear error messages for failures

#### **Booking UX**
- Transparent approval process
- Estimated approval timeframes
- Easy rebooking for rejections
- Refund status tracking

### **Business Logic Rules**

#### **Payment Rules**
- Payment required before booking submission
- 24-hour payment expiry for incomplete transactions
- Automatic refund for system failures
- Commission split configuration per facility

#### **Approval Rules**
- Facility managers have 24 hours to respond
- Automatic approval for trusted users (future enhancement)
- Rejection requires reason
- Refund processing within 3-5 business days

### **Integration Points**

#### **Paystack APIs**
- Payment initialization
- Payment verification
- Refund processing
- Webhook handling
- Subaccount management

#### **Mobile Money Networks**
- MTN Mobile Money API
- Vodafone Cash API
- AirtelTigo Money API

### **Success Metrics**

#### **Payment Success**
- Payment completion rate > 95%
- Average payment time < 2 minutes
- Refund processing time < 24 hours

#### **User Experience**
- Booking approval rate > 80%
- User satisfaction with payment process
- Reduced booking conflicts

This comprehensive plan provides a robust foundation for implementing the payment-first booking system with Paystack and mobile money integration.

