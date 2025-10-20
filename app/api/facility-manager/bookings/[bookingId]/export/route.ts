import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getBookingByIdWithDetails } from "@/lib/supabase-data"
import puppeteer from 'puppeteer'

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Get user info from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user profile to verify facility manager role
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('id, role, name')
      .eq('id', user.id)
      .single()

    if (userError || !userProfile || (userProfile.role !== 'facility_manager' && userProfile.role !== 'admin')) {
      return NextResponse.json({ error: "Facility manager access required" }, { status: 403 })
    }

    const { bookingId } = await params

    console.log(`📄 [Booking PDF Export] Generating report for booking ${bookingId}`)

    // Get booking details with all related data
    const booking = await getBookingByIdWithDetails(bookingId)
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Get meeting invitations for this booking
    const { data: invitations, error: invitationsError } = await supabase
      .from('meeting_invitations')
      .select(`
        id,
        invitee_name,
        invitee_email,
        status,
        attendance_status,
        attended_at,
        created_at,
        updated_at
      `)
      .eq('booking_id', bookingId)

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
    }

    // Calculate analytics (focus only on attendance, no RSVP tracking)
    const totalInvited = invitations?.length || 0
    const totalAttended = invitations?.filter(inv => inv.attendance_status === 'present').length || 0
    const attendanceRate = totalInvited > 0 ? (totalAttended / totalInvited) * 100 : 0

    // Calculate average check-in time from attended_at timestamps
    const attendedInvitations = invitations?.filter(inv => inv.attended_at) || []
    let averageCheckInTime = 'N/A'
    
    if (attendedInvitations.length > 0) {
      const totalMinutes = attendedInvitations.reduce((sum, inv) => {
        const checkInTime = new Date(inv.attended_at!)
        return sum + checkInTime.getHours() * 60 + checkInTime.getMinutes()
      }, 0)
      const avgMinutes = totalMinutes / attendedInvitations.length
      const hours = Math.floor(avgMinutes / 60)
      const minutes = Math.round(avgMinutes % 60)
      averageCheckInTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    const analytics = {
      totalInvited,
      totalAttended,
      attendanceRate,
      averageCheckInTime,
      duration: booking.duration || 0
    }

    // Generate PDF
    const pdfBuffer = await generateBookingPDFReport({
      booking,
      invitations: invitations || [],
      analytics,
      generatedBy: userProfile.name
    })

    // Return PDF as response
    const safeRoomName = (booking.rooms?.name || 'Unknown_Room').replace(/[^a-zA-Z0-9]/g, '_')
    const safeDate = new Date(booking.start_time).toISOString().split('T')[0]
    const filename = `booking-report-${safeRoomName}-${safeDate}-${bookingId.slice(0, 8)}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error("❌ [Booking PDF Export] Error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to generate booking report" 
      },
      { status: 500 }
    )
  }
}

async function generateBookingPDFReport(data: any): Promise<Buffer> {
  // Check if we're in production (Vercel) or development
  const isProduction = process.env.NODE_ENV === 'production'
  
  let browserConfig: any
  
  if (isProduction) {
    // Production: Use @sparticuz/chromium for Vercel
    const chromium = require('@sparticuz/chromium')
    browserConfig = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }
  } else {
    // Development: Use regular puppeteer with local Chrome
    browserConfig = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  }

  const browser = await puppeteer.launch(browserConfig)
  const page = await browser.newPage()

  // Generate HTML content for the booking report
  const htmlContent = generateBookingReportHTML(data)

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '1in',
      right: '1in',
      bottom: '1in',
      left: '1in'
    }
  })

  await browser.close()

  return pdfBuffer
}

function generateBookingReportHTML(data: any): string {
  const { booking, invitations, analytics, generatedBy } = data

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed'
      case 'pending': return 'status-pending'
      case 'cancelled': return 'status-cancelled'
      default: return 'status-default'
    }
  }


  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Booking Report - ${booking.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
        }
        
        .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
            font-size: 14px;
        }
        
        .booking-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .booking-info h2 {
            color: #1e40af;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-confirmed {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-pending {
            background: #fef3c7;
            color: #92400e;
        }
        
        .status-cancelled {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 14px;
        }
        
        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .metric-title {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .table th {
            background: #f8fafc;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-weight: bold;
            color: #374151;
        }
        
        .table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        
        .attendance-present {
            background: #dcfce7;
            color: #166534;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .attendance-absent {
            background: #fee2e2;
            color: #991b1b;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <h1>Meeting Report</h1>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
    </div>

    <!-- Booking Information -->
    <div class="booking-info">
        <h2>
          ${booking.title || 'Meeting'}
          <span class="status-badge ${getStatusBadgeClass(booking.status)}">${booking.status}</span>
        </h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Booking ID</div>
                <div class="info-value">${booking.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Room</div>
                <div class="info-value">${booking.rooms?.name || 'Unknown Room'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">${booking.rooms?.location || 'Not specified'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Capacity</div>
                <div class="info-value">${booking.rooms?.capacity ? `Up to ${booking.rooms.capacity} people` : 'Not specified'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${formatDate(booking.start_time)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Time</div>
                <div class="info-value">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Duration</div>
                <div class="info-value">${analytics.duration} minutes</div>
            </div>
            <div class="info-item">
                <div class="info-label">Organizer</div>
                <div class="info-value">${booking.users?.name || 'Unknown'} (${booking.users?.email || 'Unknown'})</div>
            </div>
        </div>
        ${booking.description ? `
        <div style="margin-top: 15px;">
            <div class="info-label">Description</div>
            <div class="info-value">${booking.description}</div>
        </div>
        ` : ''}
    </div>

    <!-- Meeting Analytics -->
    <div class="section">
        <h2>Meeting Analytics</h2>
        <div class="analytics-grid">
            <div class="metric-card">
                <div class="metric-title">Total Invited</div>
                <div class="metric-value">${analytics.totalInvited}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Attended</div>
                <div class="metric-value">${analytics.totalAttended}</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Attendance Rate</div>
                <div class="metric-value">${analytics.attendanceRate.toFixed(1)}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-title">Avg Check-in Time</div>
                <div class="metric-value">${analytics.averageCheckInTime}</div>
            </div>
        </div>
    </div>

    <!-- Invitations -->
    ${invitations.length > 0 ? `
    <div class="section">
        <h2>Meeting Invitations & Attendance</h2>
        <table class="table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Attendance</th>
                    <th>Check-in Time</th>
                </tr>
            </thead>
            <tbody>
                ${invitations.map(invitation => `
                <tr>
                    <td>${invitation.invitee_name || 'Unknown'}</td>
                    <td>${invitation.invitee_email}</td>
                    <td><span class="${invitation.attendance_status === 'present' ? 'attendance-present' : 'attendance-absent'}">${invitation.attendance_status === 'present' ? 'Present' : 'Not Present'}</span></td>
                    <td>${invitation.attended_at ? formatDateTime(invitation.attended_at) : 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}


    <!-- Summary -->
    <div class="section">
        <h2>Summary</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <p><strong>Meeting Overview:</strong> ${booking.title || 'Meeting'} was ${booking.status} and scheduled for ${analytics.duration} minutes in ${booking.rooms?.name || 'Unknown Room'}.</p>
            
            ${analytics.totalInvited > 0 ? `
            <p style="margin-top: 10px;"><strong>Attendance:</strong> ${analytics.totalInvited} people were invited and ${analytics.totalAttended} actually attended (${analytics.attendanceRate.toFixed(1)}% attendance rate).</p>
            ` : ''}
            
            ${analytics.averageCheckInTime !== 'N/A' ? `
            <p style="margin-top: 10px;"><strong>Average Check-in Time:</strong> ${analytics.averageCheckInTime}</p>
            ` : ''}
            
            ${booking.status === 'cancelled' && booking.rejection_reason ? `
            <p style="margin-top: 10px; color: #991b1b;"><strong>Cancellation Reason:</strong> ${booking.rejection_reason}</p>
            ` : ''}
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>This report was generated by Conference Hub - Room Booking System</p>
        <p>Generated by: ${generatedBy} | Report ID: ${booking.id.slice(0, 8)}</p>
    </div>
</body>
</html>
  `
}
