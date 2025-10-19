import { createClient } from 'npm:@supabase/supabase-js@2'
import { createTransport } from 'npm:nodemailer@6.9.7'
import { format } from 'npm:date-fns@3.0.0'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  invitation_id: string
  booking_id: string
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Parse request body
    const { invitation_id, booking_id }: RequestBody = await req.json()

    if (!invitation_id || !booking_id) {
      return new Response(
        JSON.stringify({ error: 'invitation_id and booking_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get invitation and booking details
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('meeting_invitations')
      .select(`
        *,
        bookings:booking_id(
          id,
          title,
          start_time,
          end_time,
          rooms:room_id(name)
        )
      `)
      .eq('id', invitation_id)
      .eq('booking_id', booking_id)
      .single()

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const booking = invitation.bookings as any
    const room = booking.rooms

    // Generate attendance code
    const attendanceCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

    // Store code in plain text - SIMPLIFIED!
    const { data: storedCode, error: codeError } = await supabaseAdmin
      .rpc('generate_and_store_attendance_code', {
        invitation_id: invitation_id,
        attendance_code: attendanceCode,
        expires_at: null  // No explicit expiry - meeting end_time is natural boundary
      })

    if (codeError) {
      console.error('Error generating code:', codeError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate attendance code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the code was stored correctly
    if (!storedCode || storedCode !== attendanceCode) {
      console.error('Code mismatch after storage!')
      return new Response(
        JSON.stringify({ error: 'Code generation verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update send tracking
    await supabaseAdmin
      .from('meeting_invitations')
      .update({
        attendance_code_last_sent_at: new Date().toISOString(),
        attendance_code_send_count: (invitation.attendance_code_send_count || 0) + 1,
      })
      .eq('id', invitation_id)

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
      secure: false, // TLS
      auth: {
        user: Deno.env.get('SMTP_USER'),
        pass: Deno.env.get('SMTP_PASSWORD')?.replace(/\s/g, ''), // Remove spaces
      },
    })

    // Email HTML content
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Attendance Code</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, Helvetica, sans-serif; 
            line-height: 1.6; 
            color: #000000;
            background-color: #f9f9f9;
          }
          .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #FFFFFF;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header { 
            background-color: #FFFFFF; 
            padding: 24px 0; 
            border-bottom: 1px solid #E5E7EB; 
            text-align: center; 
          }
          .content { 
            padding: 24px; 
          }
          .info-section {
            background-color: #F3F4F6;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border: 1px solid #E5E7EB;
          }
          .info-section h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            font-weight: 600;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
          }
          .detail-row {
            margin-bottom: 12px;
          }
          .detail-label {
            display: block;
            color: #6B7280;
            font-size: 13px;
            margin-bottom: 4px;
            font-family: Arial, Helvetica, sans-serif;
          }
          .detail-value {
            display: block;
            color: #000000;
            font-size: 15px;
            font-family: Arial, Helvetica, sans-serif;
          }
          .footer {
            background-color: #FFFFFF;
            padding: 24px 0;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            margin-top: 32px;
          }
          .footer p {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6B7280;
            font-family: Arial, Helvetica, sans-serif;
          }
          h1, h2, h3, h4, h5, h6 { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #000000;
          }
          p { 
            font-family: Arial, Helvetica, sans-serif; 
            color: #000000;
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
            <h1 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: 600; color: #000000; font-family: Arial, Helvetica, sans-serif;">
              Your Attendance Code
            </h1>
          </div>

          <div class="content">
            <p>Hello ${invitation.invitee_name || invitation.invitee_email.split('@')[0]},</p>
            <p>Here is your attendance code for the meeting:</p>
            
            <div class="info-section">
              <h3>Meeting Details</h3>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div class="detail-row">
                  <strong class="detail-label">Meeting</strong>
                  <span class="detail-value">${booking.title}</span>
                </div>
                <div class="detail-row">
                  <strong class="detail-label">Room</strong>
                  <span class="detail-value">${room?.name || 'Meeting Room'}</span>
                </div>
                <div class="detail-row">
                  <strong class="detail-label">Date</strong>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <strong class="detail-label">Time</strong>
                  <span class="detail-value">${formattedStartTime} - ${formattedEndTime}</span>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h3>Attendance Code</h3>
              <div style="text-align: center; padding: 20px 0;">
                <h3 style="margin: 0 0 16px 0; color: #000000; font-family: Arial, Helvetica, sans-serif;">Your Attendance Code</h3>
                <div style="font-size: 36px; font-weight: bold; color: #16A34A; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 16px 0;">
                  ${attendanceCode}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">Enter this code on the room display to mark your attendance</p>
              </div>
            </div>
            
            <p>Thank you for attending!</p>
          </div>

          <div class="footer">
            <p>This email was sent by Conference Hub</p>
            <p style="margin: 0; font-size: 12px; color: #6B7280; font-family: Arial, Helvetica, sans-serif;">
              © ${new Date().getFullYear()} Conference Hub. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Your Attendance Code

Hello ${invitation.invitee_name || invitation.invitee_email.split('@')[0]},

Here is your attendance code for the meeting:

Meeting: ${booking.title}
Room: ${room?.name || 'Meeting Room'}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}

YOUR ATTENDANCE CODE: ${attendanceCode}

Enter this code to mark your attendance.

Thank you for attending!

Best regards,
Conference Hub Team
    `

    // Send email
    const info = await transporter.sendMail({
      from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
      to: invitation.invitee_email,
      subject: `Your Attendance Code: ${booking.title}`,
      html,
      text,
    })

    console.log('Email sent:', info.messageId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Attendance code sent successfully',
        sent_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in send-attendance-code function:', error)
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