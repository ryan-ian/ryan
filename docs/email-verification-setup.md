# Email Verification Setup Guide for Conference Hub

This guide explains how to configure email verification for the Conference Hub application using Supabase.

## Overview

The email verification flow includes:
1. User signs up and is redirected to email verification page
2. User receives a branded verification email
3. User clicks verification link and is redirected to success page
4. User can then log in or go directly to dashboard

## Supabase Configuration

### 1. Enable Email Confirmation

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Settings**
3. Scroll down to **User Signups**
4. Enable **"Enable email confirmations"**
5. Set **Site URL** to your domain (e.g., `https://yourdomain.com`)
6. Set **Redirect URLs** to include:
   - `https://yourdomain.com/auth/verify-success`
   - `https://yourdomain.com/auth/callback`

### 2. Configure Custom SMTP (Optional but Recommended)

For professional emails from your domain:

1. In **Authentication > Settings**, scroll to **SMTP Settings**
2. Enable **"Enable custom SMTP"**
3. Configure:
   - **SMTP Host**: `smtp.gmail.com` (or your provider)
   - **SMTP Port**: `587`
   - **SMTP User**: `noreply@yourdomain.com`
   - **SMTP Password**: Your app password
   - **Sender Name**: `Conference Hub`
   - **Sender Email**: `noreply@yourdomain.com`

### 3. Customize Email Template

1. In **Authentication > Email Templates**
2. Select **"Confirm signup"**
3. Update the template:

**Subject:**
```
Verify your Conference Hub account
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Conference Hub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; color: white; }
    .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    .tagline { color: #94a3b8; font-size: 16px; }
    .content { padding: 40px 30px; text-align: center; }
    .title { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 20px; }
    .message { font-size: 16px; color: #475569; margin-bottom: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Conference Hub</div>
      <div class="tagline">Smart Room Booking Platform</div>
    </div>
    <div class="content">
      <h2 class="title">Verify Your Email Address</h2>
      <p class="message">Welcome to Conference Hub! Click the button below to verify your email and start booking conference rooms.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
      <p style="margin-top: 30px; font-size: 14px; color: #64748b;">If the button doesn't work, copy and paste this link: {{ .ConfirmationURL }}</p>
    </div>
    <div class="footer">
      <p>© 2024 Conference Hub. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# SMTP Configuration (if using custom SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_app_password
```

## Testing the Flow

1. **Sign up** with a new email address
2. **Check** that you're redirected to `/auth/verify-email`
3. **Verify** the email is sent to your inbox
4. **Click** the verification link in the email
5. **Confirm** you're redirected to `/auth/verify-success`
6. **Test** the "Continue to Login" button

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify SMTP configuration
- Check Supabase logs in dashboard
- Ensure email confirmation is enabled

### Verification Link Not Working
- Check redirect URLs in Supabase settings
- Verify the callback route is working
- Check browser console for errors

### User Not Redirected Properly
- Verify middleware configuration
- Check that auth context is properly handling state changes
- Ensure session is being set correctly

## Security Considerations

1. **Email Verification Required**: Users cannot access protected routes without verification
2. **Token Expiration**: Verification links expire after 24 hours
3. **Secure Redirects**: Only allow redirects to approved domains
4. **Rate Limiting**: Supabase provides built-in rate limiting for auth operations

## Customization Options

### Custom Email Provider
You can use any SMTP provider:
- Gmail (with app passwords)
- SendGrid
- Mailgun
- Amazon SES
- Custom SMTP server

### Branding
- Update email templates with your colors and logo
- Customize verification pages with your brand
- Add custom CSS for consistent styling

### Additional Features
- Welcome email after verification
- Password reset flow
- Email change verification
- Multi-factor authentication

## Production Checklist

- [ ] Email confirmation enabled in Supabase
- [ ] Custom SMTP configured (recommended)
- [ ] Email templates customized with branding
- [ ] Redirect URLs properly configured
- [ ] Environment variables set
- [ ] Email verification flow tested
- [ ] Error handling tested
- [ ] Mobile responsiveness verified
- [ ] Spam folder delivery tested
- [ ] Rate limiting configured
