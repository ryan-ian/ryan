import { createClient } from 'npm:@supabase/supabase-js@2'
import { createTransport } from 'npm:nodemailer@6.9.7'
import { format } from 'npm:date-fns@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Invitee {
  name: string
  email: string
}

interface RequestBody {
  booking_id: string
  invitees: Invitee[]
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

    const { booking_id, invitees }: RequestBody = await req.json()

    if (!booking_id || !invitees || invitees.length === 0) {
      return new Response(
        JSON.stringify({ error: 'booking_id and invitees array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Process each invitee
    const results = []
    
    for (const invitee of invitees) {
      try {
        // Insert invitation into database
        const { data: invitation, error: invError } = await supabaseAdmin
          .from('meeting_invitations')
          .insert({
            booking_id: booking_id,
            organizer_id: booking.user_id,
            invitee_email: invitee.email,
            invitee_name: invitee.name,
            status: 'pending',
          })
          .select()
          .single()

        if (invError) {
          console.error(`Error inserting invitation for ${invitee.email}:`, invError)
          results.push({
            email: invitee.email,
            success: false,
            error: 'Failed to create invitation'
          })
          continue
        }

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
                      <td style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                        <div style="background-color: rgba(255,255,255,0.95); display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;">
                          <h1 style="margin: 0; color: #2196F3; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                            📅 Conference Hub
                          </h1>
                        </div>
                        <h2 style="margin: 15px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 500;">
                          Meeting Invitation
                        </h2>
                      </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 40px 40px 30px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          Hello <strong>${invitee.name}</strong>,
                        </p>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #555555;">
                          You have been invited to attend the following meeting:
                        </p>

                        <!-- Meeting Details Card -->
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196F3; margin-bottom: 30px;">
                          <tr>
                            <td style="padding: 25px;">
                              <h3 style="margin: 0 0 15px; color: #1976D2; font-size: 20px; font-weight: 600;">
                                ${booking.title}
                              </h3>
                              ${booking.description ? `<p style="margin: 0 0 20px; color: #666; font-size: 15px; line-height: 1.6;">${booking.description}</p>` : ''}
                              
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #888; font-size: 14px; font-weight: 500;">📍 LOCATION</span><br>
                                    <span style="color: #333; font-size: 15px; font-weight: 600;">${room?.name || 'To be determined'}</span>
                                    ${room?.location ? `<br><span style="color: #666; font-size: 14px;">${room.location}</span>` : ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #888; font-size: 14px; font-weight: 500;">📅 DATE</span><br>
                                    <span style="color: #333; font-size: 15px; font-weight: 600;">${formattedDate}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #888; font-size: 14px; font-weight: 500;">🕐 TIME</span><br>
                                    <span style="color: #333; font-size: 15px; font-weight: 600;">${formattedStartTime} - ${formattedEndTime}</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0;">
                                    <span style="color: #888; font-size: 14px; font-weight: 500;">👤 ORGANIZER</span><br>
                                    <span style="color: #333; font-size: 15px; font-weight: 600;">${organizer?.name || organizer?.email}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #333; text-align: center; padding: 20px 0; background-color: #e3f2fd; border-radius: 6px;">
                          <strong>We look forward to seeing you at this meeting!</strong>
                        </p>

                        <p style="margin: 30px 0 20px; font-size: 14px; line-height: 1.6; color: #555555; background-color: #E3F2FD; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                          📎 <strong>Calendar Invitation Attached</strong><br>
                          This email includes a calendar file (.ics). Click or open the attachment to add this meeting to your calendar automatically.
                        </p>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #fafafa; padding: 30px 40px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                        <p style="margin: 0 0 10px; font-size: 14px; color: #666;">
                          Best regards,<br>
                          <strong style="color: #2196F3;">Conference Hub Team</strong>
                        </p>
                        <p style="margin: 10px 0 0; font-size: 12px; color: #999;">
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

Hello ${invitee.name},

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
          invitee.email,
          invitee.name
        )

        // Send email with ICS attachment
        await transporter.sendMail({
          from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
          to: invitee.email,
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
          email: invitee.email,
          success: true,
          invitation_id: invitation.id
        })

        console.log(`✅ Invitation sent to ${invitee.email}`)

      } catch (error) {
        console.error(`Error sending invitation to ${invitee.email}:`, error)
        results.push({
          email: invitee.email,
          success: false,
          error: error.message || 'Failed to send invitation'
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Get the created invitations to return
    const createdInvitations = results
      .filter(r => r.success && r.invitation_id)
      .map(r => r.invitation_id)

    const { data: invitations } = await supabaseAdmin
      .from('meeting_invitations')
      .select('*')
      .in('id', createdInvitations)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} of ${invitees.length} invitations`,
        invitations: invitations || [],
        results,
        summary: {
          total: invitees.length,
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