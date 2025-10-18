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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Your Attendance Code</h2>
        <p>Hello ${invitation.invitee_name || invitation.invitee_email.split('@')[0]},</p>
        <p>Here is your attendance code for the meeting:</p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
          <p><strong>Meeting:</strong> ${booking.title}</p>
          <p><strong>Room:</strong> ${room?.name || 'Meeting Room'}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        </div>

        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #ff9800; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #e65100;">Your Attendance Code</h3>
          <div style="font-size: 36px; font-weight: bold; color: #e65100; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${attendanceCode}
          </div>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Enter this code to mark your attendance</p>
        </div>

        <p>Thank you for attending!</p>
        <p>Best regards,<br>Conference Hub Team</p>
      </div>
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