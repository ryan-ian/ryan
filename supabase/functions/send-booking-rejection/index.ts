import { createClient } from 'npm:@supabase/supabase-js@2'
import { createTransport } from 'npm:nodemailer@6.9.7'
import { format } from 'npm:date-fns@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  booking_id: string
  rejection_reason?: string
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

    const { booking_id, rejection_reason }: RequestBody = await req.json()

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: 'booking_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get booking details with user and room information
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        status,
        rejection_reason,
        user_id,
        rooms:room_id(
          id,
          name,
          location,
          facilities:facility_id(
            id,
            name
          )
        ),
        users:user_id(
          id,
          name,
          email
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

    if (!user || !user.email || !user.name) {
      return new Response(
        JSON.stringify({ error: 'User information not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use rejection reason from request or from booking record
    const finalRejectionReason = rejection_reason || booking.rejection_reason || 'No reason provided'

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

    // Email content
    const content = `
      <p>Hello ${user.name},</p>
      <p>We regret to inform you that your booking request could not be approved at this time.</p>
      
      ${createBookingDetailsSection({
        title: booking.title,
        room: room?.name || 'Unknown Room',
        facility: facility?.name,
        date: formattedDate,
        time: `${formattedStartTime} - ${formattedEndTime}`,
        status: 'Not Approved',
        statusType: 'error'
      })}
      
      <div style="background-color: ${EMAIL_COLORS.infoSection}; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid ${EMAIL_COLORS.border};">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${EMAIL_COLORS.primaryText}; font-family: Arial, Helvetica, sans-serif;">
          Rejection Details
        </h3>
        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif;"><strong>Reason:</strong> ${finalRejectionReason}</p>
      </div>
      
      <p>Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.</p>
      <p>Thank you for your understanding.</p>
    `

    const html = wrapEmailContent(content, 'Booking Request Update')

    const text = `
Booking Request Update

Hello ${user.name},

We regret to inform you that your booking request could not be approved at this time.

Title: ${booking.title}
Room: ${room?.name || 'Unknown Room'}
${facility?.name ? `Facility: ${facility.name}` : ''}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Status: ❌ Not Approved

Reason: ${finalRejectionReason}

Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.

Thank you for your understanding.

Best regards,
Conference Hub Team
    `

    // Send email
    await transporter.sendMail({
      from: `Conference Hub <${Deno.env.get('SMTP_USER')}>`,
      to: user.email,
      subject: `Booking Request Update: ${booking.title}`,
      html,
      text,
    })

    console.log(`✅ Booking rejection email sent to ${user.email}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Booking rejection email sent successfully',
        sent_at: new Date().toISOString(),
        recipient: user.email,
        rejection_reason: finalRejectionReason
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in send-booking-rejection function:', error)
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
