import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmationEmail, sendBookingRejectionEmail, ensureEmailReady } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing email type or data' },
        { status: 400 }
      )
    }

    // Ensure email service is ready
    const emailReady = await ensureEmailReady()
    if (!emailReady) {
      console.error('❌ Email service not ready')
      return NextResponse.json(
        { error: 'Email service not available' },
        { status: 503 }
      )
    }

    let emailResult = false

    switch (type) {
      case 'booking-confirmation':
        if (!data.email || !data.name || !data.title || !data.roomName || !data.startTime || !data.endTime) {
          return NextResponse.json(
            { error: 'Missing required fields for booking confirmation email' },
            { status: 400 }
          )
        }

        emailResult = await sendBookingConfirmationEmail(
          data.email,
          data.name,
          data.title,
          data.roomName,
          data.startTime,
          data.endTime
        )
        break

      case 'booking-rejection':
        if (!data.email || !data.name || !data.title || !data.roomName || !data.rejectionReason) {
          return NextResponse.json(
            { error: 'Missing required fields for booking rejection email' },
            { status: 400 }
          )
        }

        emailResult = await sendBookingRejectionEmail(
          data.email,
          data.name,
          data.title,
          data.roomName,
          data.rejectionReason
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    if (emailResult) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error in email API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
