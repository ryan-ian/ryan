import { NextRequest, NextResponse } from 'next/server'
import { supabase, createAdminClient } from '@/lib/supabase'
import { generateQRCodeData, shouldShowQR } from '@/lib/attendance-utils'
import QRCode from 'qrcode'

/**
 * Generate QR code for meeting attendance
 * GET /api/meetings/[bookingId]/qr
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'image' // 'image' or 'data'

    // Use admin client to get meeting details
    const adminClient = createAdminClient()

    // Get meeting details
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        checked_in_at
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if meeting is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Meeting is not confirmed' },
        { status: 400 }
      )
    }

    // Check if QR should be visible (only after meeting start)
    if (!shouldShowQR(booking.start_time, booking.end_time)) {
      return NextResponse.json(
        { error: 'QR code is not available at this time' },
        { status: 400 }
      )
    }

    // Generate QR code data URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const qrDataUrl = generateQRCodeData(bookingId, baseUrl)

    if (format === 'data') {
      // Return just the data URL
      return NextResponse.json({
        qr_data: qrDataUrl,
        booking_id: bookingId,
        meeting_title: booking.title,
        generated_at: new Date().toISOString()
      })
    }

    // Generate QR code image
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrDataUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })

      // Return QR code as base64 data URL
      return NextResponse.json({
        qr_image: qrCodeDataURL,
        qr_data: qrDataUrl,
        booking_id: bookingId,
        meeting_title: booking.title,
        generated_at: new Date().toISOString()
      })

    } catch (qrError) {
      console.error('Error generating QR code image:', qrError)
      return NextResponse.json(
        { error: 'Failed to generate QR code image' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Exception in QR generation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
