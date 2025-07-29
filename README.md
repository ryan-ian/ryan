# Conference hub development

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/ryan-ians-projects/v0-conference-hub-development)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/flAaUjPHruk)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/ryan-ians-projects/v0-conference-hub-development](https://vercel.com/ryan-ians-projects/v0-conference-hub-development)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/flAaUjPHruk](https://v0.dev/chat/projects/flAaUjPHruk)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Email Notifications and Calendar Integration

### Email Notifications

The Conference Hub application now supports email notifications for booking confirmations and rejections. When a booking is confirmed or rejected by a facility manager, the user will receive an email notification with the details of their booking.

#### Configuration

To enable email notifications, you need to configure the following environment variables:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM_NAME=Conference Hub
EMAIL_FROM_ADDRESS=noreply@conferencehub.com
```

The application uses Nodemailer to send emails. You can use any SMTP service such as Gmail, SendGrid, or Amazon SES.

### Calendar Integration

The application also supports syncing bookings with users' external calendars (Google Calendar and Microsoft Outlook). When a booking is confirmed, it will be automatically added to the user's calendar.

#### Google Calendar Integration

To enable Google Calendar integration, you need to:

1. Create a project in the Google Cloud Console
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Configure the following environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

#### Microsoft Outlook Integration

To enable Microsoft Outlook integration, you need to:

1. Register an application in the Azure Portal
2. Add the Microsoft Graph Calendar.ReadWrite permission
3. Configure the following environment variables:

```
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/outlook/callback
```

### Database Setup

The calendar integration feature requires additional database tables. Run the following SQL script to create the necessary tables:

```sql
-- Create calendar_integrations table
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT calendar_provider_check CHECK (
    provider IN ('google', 'outlook', 'none')
  ),
  
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  event_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT calendar_event_provider_check CHECK (
    provider IN ('google', 'outlook')
  ),
  
  CONSTRAINT unique_booking_provider UNIQUE (booking_id, provider)
);
```

You can find the complete SQL script in `lib/calendar-schema.sql`.
