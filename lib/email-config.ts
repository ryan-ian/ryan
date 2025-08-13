// Email configuration for Conference Hub
// This file contains email templates and SMTP configuration

export const EMAIL_CONFIG = {
  // SMTP Configuration (to be set in Supabase dashboard)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'noreply@conferencehub.com',
    pass: process.env.SMTP_PASS || '',
    secure: false, // true for 465, false for other ports
  },
  
  // Email sender configuration
  from: {
    name: 'Conference Hub',
    email: process.env.SMTP_USER || 'noreply@conferencehub.com'
  },
  
  // Email templates
  templates: {
    emailVerification: {
      subject: 'Verify your Conference Hub account',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - Conference Hub</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              line-height: 1.6;
              color: #334155;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
            }
            .logo-icon {
              width: 48px;
              height: 48px;
              background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
              font-weight: bold;
            }
            .logo-text {
              color: white;
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .tagline {
              color: #94a3b8;
              font-size: 16px;
              margin: 0;
            }
            .content {
              padding: 40px 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin: 0 0 20px 0;
              text-align: center;
            }
            .message {
              font-size: 16px;
              color: #475569;
              margin-bottom: 30px;
              text-align: center;
            }
            .button-container {
              text-align: center;
              margin: 40px 0;
            }
            .verify-button {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              color: white;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s;
            }
            .verify-button:hover {
              transform: translateY(-1px);
            }
            .alternative-link {
              margin-top: 30px;
              padding: 20px;
              background-color: #f1f5f9;
              border-radius: 8px;
              border-left: 4px solid #0d9488;
            }
            .alternative-link p {
              margin: 0 0 10px 0;
              font-size: 14px;
              color: #475569;
            }
            .alternative-link a {
              color: #0d9488;
              word-break: break-all;
              text-decoration: none;
            }
            .footer {
              background-color: #f8fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 0;
              font-size: 14px;
              color: #64748b;
            }
            .footer a {
              color: #0d9488;
              text-decoration: none;
            }
            .security-notice {
              margin-top: 30px;
              padding: 20px;
              background-color: #fef3c7;
              border-radius: 8px;
              border-left: 4px solid #f59e0b;
            }
            .security-notice p {
              margin: 0;
              font-size: 14px;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <div class="logo-icon">CH</div>
                <div>
                  <h1 class="logo-text">Conference Hub</h1>
                  <p class="tagline">Smart Room Booking Platform</p>
                </div>
              </div>
            </div>
            
            <div class="content">
              <h2 class="title">Verify Your Email Address</h2>
              <p class="message">
                Welcome to Conference Hub! To complete your account setup and start booking conference rooms, 
                please verify your email address by clicking the button below.
              </p>
              
              <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="verify-button">
                  Verify Email Address
                </a>
              </div>
              
              <div class="alternative-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <a href="{{ .ConfirmationURL }}">{{ .ConfirmationURL }}</a>
              </div>
              
              <div class="security-notice">
                <p>
                  <strong>Security Notice:</strong> This verification link will expire in 24 hours. 
                  If you didn't create an account with Conference Hub, please ignore this email.
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>
                This email was sent by Conference Hub. If you have any questions, 
                please contact us at <a href="mailto:support@conferencehub.com">support@conferencehub.com</a>
              </p>
              <p style="margin-top: 15px;">
                © 2024 Conference Hub. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Conference Hub!
        
        To complete your account setup and start booking conference rooms, please verify your email address.
        
        Click here to verify: {{ .ConfirmationURL }}
        
        If the link doesn't work, copy and paste it into your browser.
        
        This verification link will expire in 24 hours. If you didn't create an account with Conference Hub, please ignore this email.
        
        Best regards,
        The Conference Hub Team
        
        ---
        Conference Hub - Smart Room Booking Platform
        support@conferencehub.com
      `
    }
  }
}

// Instructions for Supabase configuration
export const SUPABASE_EMAIL_SETUP_INSTRUCTIONS = `
To configure custom email for Conference Hub in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Scroll down to "SMTP Settings"
4. Enable "Enable custom SMTP"
5. Configure the following settings:

   SMTP Host: ${EMAIL_CONFIG.smtp.host}
   SMTP Port: ${EMAIL_CONFIG.smtp.port}
   SMTP User: ${EMAIL_CONFIG.smtp.user}
   SMTP Password: [Your SMTP password]
   Sender Name: ${EMAIL_CONFIG.from.name}
   Sender Email: ${EMAIL_CONFIG.from.email}

6. In "Email Templates" section, update the "Confirm signup" template:
   - Subject: ${EMAIL_CONFIG.templates.emailVerification.subject}
   - Body (HTML): [Copy the HTML template from EMAIL_CONFIG.templates.emailVerification.html]

7. Set the redirect URL to: https://yourdomain.com/auth/verify-success

Environment Variables to set:
- SMTP_HOST=${EMAIL_CONFIG.smtp.host}
- SMTP_PORT=${EMAIL_CONFIG.smtp.port}
- SMTP_USER=${EMAIL_CONFIG.smtp.user}
- SMTP_PASS=[Your SMTP password]
`
