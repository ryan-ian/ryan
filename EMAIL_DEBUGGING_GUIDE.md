# Email System Debugging Guide

This guide will help you debug and fix email delivery issues in the Conference Hub application.

## 🔍 Step 1: Check Email Service Configuration

### 1.1 Verify Environment Variables

First, ensure all required environment variables are set in your `.env.local` file:

```bash
# Email Service Configuration
SMTP_HOST=smtp.gmail.com                    # Your SMTP server
SMTP_PORT=587                              # Usually 587 for TLS or 465 for SSL
SMTP_SECURE=false                          # true for port 465, false for other ports
SMTP_USER=your-email@gmail.com             # Your email address
SMTP_PASSWORD=your-app-password            # Your email password or app password
EMAIL_FROM_NAME=Conference Hub             # Display name for sent emails
EMAIL_FROM_ADDRESS=noreply@conferencehub.com  # From email address
```

### 1.2 Common Email Provider Settings

**Gmail:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-specific-password   # Not your regular password!
```

**Outlook/Hotmail:**
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

**Yahoo:**
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

## 🧪 Step 2: Test Email Service

### 2.1 Check Email Service Status

Visit: `http://localhost:3000/api/email-status`

This will show you:
- Whether email service is ready
- Configuration status
- Missing environment variables

### 2.2 Send Test Email

Visit: `http://localhost:3000/test-email`

Or use the API directly:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

## 📋 Step 3: Check Console Logs

When you approve or reject a booking, look for these log messages:

### 3.1 Email Service Initialization Logs
```
🚀 ===== EMAIL SERVICE INITIALIZATION =====
📧 SMTP Configuration:
  - Host: smtp.gmail.com
  - Port: 587
  - User: your-email@gmail.com
  - Password: SET
🔍 Testing SMTP connection...
✅ SMTP connection test successful
✅ Email service initialized and tested successfully
```

### 3.2 Booking Email Logs
```
📧 BOOKING USER EMAIL ADDRESS: user@example.com
📧 SENDING CONFIRMATION EMAIL TO: user@example.com
📧 ===== BOOKING CONFIRMATION EMAIL START =====
📧 USER EMAIL ADDRESS: user@example.com
📧 ===== EMAIL SEND PROCESS START =====
📧 RECIPIENT EMAIL ADDRESS: user@example.com
✅ Email sent successfully!
```

## 🔧 Step 4: Common Issues and Solutions

### 4.1 Gmail App Passwords

If using Gmail, you MUST use an App Password, not your regular password:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account settings > Security > App passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password in `SMTP_PASSWORD`

### 4.2 Email Service Not Ready

**Error:** `❌ Email service is not ready - connection test failed`

**Solutions:**
1. Check your SMTP credentials
2. Verify your email provider allows SMTP access
3. Check firewall/network restrictions
4. Try different SMTP settings

### 4.3 Invalid Email Addresses

**Error:** `❌ Invalid user email address: undefined`

**Solutions:**
1. Check if users in your database have email addresses
2. Run this SQL query to check:
   ```sql
   SELECT id, name, email FROM users WHERE email IS NULL OR email = '';
   ```
3. Update user profiles with valid email addresses

### 4.4 Environment Variables Not Set

**Error:** `❌ MISSING EMAIL CONFIGURATION VARIABLES`

**Solutions:**
1. Create/update your `.env.local` file
2. Restart your development server
3. Ensure no typos in variable names

## 🎯 Step 5: Debugging Workflow

### 5.1 Start Development Server with Logs
```bash
npm run dev
```

### 5.2 Check Email Service Status
Visit: `http://localhost:3000/api/email-status`

Expected response:
```json
{
  "ready": true,
  "message": "Email service is ready",
  "details": {
    "transporter": true,
    "configuration": {
      "host": "SET",
      "port": "SET",
      "user": "SET",
      "password": "SET",
      "fromName": "SET",
      "fromAddress": "SET"
    }
  }
}
```

### 5.3 Send Test Email
Visit: `http://localhost:3000/test-email` and send a test email to yourself.

### 5.4 Test Booking Flow
1. Create a booking as a regular user
2. Approve/reject it as a facility manager
3. Check console logs for email sending messages
4. Check your email inbox

## 📧 Step 6: Manual Email Test

You can test email sending programmatically:

```javascript
// In your browser console on the test-email page
fetch('/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'your-email@example.com' })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 🚨 Step 7: Troubleshooting Checklist

- [ ] Environment variables are set correctly
- [ ] Email service status returns `ready: true`
- [ ] Test email works
- [ ] Users have valid email addresses in database
- [ ] Console shows email sending logs
- [ ] No errors in server logs
- [ ] Firewall/network allows SMTP connections
- [ ] Email provider allows SMTP access

## 🔍 Step 8: Advanced Debugging

### 8.1 Enable Nodemailer Debug Mode

Add this to your email service configuration:
```javascript
transporter = nodemailer.createTransport({
  // ... your config
  debug: true,
  logger: true
});
```

### 8.2 Check Email Provider Logs

Many email providers have activity logs where you can see if emails were attempted to be sent.

### 8.3 Try Alternative SMTP Services

If your current email provider isn't working, try:
- Gmail (with app password)
- SendGrid
- Mailgun
- Amazon SES

## 📞 Need Help?

If you're still having issues:

1. Check the console logs during booking approval/rejection
2. Test with the `/api/email-status` endpoint
3. Verify your email provider's SMTP settings
4. Try sending a test email first

The enhanced logging will now show you exactly:
- What email addresses are being used
- Whether the email service is properly configured
- Any errors during the email sending process 