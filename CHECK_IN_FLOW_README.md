# Check-in Flow Implementation

This document describes the implementation of the check-in flow functionality for the Conference Hub application.

## Overview

The check-in flow allows users to check in to their booked rooms via tablet displays, with automatic room release if check-in doesn't occur within a configurable grace period. The implementation includes issue reporting and real-time status updates.

## Features Implemented

### 1. Check-in Interface
- **Location**: Room tablet displays at `/displays/[roomName]`
- **Functionality**: Users can check in to confirm room usage
- **UI Components**: `CheckInManager` component with status indicators and check-in button
- **Grace Period**: Configurable grace period (default 15 minutes) before auto-release

### 2. Auto-Release Mechanism
- **Trigger**: Automatic release if no check-in within grace period
- **Database Functions**: `handle_booking_auto_release()` for secure processing
- **Cron Job**: `/api/cron/auto-release` for batch processing of expired bookings
- **Notifications**: Audit trail via `check_in_events` table

### 3. Issue Reporting
- **Interface**: Enhanced dialog with common issues and priority levels
- **Component**: `IssueReportForm` with structured issue submission
- **Database**: `room_issues` table for tracking and resolution
- **API**: `/api/rooms/[id]/issues` for CRUD operations

### 4. Real-time Status Updates
- **Component**: `RoomStatusSync` for efficient polling with ETags
- **Optimization**: Conditional requests, visibility-aware polling, offline handling
- **API**: `/api/rooms/[id]/bookings` with caching headers
- **Error Handling**: Retry logic and user feedback

## Database Schema Changes

### Extended Bookings Table
```sql
ALTER TABLE bookings ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN check_in_required BOOLEAN DEFAULT true;
ALTER TABLE bookings ADD COLUMN auto_release_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN grace_period_minutes INTEGER DEFAULT 15;
```

### New Tables

#### room_issues
```sql
CREATE TABLE room_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  booking_id UUID REFERENCES bookings(id),
  reported_by_user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### check_in_events
```sql
CREATE TABLE check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  event_type VARCHAR(20) NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by_user_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Check-in Endpoints
- `POST /api/bookings/[id]/check-in` - Process check-in
- `GET /api/bookings/[id]/check-in` - Get check-in status
- `POST /api/bookings/[id]/auto-release` - Trigger auto-release

### Issue Reporting Endpoints
- `POST /api/rooms/[id]/issues` - Report new issue
- `GET /api/rooms/[id]/issues` - Get room issues
- `PATCH /api/rooms/issues/[id]` - Update issue status
- `GET /api/rooms/issues/[id]` - Get specific issue

### Real-time Sync Endpoints
- `GET /api/rooms/[id]/bookings` - Get room bookings with ETag support

### Cron Jobs
- `POST /api/cron/auto-release` - Batch process auto-releases

## Database Functions

### handle_booking_check_in()
```sql
CREATE OR REPLACE FUNCTION handle_booking_check_in(
  booking_id_param UUID,
  user_id_param UUID DEFAULT NULL
) RETURNS JSON
```
- Validates check-in eligibility
- Updates booking with check-in timestamp
- Creates audit event
- Returns success/error status

### handle_booking_auto_release()
```sql
CREATE OR REPLACE FUNCTION handle_booking_auto_release(
  booking_id_param UUID
) RETURNS JSON
```
- Validates auto-release conditions
- Cancels booking
- Creates audit event
- Returns success/error status

## Components

### CheckInManager
- **File**: `components/ui/check-in-manager.tsx`
- **Purpose**: Handles check-in UI and logic
- **Features**: Status display, check-in button, grace period countdown
- **Props**: `booking`, `onCheckInSuccess`, `onAutoRelease`

### IssueReportForm
- **File**: `components/ui/issue-report-form.tsx`
- **Purpose**: Issue reporting interface
- **Features**: Common issues, priority selection, structured form
- **Props**: `room`, `booking`, `userId`, `onIssueReported`

### RoomStatusSync
- **File**: `components/ui/room-status-sync.tsx`
- **Purpose**: Real-time status synchronization
- **Features**: ETag-based polling, offline handling, visibility awareness
- **Props**: `roomId`, `onBookingsUpdate`, `onError`, `syncInterval`

## Usage

### Setting Up Database
1. Run the migration script: `check_in_flow_migration.sql`
2. Verify tables and functions are created
3. Test database functions manually

### Testing Check-in Flow
1. Visit `/test-checkin` for testing interface
2. Create test bookings with confirmed status
3. Test check-in, auto-release, and status endpoints
4. Verify database updates and audit trails

### Deploying Cron Job
1. Set up cron job to call `/api/cron/auto-release` every 5 minutes
2. Add authentication header for security
3. Monitor logs for successful processing

## Configuration

### Grace Period
- Default: 15 minutes
- Configurable per booking via `grace_period_minutes` column
- Can be set during booking creation

### Sync Interval
- Default: 30 seconds for room displays
- Configurable via `RoomStatusSync` component
- Pauses when page is hidden or offline

### Issue Priorities
- Low, Medium, High, Urgent
- Configurable in `IssueReportForm` component
- Affects display styling and sorting

## Security Considerations

### Row Level Security (RLS)
- All new tables have RLS enabled
- Policies restrict access based on user roles
- Admin and facility manager access for issue management

### API Security
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- Rate limiting recommended for production

### Cron Job Security
- Requires authentication header
- Should be called from secure environment only
- Logs all operations for audit

## Monitoring and Logging

### Check-in Events
- All check-ins logged to `check_in_events` table
- Includes user ID, timestamp, and notes
- Auto-releases also logged for audit

### API Logging
- Comprehensive logging in all endpoints
- Error tracking with context
- Performance metrics for optimization

### Real-time Sync
- Connection status monitoring
- Error reporting to users
- Automatic retry with exponential backoff

## Future Enhancements

### WebSocket Support
- Replace polling with WebSocket connections
- Real-time push notifications
- Reduced server load and improved responsiveness

### Mobile App Integration
- QR code scanning for quick check-in
- Push notifications for grace period warnings
- Offline check-in capability

### Analytics Dashboard
- Check-in rate statistics
- Issue reporting trends
- Room utilization metrics

### Integration with IoT
- Occupancy sensor integration
- Automatic check-in based on presence
- Smart building integration

## Troubleshooting

### Common Issues
1. **Check-in fails**: Verify booking status and grace period
2. **Auto-release not working**: Check cron job configuration
3. **Sync errors**: Verify network connectivity and API endpoints
4. **Database errors**: Check RLS policies and permissions

### Debug Tools
- Test page at `/test-checkin`
- Browser developer tools for API calls
- Database logs for function execution
- Component state inspection in React DevTools
