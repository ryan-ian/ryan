# Conference Hub Notification System

This document outlines the notification system implemented in the Conference Hub application, including its architecture, components, and how to extend it.

## Overview

The notification system provides real-time and persistent notifications to users for various events in the application, such as:

- Booking confirmations and rejections by administrators
- Upcoming meeting reminders
- Room maintenance updates
- System-wide announcements

The system consists of several components:
1. Supabase database table for storing notifications
2. React context for managing notification state
3. API endpoints for CRUD operations
4. UI components for displaying notifications
5. Utility functions for creating notifications
6. Scheduled tasks for time-based notifications

## Database Schema

Notifications are stored in a `notifications` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

The table uses Row Level Security (RLS) to ensure users can only view and update their own notifications.

## Notification Types

The system supports the following notification types:

1. `booking_confirmation` - Sent when an admin confirms a booking
2. `booking_rejection` - Sent when an admin rejects a booking
3. `booking_reminder` - Sent shortly before a meeting is scheduled to start
4. `room_maintenance` - Sent when there are updates about room maintenance
5. `system_notification` - General system notifications

## Components

### 1. NotificationsContext

The `NotificationsContext` provides a React context for managing notifications state and operations:

- `notifications` - Array of user's notifications
- `unreadCount` - Count of unread notifications
- `loading` - Loading state
- `markAsRead` - Function to mark a notification as read
- `markAllAsRead` - Function to mark all notifications as read
- `fetchNotifications` - Function to fetch notifications from the server

### 2. NotificationBell Component

The `NotificationBell` component displays a bell icon in the header with:

- Badge showing unread notification count
- Popover displaying recent notifications
- Options to mark notifications as read

### 3. API Endpoints

- `GET /api/notifications` - Get all notifications for the current user
- `POST /api/notifications` - Create a new notification (admin only)
- `PATCH /api/notifications/[id]` - Mark a notification as read
- `DELETE /api/notifications/[id]` - Delete a notification

### 4. Utility Functions

The `lib/notifications.ts` file provides utility functions for creating notifications:

- `createNotification` - Base function for creating notifications
- `createBookingConfirmationNotification` - For booking confirmations
- `createBookingRejectionNotification` - For booking rejections
- `createBookingReminderNotification` - For meeting reminders
- `createRoomMaintenanceNotification` - For room maintenance updates
- `createSystemNotification` - For system-wide announcements

### 5. Scheduled Tasks

- `/api/cron/booking-reminders` - Scheduled task for sending meeting reminders

## Real-time Updates

The system uses Supabase's real-time features to provide instant notifications:

1. When a new notification is created, it's immediately pushed to the user's browser
2. A toast notification is displayed for new notifications
3. The notification bell badge updates in real-time

## How to Use

### Creating Notifications from Server Code

```typescript
import { createBookingConfirmationNotification } from '@/lib/notifications'

// Example: Send a booking confirmation notification
await createBookingConfirmationNotification(
  userId,
  bookingId,
  bookingTitle,
  roomName
)
```

### Displaying the Notification Bell

The notification bell is automatically included in the header component.

### Accessing Notifications in Components

```typescript
import { useNotifications } from '@/contexts/notifications-context'

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  
  // Use notifications data...
}
```

## Setting Up the Scheduled Task

The booking reminder scheduled task should be called every 5-15 minutes. You can set this up with:

1. **Vercel Cron Jobs** (if deploying to Vercel):
   Add the following to your `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/booking-reminders?api_key=YOUR_API_KEY",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```

2. **External Cron Service** (e.g., cron-job.org):
   Set up a cron job to call the endpoint every 15 minutes.

## Extending the System

### Adding a New Notification Type

1. Update the `Notification` type in `types/index.ts` to include the new type
2. Add a utility function in `lib/notifications.ts` for creating the new notification type
3. Update the `getNotificationIcon` function in `notification-bell.tsx` to include an icon for the new type

### Customizing Notification Display

Modify the `NotificationBell` component in `components/ui/notification-bell.tsx` to change how notifications are displayed.

## Security Considerations

1. All notification creation from client-side should go through the API which enforces proper authorization
2. The scheduled task endpoint is protected with an API key
3. Row Level Security ensures users can only access their own notifications
4. Admin operations use the admin client to bypass RLS when necessary

## Best Practices

1. Keep notification messages concise and actionable
2. Include relevant context in notifications (e.g., booking title, room name)
3. Use appropriate notification types for different events
4. Handle notification creation errors gracefully to avoid breaking the main application flow
5. Limit the number of notifications displayed to avoid overwhelming users