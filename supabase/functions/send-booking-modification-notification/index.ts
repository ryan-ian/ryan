import { createClient } from 'npm:@supabase/supabase-js@2'
import { createTransport } from 'npm:nodemailer@6.9.7'
import { format } from 'npm:date-fns@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  booking_id: string
  changes: string[]
  send_ics?: boolean
}

// Email template utilities
const EMAIL_COLORS = {
  background: '#FFFFFF',
  infoSection: '#F3F4F6',
  border: '#E5E7EB',
  primaryText: '#000000',
  secondaryText: '#6B7280',
  brandAccent: '#16A34A',
  success: '#16A34A',
  error: '#EF4444',
  warning: '#F59E0B',
} as const

function generateEmailLogo(width: number = 150, height: number = 36): string {
  const scale = width / 150
  const scaledHeight = height
  const scaledStrokeWidth = Math.max(6, 8 * scale)
  
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
  `
}

function createStatusIndicator(status: string, type: 'success' | 'warning' | 'error' | 'info' = 'info'): string {
  const colors = {
    success: EMAIL_COLORS.success,
    warning: EMAIL_COLORS.warning,
    error: EMAIL_COLORS.error,
    info: EMAIL_COLORS.brandAccent,
  }
  
  const icons = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  }
  
  return `
    <span style="color: ${colors[type]}; font-weight: 600; font-family: Arial, Helvetica, sans-serif;">
      ${icons[type]} ${status}
    </span>
  `
}

function createBookingDetailsSection(booking: {
  title: string
  room: string
  facility?: string
  date: string
  time: string
  status?: string
  statusType?: 'success' | 'warning' | 'error' | 'info'
}): string {
  const statusHtml = booking.status ? createStatusIndicator(booking.status, booking.statusType) : ''
  
  return `
    <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
        Booking Details
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Title</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.title}</span>
        </div>
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Room</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.room}</span>
        </div>
        ${booking.facility ? `
          <div>
            <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Facility</strong>
            <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.facility}</span>
          </div>
        ` : ''}
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Date</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.date}</span>
        </div>
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Time</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.time}</span>
        </div>
        ${statusHtml ? `
          <div>
            <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Status</strong>
            <div style="font-family: Arial, Helvetica, sans-serif;">${statusHtml}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

function createUserInfoSection(user: {
  name: string
  email: string
  department?: string
  position?: string
}): string {
  return `
    <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
        User Information
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Name</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${user.name}</span>
        </div>
        <div>
          <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Email</strong>
          <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${user.email}</span>
        </div>
        ${user.department ? `
          <div>
            <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Department</strong>
            <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${user.department}</span>
          </div>
        ` : ''}
        ${user.position ? `
          <div>
            <strong style="display: block; color: ${EMAIL_COLORS.secondaryText}; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Position</strong>
            <span style="display: block; color: ${EMAIL_COLORS.primaryText}; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${user.position}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

// ICS Generation Helpers
function generateBookingUID(bookingId: string): string {
  return `booking-${bookingId}@conferencehub.local`
}

function formatICSDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  
  const folded: string[] = []
  let remaining = line
  
  folded.push(remaining.substring(0, 75))
  remaining = remaining.substring(75)
  
  while (remaining.length > 74) {
    folded.push(' ' + remaining.substring(0, 74))
    remaining = remaining.substring(74)
  }
  
  if (remaining.length > 0) {
    folded.push(' ' + remaining)
  }
  
  return folded.join('\r\n')
}

function generateICS(
  bookingId: string,
  title: string,
  description: string,
  location: string,
  startTime: string,
  endTime: string,
  organizerEmail: string,
  organizerName: string
): string {
  const now = new Date()
  const dtstamp = formatICSDate(now.toISOString())
  const dtstart = formatICSDate(startTime)
  const dtend = formatICSDate(endTime)
  const uid = generateBookingUID(bookingId)

  let ics = 'BEGIN:VCALENDAR\r\n'
  ics += 'VERSION:2.0\r\n'
  ics += 'PRODID:-//Conference Hub//Meeting Scheduler//EN\r\n'
  ics += 'METHOD:REQUEST\r\n'
  ics += 'CALSCALE:GREGORIAN\r\n'
  ics += 'BEGIN:VEVENT\r\n'
  ics += foldLine(`UID:${uid}`) + '\r\n'
  ics += foldLine(`DTSTAMP:${dtstamp}`) + '\r\n'
  ics += foldLine(`DTSTART:${dtstart}`) + '\r\n'
  ics += foldLine(`DTEND:${dtend}`) + '\r\n'
  ics += foldLine(`SUMMARY:${escapeICSText(title)}`) + '\r\n'
  ics += foldLine(`DESCRIPTION:${escapeICSText(description)}`) + '\r\n'
  ics += foldLine(`LOCATION:${escapeICSText(location)}`) + '\r\n'
  ics += foldLine(`ORGANIZER;CN="${escapeICSText(organizerName)}":mailto:${organizerEmail}`) + '\r\n'
  ics += 'STATUS:CONFIRMED\r\n'
  ics += 'TRANSP:OPAQUE\r\n'
  ics += 'CLASS:PUBLIC\r\n'
  ics += 'BEGIN:VALARM\r\n'
  ics += 'TRIGGER:-PT15M\r\n'
  ics += 'ACTION:DISPLAY\r\n'
  ics += foldLine(`DESCRIPTION:Reminder: ${escapeICSText(title)}`) + '\r\n'
  ics += 'END:VALARM\r\n'
  ics += 'END:VEVENT\r\n'
  ics += 'END:VCALENDAR\r\n'
  
  return ics
}

function wrapEmailContent(content: string, title?: string, subtitle?: string): string {
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
        .header { 
          background-color: ${EMAIL_COLORS.background}; 
          padding: 24px 0; 
          border-bottom: 1px solid ${EMAIL_COLORS.border}; 
          text-align: center; 
        }
        .content { 
          padding: 24px; 
        }
        .footer {
          background-color: ${EMAIL_COLORS.background};
          padding: 24px 0;
          border-top: 1px solid ${EMAIL_COLORS.border};
          text-align: center;
          margin-top: 32px;
        }
        .footer p {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: ${EMAIL_COLORS.secondaryText};
          font-family: Arial, Helvetica, sans-serif;
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
        <div class="header">
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
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This email was sent by Conference Hub</p>
          <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.secondaryText}; font-family: Arial, Helvetica, sans-serif;">
            © ${new Date().getFullYear()} Conference Hub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { booking_id, changes = [], send_ics = true }: RequestBody = await req.json()

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking details with user, room, facility, and manager information
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        user_id,
        rooms:room_id(
          id,
          name,
          location,
          facilities:facility_id(
            id,
            name,
            manager_id,
            managers:manager_id(
              id,
              name,
              email
            )
          )
        ),
        users:user_id(
          id,
          name,
          email,
          department,
          position
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const room = booking.rooms as any
    const user = booking.users as any
    const facility = room?.facilities
    const manager = facility?.managers

    if (!user || !user.email || !user.name) {
      return new Response(
        JSON.stringify({ error: 'User information not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format dates
    const startDate = new Date(booking.start_time)
    const endDate = new Date(booking.end_time)
    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy')
    const formattedStartTime = format(startDate, 'h:mm a')
    const formattedEndTime = format(endDate, 'h:mm a')

    // Create nodemailer transporter
    const transporter = createTransport({
      host: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: false,
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD')?.replace(/\s/g, ''),
      },
    })

    // Send emails to both user and facility manager
    const results = []

    // 1. Send email to user
    const userContent = `
      <p>Hello ${user.name},</p>
      <p>Your booking has been successfully updated. Here are the current details:</p>
      
      ${createBookingDetailsSection({
        title: booking.title,
        room: room?.name || 'Unknown Room',
        facility: facility?.name,
        date: formattedDate,
        time: `${formattedStartTime} - ${formattedEndTime}`,
        status: 'Updated',
        statusType: 'success'
      })}
      
      ${changes.length > 0 ? `
        <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
            Changes Made
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-family: Arial, Helvetica, sans-serif;">
            ${changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
          Important Notes
        </h3>
        <ul style="margin: 0; padding-left: 20px; font-family: Arial, Helvetica, sans-serif;">
          <li>Your booking is confirmed and the room is reserved</li>
          <li>Please arrive on time for your meeting</li>
          <li>If you need to make further changes, please contact your facility manager</li>
        </ul>
      </div>
      
      <p>Thank you for using Conference Hub!</p>
    `

    const userHtml = wrapEmailContent(userContent, 'Booking Updated Successfully')
    const userText = `
Booking Updated Successfully - Conference Hub

Hello ${user.name},

Your booking has been successfully updated. Here are the current details:

Updated Booking Details:
Title: ${booking.title}
Room: ${room?.name || 'Unknown Room'}
${facility?.name ? `Facility: ${facility.name}` : ''}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}

${changes.length > 0 ? `
Changes Made:
${changes.map(change => `- ${change}`).join('\n')}
` : ''}

Important Notes:
- Your booking is confirmed and the room is reserved
- Please arrive on time for your meeting
- If you need to make further changes, please contact your facility manager

Thank you for using Conference Hub!

Best regards,
Conference Hub Team
    `

    // Prepare user email with optional ICS attachment
    const userMailOptions: any = {
      from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
      to: user.email,
      subject: `Booking Updated: ${booking.title}`,
      html: userHtml,
      text: userText,
    }

    // Add ICS attachment if requested
    if (send_ics) {
      const icsContent = generateICS(
        booking_id,
        booking.title,
        booking.description || 'Meeting update',
        `${room?.name || 'Unknown Room'}, ${facility?.name || 'Conference Hub'}`,
        booking.start_time,
        booking.end_time,
        user.email,
        user.name
      )

      userMailOptions.attachments = [{
        filename: 'meeting-update.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST'
      }]
    }

    // Send user email
    await transporter.sendMail(userMailOptions)
    results.push({ recipient: user.email, type: 'user', success: true })
    console.log(`✅ Booking modification email sent to user ${user.email}`)

    // 2. Send email to facility manager (if available)
    if (manager && manager.email && manager.name) {
      const managerContent = `
        <p>Hello ${manager.name},</p>
        <p>A booking in your facility has been modified by the user. Here are the updated details:</p>
        
        ${createBookingDetailsSection({
          title: booking.title,
          room: room?.name || 'Unknown Room',
          facility: facility?.name,
          date: formattedDate,
          time: `${formattedStartTime} - ${formattedEndTime}`,
          status: 'Confirmed',
          statusType: 'success'
        })}
        
        ${changes.length > 0 ? `
          <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
              Changes Made
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-family: Arial, Helvetica, sans-serif;">
              ${changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${createUserInfoSection({
          name: user.name,
          email: user.email,
          department: user.department,
          position: user.position
        })}
        
        <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
            Information
          </h3>
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;">This is a notification for your records. The booking has been automatically updated and no action is required from you unless there are any conflicts or concerns.</p>
          <p style="margin: 8px 0 0 0; font-family: Arial, Helvetica, sans-serif;">You can view all bookings in your facility manager dashboard.</p>
        </div>
        
        <p>Thank you for managing your facility!</p>
      `

      const managerHtml = wrapEmailContent(managerContent, 'Booking Modified', `Conference Hub - ${facility?.name || 'Facility Management'}`)
      const managerText = `
Booking Modified - Conference Hub

Hello ${manager.name},

A booking in your facility has been modified by the user. Here are the updated details:

Current Booking Details:
Title: ${booking.title}
Room: ${room?.name || 'Unknown Room'}
${facility?.name ? `Facility: ${facility.name}` : ''}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Status: ✅ Confirmed

${changes.length > 0 ? `
Changes Made:
${changes.map(change => `- ${change}`).join('\n')}
` : ''}

Modified By:
Name: ${user.name}
Email: ${user.email}
${user.department ? `Department: ${user.department}` : ''}
${user.position ? `Position: ${user.position}` : ''}

Information:
This is a notification for your records. The booking has been automatically updated and no action is required from you unless there are any conflicts or concerns.
You can view all bookings in your facility manager dashboard.

Thank you for managing your facility!

Best regards,
Conference Hub Team
      `

      // Send manager email
      await transporter.sendMail({
        from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
        to: manager.email,
        subject: `Booking Modified: ${booking.title} - ${room?.name || 'Unknown Room'}`,
        html: managerHtml,
        text: managerText,
      })
      results.push({ recipient: manager.email, type: 'manager', success: true })
      console.log(`✅ Booking modification email sent to facility manager ${manager.email}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking modification notification emails sent successfully',
        sent_at: new Date().toISOString(),
        results,
        ics_included: send_ics
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in send-booking-modification-notification function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
