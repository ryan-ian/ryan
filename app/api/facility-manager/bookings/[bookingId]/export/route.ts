import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getBookingByIdWithDetails } from "@/lib/supabase-data"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Increase timeout for PDF generation
export const maxDuration = 30

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

    // Generate PDF using appropriate method based on environment
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
  // Always use Puppeteer for consistent high-quality PDFs
  // Dynamic imports based on environment as per Vercel guide
  const isVercel = !!process.env.VERCEL_ENV
  
  console.log(`🔍 [Booking PDF Generation] Environment: ${isVercel ? 'Vercel Production' : 'Development'}`)
  
  let puppeteer: any
  let launchOptions: any = {
    headless: true,
  }

  try {
    if (isVercel) {
      console.log('📦 [Booking PDF Generation] Loading @sparticuz/chromium and puppeteer-core for Vercel...')
      // Production: Use @sparticuz/chromium for Vercel
      const chromium = (await import("@sparticuz/chromium")).default
      puppeteer = await import("puppeteer-core")
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      }
      console.log('✅ [Booking PDF Generation] Successfully loaded Chromium and Puppeteer-core')
    } else {
      console.log('📦 [Booking PDF Generation] Loading regular puppeteer for development...')
      // Development: Use regular puppeteer
      puppeteer = await import("puppeteer")
      console.log('✅ [Booking PDF Generation] Successfully loaded regular Puppeteer')
    }

    console.log('🚀 [Booking PDF Generation] Launching browser...')
    const browser = await puppeteer.launch(launchOptions)
    console.log('✅ [Booking PDF Generation] Browser launched successfully')

  const page = await browser.newPage()
    console.log('📄 [Booking PDF Generation] Created new page')

  // Generate HTML content for the booking report
  const htmlContent = generateBookingReportHTML(data)
    console.log('📝 [Booking PDF Generation] Generated HTML content')

  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    console.log('📄 [Booking PDF Generation] Set page content')

  // Generate PDF
    console.log('🖨️ [Booking PDF Generation] Generating PDF...')
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
    console.log('✅ [Booking PDF Generation] PDF generated successfully with Puppeteer')

  await browser.close()
    console.log('🔒 [Booking PDF Generation] Browser closed')
    return pdfBuffer

  } catch (error) {
    console.error('❌ [Booking PDF Generation] Puppeteer failed:', error)
    console.log('🔄 [Booking PDF Generation] Falling back to jsPDF...')
    // Fallback to jsPDF if Puppeteer fails
    return generateBookingPDFWithJsPDF(data)
  }
}

