import { createClient } from 'npm:@supabase/supabase-js@2'
import { createTransport } from 'npm:nodemailer@6.9.7'
import { format } from 'npm:date-fns@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Invitation {
  id: string
  name: string
  email: string
}

interface RequestBody {
  booking_id: string
  invitations: Invitation[]
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
  organizerName: string,
  attendeeEmail: string,
  attendeeName: string
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
  ics += foldLine(`ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE;CN="${escapeICSText(attendeeName)}":mailto:${attendeeEmail}`) + '\r\n'
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

    const { booking_id, invitations }: RequestBody = await req.json()

    if (!booking_id || !invitations || invitations.length === 0) {
      return new Response(
        JSON.stringify({ error: 'booking_id and invitations are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📧 Sending emails for ${invitations.length} pre-created invitations`)

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        user_id,
        rooms:room_id(name, location),
        users:user_id(name, email)
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
    const organizer = booking.users as any

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

    // Format dates
    const startDate = new Date(booking.start_time)
    const endDate = new Date(booking.end_time)
    const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy')
    const formattedStartTime = format(startDate, 'h:mm a')
    const formattedEndTime = format(endDate, 'h:mm a')

    // Process each invitation (email sending only)
    const results = []
    
    for (const invitation of invitations) {
      try {
        console.log(`📧 Sending email to ${invitation.email} for invitation ${invitation.id}`)

        // Professional Email HTML with Conference Hub Branding
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Meeting Invitation</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
              <tr>
                <td style="padding: 40px 20px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header with Logo -->
                    <tr>
                      <td style="background-color: #FFFFFF; padding: 24px 0; border-bottom: 1px solid #E5E7EB; text-align: center;">
                        ${generateEmailLogo(150, 36)}
                        <h1 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 600; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                          Meeting Invitation
                        </h1>
                        <p style="margin: 0; font-size: 16px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                          You're invited to join a meeting
                        </p>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          Hello <strong>${invitation.name}</strong>,
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #555555;">
                          You have been invited to attend the following meeting:
                        </p>

                        <!-- Meeting Details Card -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F3F4F6; border-radius: 6px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                                Meeting Details
                              </h3>
                              <div style="display: flex; flex-direction: column; gap: 12px;">
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Title</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.title}</span>
                                </div>
                                
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Date</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${formattedDate}</span>
                                </div>
                                
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Time</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${formattedStartTime} - ${formattedEndTime}</span>
                                </div>
                                
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Location</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${room?.name || 'To be determined'}, ${room?.location || 'Conference Room'}</span>
                                </div>
                                
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Organizer</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${organizer?.name || organizer?.email}</span>
                                </div>
                                
                                ${booking.description ? `
                                <div>
                                  <strong style="display: block; color: #6B7280; font-size: 13px; margin-bottom: 4px; font-family: Arial, Helvetica, sans-serif;">Description</strong>
                                  <span style="display: block; color: #000000; font-size: 15px; font-family: Arial, Helvetica, sans-serif;">${booking.description}</span>
                                </div>
                                ` : ''}
                              </div>
                            </td>
                          </tr>
                        </table>

                        <!-- Attendance Instructions -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F3F4F6; border-radius: 6px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                                Attendance Instructions
                              </h3>
                              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;"><strong>Important:</strong> On arrival, scan the QR code on the room display to mark your attendance.</p>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                          If you have any questions about this meeting, please contact <strong>${organizer?.name || organizer?.email}</strong> at <a href="mailto:${organizer?.email}" style="color: #16A34A; text-decoration: none;">${organizer?.email}</a>.
                        </p>

                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                          We look forward to seeing you there!
                        </p>

                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F3F4F6; border-radius: 6px; border: 1px solid #E5E7EB; margin-bottom: 20px;">
                          <tr>
                            <td style="padding: 20px;">
                              <h3 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #000000; font-family: Arial, Helvetica, sans-serif;">
                                Calendar Invitation
                              </h3>
                              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;">This email includes a calendar file (.ics). Click or open the attachment to add this meeting to your calendar automatically.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #FFFFFF; padding: 24px 0; text-align: center; border-top: 1px solid #E5E7EB; margin-top: 32px;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                          This email was sent by Conference Hub
                        </p>
                        <p style="margin: 0; font-size: 12px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
                          © ${new Date().getFullYear()} Conference Hub. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `

        const text = `
Meeting Invitation

Hello ${invitation.name},

You have been invited to attend the following meeting:

Meeting: ${booking.title}
${booking.description ? `Description: ${booking.description}\n` : ''}
Room: ${room?.name || 'To be determined'}
${room?.location ? `Location: ${room.location}\n` : ''}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Organizer: ${organizer?.name || organizer?.email}

We look forward to seeing you at this meeting!

Best regards,
Conference Hub Team
        `

        // Generate ICS file
        const icsContent = generateICS(
          booking_id,
          booking.title,
          booking.description || 'Meeting invitation',
          `${room.name}, ${room.location || 'Conference Room'}`,
          booking.start_time,
          booking.end_time,
          organizer.email,
          organizer.name,
          invitation.email,
          invitation.name
        )

        // Send email with ICS attachment
        await transporter.sendMail({
          from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
          to: invitation.email,
          subject: `Meeting Invitation: ${booking.title}`,
          html,
          text,
          attachments: [{
            filename: 'meeting-invitation.ics',
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }]
        })

        // Update email sent status
        await supabaseAdmin
          .from('meeting_invitations')
          .update({
            email_sent_at: new Date().toISOString(),
            email_status: 'sent',
          })
          .eq('id', invitation.id)

        results.push({
          invitation_id: invitation.id,
          email: invitation.email,
          success: true
        })

        console.log(`✅ Email sent to ${invitation.email}`)

      } catch (error) {
        console.error(`❌ Error sending email to ${invitation.email}:`, error)
        
        // Update email status to failed
        await supabaseAdmin
          .from('meeting_invitations')
          .update({
            email_status: 'failed',
          })
          .eq('id', invitation.id)
        
        results.push({
          invitation_id: invitation.id,
          email: invitation.email,
          success: false,
          error: error.message || 'Failed to send email'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} of ${invitations.length} invitation emails`,
        results,
        summary: {
          total: invitations.length,
          successful: successCount,
          failed: failureCount
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in send-meeting-invitations function:', error)
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