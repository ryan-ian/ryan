# Booking Modification Email Debugging Guide

## Issues Fixed

### 1. **Data Structure Issues**
- **Problem**: The `updateBooking` function was returning basic booking data without joined user/room information needed for emails
- **Solution**: Added a separate query to fetch complete booking data with joins after the update
- **Code**: Added `select('*, users:user_id(id, name, email), rooms:room_id(id, name, facility_id)')` query

### 2. **Supabase Join Data Handling**
- **Problem**: Supabase joins can return data as arrays or objects, causing access issues
- **Solution**: Added proper handling for both array and object structures
- **Code**: Added checks for `Array.isArray()` and extraction logic

### 3. **Facility Manager Data Access**
- **Problem**: Facility manager data wasn't being extracted properly from the joined facility query
- **Solution**: Added proper extraction and handling of manager data from facility joins
- **Code**: Added manager extraction logic with array handling

### 4. **Email Service Initialization**
- **Problem**: Email service might not be initialized when modification emails are sent
- **Solution**: Added `ensureEmailReady()` call before sending emails
- **Code**: Added email service readiness check in the notification function

## Debugging Steps Implemented

### 1. **Enhanced Logging**
Added comprehensive debug logging throughout the email notification process:

```typescript
console.log(`🔍 [EMAIL DEBUG] Updated booking structure:`, updatedBooking)
console.log(`🔍 [EMAIL DEBUG] Extracted user:`, user)
console.log(`🔍 [EMAIL DEBUG] Extracted room:`, room)
console.log(`🔍 [EMAIL DEBUG] Facility manager data:`, facility.manager)
console.log(`🔍 [EMAIL DEBUG] Extracted manager:`, manager)
```

### 2. **Email Service Debugging**
Added debugging in email service functions:

```typescript
console.log('📧 [EMAIL DEBUG] About to call sendEmail for user confirmation');
console.log('📧 [EMAIL DEBUG] About to call sendEmail for facility manager notification');
```

### 3. **Data Validation Checks**
Added validation for all required data before sending emails:

```typescript
if (!user || !user.id) {
  console.warn(`⚠️ User not found in booking data for booking ${updatedBooking.id}`)
  return
}

if (!room || !room.id) {
  console.warn(`⚠️ Room not found in booking data for booking ${updatedBooking.id}`)
  return
}
```

## Testing the Fix

### 1. **Manual Testing Steps**

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open browser console** and navigate to a booking edit page

3. **Make a booking modification** (change title, description, or time)

4. **Check server logs** for the debug output:
   ```
   🔍 [EMAIL DEBUG] Ensuring email service is ready...
   ✅ [EMAIL DEBUG] Email service is ready
   🔍 [EMAIL DEBUG] Updated booking structure: {...}
   🔍 [EMAIL DEBUG] Extracted user: {...}
   🔍 [EMAIL DEBUG] Extracted room: {...}
   📧 [EMAIL DEBUG] Attempting to send user confirmation email to user@example.com
   📧 [EMAIL DEBUG] User email result: true
   📧 [EMAIL DEBUG] Attempting to send facility manager notification email to manager@example.com
   📧 [EMAIL DEBUG] Manager email result: true
   ```

### 2. **API Testing**

Use the test script to directly test the API:

```bash
node test-booking-modification-emails.js
```

### 3. **Email Verification**

Check that emails are received:
- **User**: Should receive "Booking Updated: [Title]" email
- **Facility Manager**: Should receive "Booking Modified: [Title] - [Room]" email

## Expected Email Flow

### 1. **User Confirmation Email**
- **Subject**: "Booking Updated: [Booking Title]"
- **Content**: 
  - Green success header
  - Updated booking details
  - List of changes made
  - Important notes and reminders

### 2. **Facility Manager Notification Email**
- **Subject**: "Booking Modified: [Booking Title] - [Room Name]"
- **Content**:
  - Orange modification header
  - Current booking details
  - List of changes made
  - User information who made changes
  - Informational notes

## Common Issues and Solutions

### 1. **No Emails Sent**
- **Check**: Email service environment variables are set
- **Check**: SMTP configuration is correct
- **Check**: Server logs for email service initialization errors

### 2. **User Email Not Sent**
- **Check**: User has valid email address in database
- **Check**: User data is properly extracted from booking joins
- **Look for**: `🔍 [EMAIL DEBUG] Extracted user:` in logs

### 3. **Facility Manager Email Not Sent**
- **Check**: Facility has assigned manager with email
- **Check**: Room is properly linked to facility
- **Check**: Manager data extraction in logs
- **Look for**: `🔍 [EMAIL DEBUG] Extracted manager:` in logs

### 4. **Email Service Not Ready**
- **Check**: SMTP environment variables
- **Check**: Network connectivity to SMTP server
- **Look for**: `❌ [EMAIL DEBUG] Email service not ready` in logs

## Environment Variables Required

```env
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM_NAME=Conference Hub
EMAIL_FROM_ADDRESS=noreply@conferencehub.com
```

## Database Requirements

Ensure the following relationships exist:
- Bookings → Users (user_id)
- Bookings → Rooms (room_id)
- Rooms → Facilities (facility_id)
- Facilities → Users (manager_id)

## Success Indicators

When working correctly, you should see:
1. ✅ Email service initialization logs
2. 🔍 Debug logs showing proper data extraction
3. 📧 Email sending attempt logs
4. ✅ Email success confirmation logs
5. 📧 Actual emails received by users and facility managers

The email notification system should now work reliably for all booking modifications.