function generateBookingPDFWithJsPDF(data: any): Buffer {
  const { booking, invitations, analytics, generatedBy } = data

  const doc = new jsPDF()
  
  // Helper functions
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return [34, 197, 94] // Green
      case 'pending': return [245, 158, 11] // Yellow
      case 'cancelled': return [239, 68, 68] // Red
      default: return [107, 114, 128] // Gray
    }
  }

  let yPosition = 20

  // Header with blue accent line
  doc.setFillColor(37, 99, 235) // Blue color
  doc.rect(0, 0, 210, 8, 'F') // Blue header bar
  
  doc.setFontSize(24)
  doc.setTextColor(30, 64, 175) // Blue text
  doc.text('Meeting Report', 20, 25)
  
  doc.setFontSize(12)
  doc.setTextColor(107, 114, 128) // Gray text
  doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 20, 32)
  yPosition = 45

  // Meeting Information Card
  doc.setFillColor(248, 250, 252) // Light gray background
  doc.roundedRect(15, yPosition - 5, 180, 50, 3, 3, 'F')
  
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Meeting Information', 20, yPosition)
  
  // Status badge
  const statusColor = getStatusColor(booking.status)
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
  doc.roundedRect(150, yPosition - 8, 40, 12, 6, 6, 'F')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(booking.status.toUpperCase(), 155, yPosition - 1)
  
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Meeting Title: ${booking.title || 'Meeting'}`, 20, yPosition)
  doc.text(`Booking ID: ${booking.id}`, 110, yPosition)
  yPosition += 6
  doc.text(`Room: ${booking.rooms?.name || 'Unknown Room'}`, 20, yPosition)
  doc.text(`Location: ${booking.rooms?.location || 'Not specified'}`, 110, yPosition)
  yPosition += 6
  doc.text(`Capacity: ${booking.rooms?.capacity ? `Up to ${booking.rooms.capacity} people` : 'Not specified'}`, 20, yPosition)
  doc.text(`Duration: ${analytics.duration} minutes`, 110, yPosition)
  yPosition += 6
  doc.text(`Date: ${formatDate(booking.start_time)}`, 20, yPosition)
  doc.text(`Time: ${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`, 110, yPosition)
  yPosition += 6
  doc.text(`Organizer: ${booking.users?.name || 'Unknown'} (${booking.users?.email || 'Unknown'})`, 20, yPosition)
  yPosition += 15

  if (booking.description) {
    doc.text(`Description: ${booking.description}`, 20, yPosition)
    yPosition += 10
  }

  // Meeting Analytics Cards
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Meeting Analytics', 20, yPosition)
  yPosition += 15

  // Analytics cards in 2x2 grid
  const analyticsCards = [
    { label: 'Total Invited', value: analytics.totalInvited.toString(), color: [30, 64, 175] },
    { label: 'Attended', value: analytics.totalAttended.toString(), color: [34, 197, 94] },
    { label: 'Attendance Rate', value: `${analytics.attendanceRate.toFixed(1)}%`, color: [59, 130, 246] },
    { label: 'Avg Check-in Time', value: analytics.averageCheckInTime, color: [168, 85, 247] }
  ]

  for (let i = 0; i < analyticsCards.length; i++) {
    const row = Math.floor(i / 2)
    const col = i % 2
    const cardX = 20 + (col * 90)
    const cardY = yPosition + (row * 35)
    
    // Card background
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(cardX, cardY, 85, 30, 3, 3, 'FD')
    
    // Card content
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.text(analyticsCards[i].label.toUpperCase(), cardX + 5, cardY + 8)
    
    doc.setFontSize(18)
    doc.setTextColor(analyticsCards[i].color[0], analyticsCards[i].color[1], analyticsCards[i].color[2])
    doc.text(analyticsCards[i].value, cardX + 5, cardY + 20)
  }

  yPosition += 80

  // Invitations table
  if (invitations.length > 0) {
    doc.setFontSize(16)
    doc.setTextColor(30, 64, 175)
    doc.text('Meeting Invitations & Attendance', 20, yPosition)
    yPosition += 10

    const invitationData = invitations.map(invitation => [
      invitation.invitee_name || 'Unknown',
      invitation.invitee_email,
      invitation.attendance_status === 'present' ? 'Present' : 'Not Present',
      invitation.attended_at ? formatDateTime(invitation.attended_at) : 'N/A'
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Email', 'Attendance', 'Check-in Time']],
      body: invitationData,
      styles: { 
        fontSize: 9,
        cellPadding: 5,
        lineColor: [229, 231, 235],
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [55, 65, 81],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 20, right: 20 }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 20
  }

  // Summary Card
  doc.setFontSize(16)
  doc.setTextColor(30, 64, 175)
  doc.text('Summary', 20, yPosition)
  yPosition += 10

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(20, yPosition, 170, 50, 3, 3, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Meeting Overview: ${booking.title || 'Meeting'} was ${booking.status} and scheduled for ${analytics.duration} minutes in ${booking.rooms?.name || 'Unknown Room'}.`, 25, yPosition + 8)
  yPosition += 15

  if (analytics.totalInvited > 0) {
    doc.text(`Attendance: ${analytics.totalInvited} people were invited and ${analytics.totalAttended} actually attended (${analytics.attendanceRate.toFixed(1)}% attendance rate).`, 25, yPosition + 8)
    yPosition += 12
  }

  if (analytics.averageCheckInTime !== 'N/A') {
    doc.text(`Average Check-in Time: ${analytics.averageCheckInTime}`, 25, yPosition + 8)
    yPosition += 12
  }

  if (booking.status === 'cancelled' && booking.rejection_reason) {
    doc.setTextColor(153, 27, 27)
    doc.text(`Cancellation Reason: ${booking.rejection_reason}`, 25, yPosition + 8)
  }

  // Footer
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('This report was generated by Conference Hub - Room Booking System', 20, doc.internal.pageSize.height - 20)
  doc.text(`Generated by: ${generatedBy} | Report ID: ${booking.id.slice(0, 8)}`, 20, doc.internal.pageSize.height - 10)

  return Buffer.from(doc.output('arraybuffer'))
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
