# Facility Manager Email Notification Debug Guide

## Issue Summary

The booking creation email notification system is only sending emails to users but not to facility managers. This guide provides a comprehensive debugging approach to identify and fix the issue.

## Root Cause Identified ✅

**ISSUE FOUND**: The `createSingleBooking` function in `app/api/bookings/route.ts` was missing the facility manager email notification code. It only had the user confirmation email but no facility manager notification.

**SOLUTION IMPLEMENTED**: Added complete facility manager notification code to the `createSingleBooking` function with enhanced debugging.

## Changes Made

### 1. Enhanced `createSingleBooking` Function

**Location**: `app/api/bookings/route.ts` (lines 180-270)

**Added Features**:
- Facility lookup with manager relationship query
- Comprehensive debugging logs with `[SINGLE BOOKING]` prefix
- In-app notification to facility manager
- Email notification to facility manager
- Detailed error handling and validation
- Missing data diagnostics

### 2. Enhanced Email Service Logging

**Location**: `lib/email-service.ts` (lines 444-464)

**Added Features**:
- More detailed parameter logging
- All input parameters are now logged for debugging

## Debugging Steps

### Step 1: Verify the Fix

After the changes, when a booking is created, you should see these logs:

```
🔍 [SINGLE BOOKING] Fetching facility for room [room-id], facility_id: [facility-id]
🔍 [SINGLE BOOKING] Facility query result: { facility: {...}, facilityError: null }
🔍 [SINGLE BOOKING] Facility manager data: { id: "...", name: "...", email: "..." }
📧 [SINGLE BOOKING] Attempting to send facility manager notifications for booking [booking-id]
✅ [SINGLE BOOKING] In-app notification sent to facility manager [manager-name]
📧 [SINGLE BOOKING] Sending email notification to facility manager [manager-email]
📧 ===== BOOKING CREATION NOTIFICATION TO MANAGER START =====
📧 Manager Email: [manager-email]
📧 Manager Name: [manager-name]
📧 User Name: [user-name]
📧 User Email: [user-email]
📧 Booking Title: [booking-title]
📧 Room Name: [room-name]
📧 Facility Name: [facility-name]
📧 Start Time: [start-time]
📧 End Time: [end-time]
✅ [SINGLE BOOKING] Email notification sent to facility manager [manager-name] ([manager-email])
```

### Step 2: Check Database Relationships

Use the debug script to verify the room-facility-manager relationship:

```bash
node debug-room-facility-relationship.js
```

This will check:
- ✅ Room exists with the specified ID
- ✅ Room has a valid facility_id
- ✅ Facility exists and is linked to the room
- ✅ Facility has a manager_id assigned
- ✅ Manager user exists with valid email

### Step 3: Identify Missing Data Issues

If you see these warning logs, they indicate missing data:

```
⚠️ [SINGLE BOOKING] Cannot send facility manager notification - missing data:
   - User: MISSING/OK
   - Room: MISSING/OK
   - Facility: MISSING/OK
   - Facility Manager: MISSING/OK
   - Manager ID: MISSING/OK
```

**Solutions for Missing Data**:

1. **Missing Facility**: Room has no facility_id
   ```sql
   UPDATE rooms SET facility_id = 'your-facility-id' WHERE id = 'room-id';
   ```

2. **Missing Facility Manager**: Facility has no manager_id
   ```sql
   UPDATE facilities SET manager_id = 'user-id' WHERE id = 'facility-id';
   ```

3. **Missing Manager Email**: Manager user has no email
   ```sql
   UPDATE users SET email = 'manager@example.com' WHERE id = 'manager-id';
   ```

### Step 4: Test Specific Room ID

For the room ID mentioned in the issue (`b68d9495-27e1-4af5-9766-793abf7ab924`):

1. **Check Room-Facility Relationship**:
   ```sql
   SELECT r.id, r.name, r.facility_id, f.name as facility_name, f.manager_id
   FROM rooms r
   LEFT JOIN facilities f ON r.facility_id = f.id
   WHERE r.id = 'b68d9495-27e1-4af5-9766-793abf7ab924';
   ```

2. **Check Facility Manager**:
   ```sql
   SELECT f.id, f.name, f.manager_id, u.name as manager_name, u.email as manager_email
   FROM facilities f
   LEFT JOIN users u ON f.manager_id = u.id
   WHERE f.id = (
     SELECT facility_id FROM rooms WHERE id = 'b68d9495-27e1-4af5-9766-793abf7ab924'
   );
   ```

## Common Issues and Solutions

### Issue 1: No Facility Manager Logs
**Symptom**: No `[SINGLE BOOKING]` logs appear
**Cause**: Booking is using `createMultipleBookings` instead of `createSingleBooking`
**Solution**: Check if the booking request includes a `bookings` array

### Issue 2: Facility Not Found
**Symptom**: `❌ [SINGLE BOOKING] Error fetching facility`
**Cause**: Room has invalid or missing facility_id
**Solution**: Update room's facility_id to valid facility

### Issue 3: Manager Not Found
**Symptom**: `🔍 [SINGLE BOOKING] Facility manager data: null`
**Cause**: Facility has no manager_id or invalid manager_id
**Solution**: Assign valid facility manager to facility

### Issue 4: No Manager Email
**Symptom**: `⚠️ [SINGLE BOOKING] No email address found for facility manager`
**Cause**: Manager user has no email address
**Solution**: Add email address to manager user

### Issue 5: Email Service Error
**Symptom**: `❌ [SINGLE BOOKING] Failed to send facility manager email notification`
**Cause**: SMTP configuration or email service issue
**Solution**: Check SMTP settings and email service logs

## Testing the Fix

### Manual Test Steps

1. **Create a new booking** through the UI or API
2. **Check server logs** for the new debugging output
3. **Verify both emails are sent**:
   - User confirmation email
   - Facility manager notification email
4. **Check email inboxes** to confirm delivery

### API Test

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": "b68d9495-27e1-4af5-9766-793abf7ab924",
    "user_id": "your-user-id",
    "title": "Test Booking",
    "description": "Testing facility manager email",
    "start_time": "2024-01-15T10:00:00Z",
    "end_time": "2024-01-15T11:00:00Z"
  }'
```

## Expected Outcome

After implementing the fix:

1. ✅ **User receives confirmation email** (was already working)
2. ✅ **Facility manager receives notification email** (now fixed)
3. ✅ **Both emails contain correct booking details**
4. ✅ **Comprehensive logging for debugging**
5. ✅ **Graceful error handling if emails fail**

## Monitoring

To monitor the fix in production:

1. **Watch for facility manager email logs** in server logs
2. **Set up alerts** for email sending failures
3. **Monitor email delivery rates** through SMTP provider
4. **Check user feedback** for missing notifications

The facility manager email notification issue should now be resolved with comprehensive debugging to prevent future issues.
