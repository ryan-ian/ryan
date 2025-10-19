/**
 * Professional Email Templates for Conference Hub
 * 
 * This module provides reusable components for creating consistent,
 * professional email templates across all notification types.
 */

// Color palette for email templates
export const EMAIL_COLORS = {
  background: '#FFFFFF',
  infoSection: '#F3F4F6',
  border: '#E5E7EB',
  primaryText: '#000000',
  secondaryText: '#6B7280',
  brandAccent: '#16A34A',
  success: '#16A34A',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;

/**
 * Generates the Conference Hub logo as inline SVG with fixed colors
 * Optimized for email clients with no dark theme support
 */
export function generateEmailLogo(width: number = 150, height: number = 36): string {
  const scale = width / 150; // Scale factor based on default width
  const scaledHeight = height;
  const scaledStrokeWidth = Math.max(6, 8 * scale); // Minimum 6px stroke width
  
  return `
    <svg width="${width}" height="${scaledHeight}" viewBox="0 0 250 60" xmlns="http://www.w3.org/2000/svg" style="display: block;">
      <g id="Logomark">
        <path 
          d="M 45,30 A 20 20, 0, 1, 1, 25,10" 
          fill="none" 
          stroke="${EMAIL_COLORS.primaryText}" 
          stroke-width="${scaledStrokeWidth}" 
          stroke-linecap="round"
        />
        <line 
          x1="25" 
          y1="10" 
          x2="25" 
          y2="50" 
          stroke="${EMAIL_COLORS.primaryText}" 
          stroke-width="${scaledStrokeWidth}" 
          stroke-linecap="round"
        />
        <path 
          d="M 25 30 L 45 30" 
          fill="none" 
          stroke="${EMAIL_COLORS.brandAccent}" 
          stroke-width="${scaledStrokeWidth}" 
          stroke-linecap="round"
        />
      </g>
      <g id="Logotype" transform="translate(70, 0)">
        <text 
          x="0" 
          y="30" 
          font-family="Arial, Helvetica, sans-serif" 
          font-size="${22 * scale}" 
          fill="${EMAIL_COLORS.primaryText}" 
          dominant-baseline="middle"
        >
          <tspan font-weight="600">Conference</tspan>
          <tspan font-weight="400">Hub</tspan>
        </text>
      </g>
    </svg>
  `;
}

/**
 * Creates a professional email header with logo and optional title
 */
export function createEmailHeader(title?: string, subtitle?: string): string {
  return `
    <div style="background-color: ${EMAIL_COLORS.background}; padding: 24px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center;">
      ${generateEmailLogo(150, 36)}
      ${title ? `
        <h1 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
          ${title}
        </h1>
      ` : ''}
      ${subtitle ? `
        <p style="margin: 0; font-size: 16px; color: ${EMAIL_COLORS.secondaryText}; font-family: Arial, Helvetica, sans-serif;">
          ${subtitle}
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Creates an information section with light gray background
 */
export function createInfoSection(content: string, title?: string): string {
  return `
    <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
      ${title ? `
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
          ${title}
        </h3>
      ` : ''}
      ${content}
    </div>
  `;
}

/**
 * Creates a status indicator with appropriate color
 */
export function createStatusIndicator(status: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string {
  const colors = {
    success: EMAIL_COLORS.success,
    warning: EMAIL_COLORS.warning,
    error: EMAIL_COLORS.error,
    info: EMAIL_COLORS.brandAccent,
  };
  
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  };
  
  return `
    <span style="color: ${colors[type]}; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">
      ${icons[type]} ${status}
    </span>
  `;
}

/**
 * Creates a professional email footer
 */
export function createEmailFooter(unsubscribeText?: string): string {
  return `
    <div style="background-color: ${EMAIL_COLORS.background}; padding: 24px 0; border-top: 1px solid ${EMAIL_COLORS.border}; text-align: center; margin-top: 32px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; color: ${EMAIL_COLORS.secondaryText}; font-family: Arial, Helvetica, sans-serif;">
        This email was sent by Conference Hub
      </p>
      <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.secondaryText}; font-family: Arial, Helvetica, sans-serif;">
        © ${new Date().getFullYear()} Conference Hub. All rights reserved.
      </p>
      ${unsubscribeText ? `
        <p style="margin: 8px 0 0 0; font-size: 12px; color: ${EMAIL_COLORS.secondaryText}; font-family: Arial, Helvetica, sans-serif;">
          <a href="#" style="color: ${EMAIL_COLORS.brandAccent}; text-decoration: none;">${unsubscribeText}</a>
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Master wrapper that applies consistent styling to email content
 */
export function wrapEmailContent(content: string, title?: string, subtitle?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Conference Hub Notification'}</title>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Arial, Helvetica, sans-serif; 
          line-height: 1.6; 
          color: ${EMAIL_COLORS.primaryText};
          background-color: #f9f9f9;
        }
        .email-container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: ${EMAIL_COLORS.background};
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .content { 
          padding: 24px; 
        }
        h1, h2, h3, h4, h5, h6 { 
          font-family: Arial, Helvetica, sans-serif; 
          color: ${EMAIL_COLORS.primaryText};
        }
        p { 
          font-family: Arial, Helvetica, sans-serif; 
          color: ${EMAIL_COLORS.primaryText};
          margin: 0 0 16px 0;
        }
        a { 
          color: ${EMAIL_COLORS.brandAccent}; 
          text-decoration: none; 
        }
        a:hover { 
          text-decoration: underline; 
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${EMAIL_COLORS.brandAccent};
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          font-family: Arial, Helvetica, sans-serif;
        }
        .button:hover {
          background-color: #15803d;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .email-container { 
            width: 100% !important; 
            margin: 0 !important; 
          }
          .content { 
            padding: 16px !important; 
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${createEmailHeader(title, subtitle)}
        <div class="content">
          ${content}
        </div>
        ${createEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

/**
 * Creates a booking details section with consistent formatting
 */
export function createBookingDetailsSection(booking: {
  title: string;
  room: string;
  facility?: string;
  date: string;
  time: string;
  status?: string;
  statusType?: 'success' | 'warning' | 'error' | 'info';
}): string {
  const statusHtml = booking.status ? createStatusIndicator(booking.status, booking.statusType) : '';
  
  return createInfoSection(`
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Title:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${booking.title}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Room:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${booking.room}</span>
      </div>
      ${booking.facility ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Facility:</strong>
          <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${booking.facility}</span>
        </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Date:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${booking.date}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Time:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${booking.time}</span>
      </div>
      ${statusHtml ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Status:</strong>
          <span style="font-family: Arial, Helvetica, sans-serif;">${statusHtml}</span>
        </div>
      ` : ''}
    </div>
  `, 'Booking Details');
}

/**
 * Creates a user information section
 */
export function createUserInfoSection(user: {
  name: string;
  email: string;
  department?: string;
  position?: string;
}): string {
  return createInfoSection(`
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Name:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${user.name}</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Email:</strong>
        <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${user.email}</span>
      </div>
      ${user.department ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Department:</strong>
          <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${user.department}</span>
        </div>
      ` : ''}
      ${user.position ? `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">Position:</strong>
          <span style="color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">${user.position}</span>
        </div>
      ` : ''}
    </div>
  `, 'User Information');
}
