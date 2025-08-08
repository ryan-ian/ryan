# Facility Manager Setup Guide

This guide explains how to set up and use the facility manager features in Conference Hub.

## Why Am I Seeing "No Data Available" on Reports?

The reports page shows "No data available" when:

1. **No Facility Assigned**: You haven't been assigned to manage a facility yet
2. **No Rooms Created**: Your facility exists but has no rooms
3. **No Bookings**: There are no confirmed bookings for your rooms
4. **No Data in Date Range**: All bookings are outside the selected date range

## Step-by-Step Setup Process

### Step 1: Create or Get Assigned to a Facility

**Option A: Create Your Own Facility**
1. Navigate to `/facility-manager/facilities`
2. Click "Create New Facility"
3. Fill in the facility details:
   - Name (required)
   - Location (optional)
   - Description (optional)
4. Click "Save" - you'll automatically be assigned as the manager

**Option B: Get Assigned by an Admin**
1. Contact your system administrator
2. Ask them to assign you as a manager to an existing facility
3. They can do this from the admin panel at `/admin/conference/facilities`

### Step 2: Add Rooms to Your Facility

1. Navigate to `/facility-manager/rooms`
2. Click "Add New Room"
3. Fill in room details:
   - Name (required)
   - Location (optional)
   - Capacity (required)
   - Description (optional)
   - Resources (optional)
4. Click "Save"

### Step 3: Wait for Bookings

1. Users can now book your rooms through `/conference-room-booking`
2. You'll receive notifications for new booking requests
3. Approve or reject bookings from `/facility-manager/bookings`
4. Only **confirmed** bookings appear in reports

### Step 4: View Reports

1. Navigate to `/facility-manager/reports`
2. Select your preferred date range
3. View analytics across different tabs:
   - **Overview**: Key metrics and usage patterns
   - **Room Utilization**: Individual room performance
   - **Booking Trends**: Booking patterns over time
   - **Resources**: Resource usage and status

## Troubleshooting Common Issues

### "No Facility Assigned" Error

**Cause**: Your user account isn't assigned to manage any facility.

**Solution**: 
- Create a new facility at `/facility-manager/facilities`
- Or ask an admin to assign you to an existing facility

### "No Data Available" with Existing Facility

**Cause**: Your facility has no rooms or no confirmed bookings.

**Solutions**:
1. **Add Rooms**: Go to `/facility-manager/rooms` and create rooms
2. **Check Bookings**: Go to `/facility-manager/bookings` and approve pending requests
3. **Verify Date Range**: Ensure your selected date range includes booking dates
4. **Wait for Activity**: Reports only show data for confirmed bookings

### Reports Show Zero Utilization

**Cause**: No confirmed bookings in the selected time period.

**Solutions**:
1. Check if there are pending bookings to approve
2. Expand the date range to include more historical data
3. Verify that rooms are available and properly configured

## Understanding Report Data

### Key Metrics

- **Total Bookings**: Count of confirmed bookings only
- **Utilization Rate**: Percentage of available time that's booked
- **Average Duration**: Mean length of confirmed bookings
- **Peak Usage**: Most active days and hours

### Date Range Options

- **Last 7 Days**: Recent activity
- **Last 30 Days**: Monthly overview (default)
- **Last Quarter**: 90-day trend analysis
- **Custom Range**: Specify exact dates

### Data Requirements

Reports require:
- At least one facility assigned to your account
- At least one room in your facility
- At least one confirmed booking in the selected date range

## Getting Help

If you're still experiencing issues:

1. **Check Browser Console**: Open developer tools and look for error messages
2. **Verify User Role**: Ensure your account has "facility_manager" role
3. **Contact Admin**: Ask your system administrator to verify your facility assignment
4. **Check Database**: Ensure the facilities table has your user_id in the manager_id column

## Quick Checklist

Before expecting to see report data, verify:

- [ ] You have a facility assigned (check `/facility-manager/facilities`)
- [ ] Your facility has rooms (check `/facility-manager/rooms`)
- [ ] There are confirmed bookings (check `/facility-manager/bookings`)
- [ ] Your date range includes booking dates
- [ ] Bookings are approved/confirmed (not pending)

## Next Steps

Once you have data flowing:

1. **Monitor Regularly**: Check reports weekly to understand usage patterns
2. **Optimize Resources**: Use utilization data to make informed decisions
3. **Export Data**: Use the export buttons to save reports for analysis
4. **Adjust Capacity**: Add or modify rooms based on demand patterns

For technical support or feature requests, contact your system administrator.
