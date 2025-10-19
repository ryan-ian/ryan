# Conference Hub Email Template Guide

## Overview

This document outlines the professional email template system implemented for Conference Hub notifications. All email templates follow a consistent, minimal design with Conference Hub branding.

## Design Principles

### Visual Design
- **Professional and minimal** - Clean white background with subtle gray sections
- **Consistent branding** - Conference Hub logo and color scheme throughout
- **Email client compatibility** - Inline styles and table-based layout for maximum compatibility
- **Mobile responsive** - Optimized for both desktop and mobile email clients

### Color Palette
- **Background**: #FFFFFF (white)
- **Information sections**: #F3F4F6 (light gray)
- **Borders**: #E5E7EB (subtle gray)
- **Primary text**: #000000 (black)
- **Secondary text**: #6B7280 (medium gray)
- **Brand accent**: #16A34A (green) - used sparingly for highlights and status indicators
- **Status colors**: 
  - Success: #16A34A (green)
  - Error: #EF4444 (red)
  - Warning: #F59E0B (orange)
  - Info: #16A34A (green)

### Typography
- **Primary font**: Arial, Helvetica, sans-serif
- **Body text**: 16px
- **Headings**: 18px-24px
- **Small text**: 12px-14px
- **Code/attendance codes**: Courier New, monospace

## Logo Specifications

The Conference Hub logo is embedded as inline SVG in all email templates:

```svg
<svg width="150" height="36" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg">
  <g id="Logomark">
    <path d="M 45,30 A 20 20, 0, 1, 1, 25,10" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
    <line x1="25" y1="10" x2="25" y2="50" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
    <path d="M 25 30 L 45 30" fill="none" stroke="#16A34A" stroke-width="6" stroke-linecap="round"/>
  </g>
  <g id="Logotype" transform="translate(70, 0)">
    <text x="0" y="30" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#000000" dominant-baseline="middle">
      <tspan font-weight="600">Conference</tspan>
      <tspan font-weight="400">Hub</tspan>
    </text>
  </g>
</svg>
```

**Key features:**
- Fixed colors (no dark theme support in emails)
- Scalable vector format
- Black text with green accent
- 150px width standard

## Template Structure

### Header
- Conference Hub logo (centered)
- Email title
- Optional subtitle

### Content Area
- Main message content
- Information sections with light gray backgrounds
- Status indicators with appropriate colors
- Call-to-action elements

### Footer
- Conference Hub branding
- Copyright notice
- Optional unsubscribe link

## Email Types

### 1. Booking Notifications
- **Booking Request Submitted** - User confirmation
- **Booking Confirmed** - Approval notification
- **Booking Rejected** - Rejection with reason
- **Booking Cancelled** - Cancellation confirmation
- **Booking Modified** - Change notifications

### 2. Manager Notifications
- **New Booking Request** - Manager alert for review
- **Booking Modified** - Manager notification of changes

### 3. Meeting Invitations
- **Meeting Invitation** - Attendee invitation with details
- **Attendance Code** - 4-digit code for room display

### 4. Calendar Integration
- **ICS Attachments** - Calendar files for meeting invitations
- **Booking Confirmations** - With calendar integration

## Implementation

### Core Template Functions
Located in `lib/email-templates.ts`:

- `generateEmailLogo()` - Creates inline SVG logo
- `createEmailHeader()` - Professional header with logo
- `createEmailFooter()` - Minimal footer
- `createInfoSection()` - Light gray information blocks
- `createBookingDetailsSection()` - Standardized booking details
- `createUserInfoSection()` - User information display
- `createStatusIndicator()` - Colored status indicators
- `wrapEmailContent()` - Master wrapper with consistent styling

### Usage Example

```typescript
import { wrapEmailContent, createBookingDetailsSection } from './email-templates'

const content = `
  <p>Hello ${userName},</p>
  <p>Your booking has been confirmed.</p>
  
  ${createBookingDetailsSection({
    title: bookingTitle,
    room: roomName,
    date: formattedDate,
    time: `${startTime} - ${endTime}`,
    status: 'Confirmed',
    statusType: 'success'
  })}
  
  <p>Thank you for using Conference Hub!</p>
`

const html = wrapEmailContent(content, 'Booking Confirmed!')
```

## Edge Functions

The same professional template system is implemented in Supabase Edge Functions:

- `send-meeting-invitations` - Meeting invitation emails
- `send-attendance-code` - Attendance code delivery

Both functions use the same design principles and color palette for consistency.

## Best Practices

### Content Guidelines
- Keep messages concise and professional
- Use clear, actionable language
- Include all necessary information
- Provide contact information when relevant

### Technical Guidelines
- Always use inline styles for email compatibility
- Test across multiple email clients
- Use table-based layouts for complex structures
- Include both HTML and text versions
- Optimize images and attachments

### Accessibility
- Use semantic HTML structure
- Provide alt text for images
- Ensure sufficient color contrast
- Use descriptive link text

## Testing

Email templates should be tested across:
- Gmail (web and mobile)
- Outlook (desktop and web)
- Apple Mail
- Yahoo Mail
- Mobile email clients

## Maintenance

When updating email templates:
1. Update the core functions in `lib/email-templates.ts`
2. Update corresponding Edge Functions
3. Test across email clients
4. Update this documentation if needed

## Support

For questions about email templates or to request changes, contact the development team or refer to the main Conference Hub documentation.
