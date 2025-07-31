# Email Configuration for Deployment

This guide covers how to properly configure email functionality for deployment environments (Vercel, Netlify, etc.).

## Common Deployment Issues

The main reason email works locally but not in deployment is:

1. **Missing Environment Variables** - Deployment platforms don't have access to your local `.env.local` file
2. **SMTP Connection Issues** - Some email providers block connections from certain hosting platforms
3. **Async Initialization Problems** - Serverless functions need proper async handling

## Environment Variables Setup

### 1. Vercel Deployment

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM_NAME=Conference Hub
EMAIL_FROM_ADDRESS=noreply@conferencehub.com
```

### 2. Other Platforms

For other deployment platforms, add the same environment variables through their respective configuration methods.

## Email Provider Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password (not your regular password) for `SMTP_PASSWORD`

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-16-character-app-password
```

### Outlook/Office 365

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Custom SMTP Server

```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
```

## Testing Email in Production

### 1. Check Email Service Status

Visit your deployed app and go to:
```
https://your-app-domain.com/api/email-status
```

This will show you:
- Whether email service is ready
- Which environment variables are set/missing
- Any initialization errors

### 2. Send Test Email

Visit:
```
https://your-app-domain.com/test-email
```

Or use the API directly:
```bash
curl -X POST https://your-app-domain.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

### 3. Check Server Logs

In Vercel:
1. Go to your project dashboard
2. Click on "Functions" tab
3. Look for email-related function calls
4. Check the logs for error messages

## Troubleshooting Common Issues

### Issue 1: "Email service not ready"

**Cause**: Environment variables not set or SMTP connection failed

**Solution**:
1. Verify all environment variables are set in deployment platform
2. Check if SMTP credentials are correct
3. Try different SMTP settings (port 465 with `SMTP_SECURE=true`)

### Issue 2: "Authentication failed"

**Cause**: Incorrect SMTP credentials

**Solution**:
1. For Gmail: Use app-specific password, not regular password
2. Verify username/email is correct
3. Check if 2FA is enabled and app password is generated

### Issue 3: "Connection timeout"

**Cause**: SMTP server blocked or incorrect host/port

**Solution**:
1. Try different ports (587, 465, 25)
2. Switch between `SMTP_SECURE=true/false`
3. Contact your email provider about IP restrictions

### Issue 4: "Module not found" errors

**Cause**: Missing dependencies in deployment

**Solution**:
1. Ensure `nodemailer` is in `dependencies` (not `devDependencies`)
2. Run `npm install` and redeploy

## Email Service Architecture

The updated email service now includes:

1. **Async Initialization**: Proper async/await handling for serverless environments
2. **Connection Verification**: Tests SMTP connection during initialization
3. **Automatic Retry**: Attempts to initialize email service when needed
4. **Better Error Logging**: Detailed error messages for debugging

## Security Best Practices

1. **Use App Passwords**: Never use your main email password
2. **Limit Permissions**: Create dedicated email accounts for sending
3. **Monitor Usage**: Keep track of email sending limits
4. **Use Environment Variables**: Never hardcode credentials in code

## Email Limits

Be aware of sending limits:

- **Gmail**: 500 emails/day for regular accounts, 2000/day for Google Workspace
- **Outlook**: 300 emails/day for regular accounts
- **Custom SMTP**: Varies by provider

## Production Monitoring

Consider adding:

1. **Email Delivery Tracking**: Log successful/failed sends
2. **Rate Limiting**: Prevent abuse of email sending
3. **Queue System**: For high-volume applications
4. **Fallback Providers**: Multiple SMTP providers for reliability

## Example Production Configuration

```bash
# Production environment variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=conferencehub@yourdomain.com
SMTP_PASSWORD=abcd-efgh-ijkl-mnop
EMAIL_FROM_NAME=Conference Hub
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

## Support

If you continue to have issues:

1. Check the server logs in your deployment platform
2. Test with different email providers
3. Verify environment variables are correctly set
4. Use the debug endpoints to identify the specific issue

The email system now includes comprehensive error handling and logging to help identify deployment issues quickly.