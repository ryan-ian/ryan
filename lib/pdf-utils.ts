import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface BookingData {
  id: string;
  room_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  organizer_name: string;
  organizer_email: string;
  purpose: string;
  status: string;
  created_at: string;
  actual_start_time?: string;
  actual_end_time?: string;
  total_amount?: number;
  payment_status?: string;
}

interface InvitationData {
  id: string;
  invitee_name: string;
  invitee_email: string;
  invitation_status: 'pending' | 'accepted' | 'declined';
  attendance_status: 'present' | 'absent' | null;
  check_in_time?: string;
  check_out_time?: string;
}

interface BookingAnalytics {
  totalInvited: number;
  totalAccepted: number;
  totalDeclined: number;
  totalAttended: number;
  checkInRate: number;
  averageCheckInTime: string;
  paymentStatus: string;
  totalAmount: number;
  duration: number;
}

interface PDFReportData {
  booking: BookingData;
  invitations: InvitationData[];
  analytics: BookingAnalytics;
}

/**
 * Generates a comprehensive PDF report for a booking
 * @param data - The booking data, invitations, and analytics
 * @returns Promise<void> - Downloads the PDF file
 */
export async function generateBookingReport(data: PDFReportData): Promise<void> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with company branding
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Conference Hub', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(16);
    doc.text('Meeting Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 20;

    // Booking Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Details', 20, yPosition);
    yPosition += 10;

    const bookingDetails = [
      ['Booking ID', data.booking.id],
      ['Room', data.booking.room_name],
      ['Organizer', `${data.booking.organizer_name} (${data.booking.organizer_email})`],
      ['Purpose', data.booking.purpose || 'Not specified'],
      ['Scheduled Start', new Date(data.booking.start_time).toLocaleString()],
      ['Scheduled End', new Date(data.booking.end_time).toLocaleString()],
      ['Duration', `${data.booking.duration} minutes`],
      ['Status', data.booking.status],
      ['Created', new Date(data.booking.created_at).toLocaleString()],
    ];

    // Add actual times if available
    if (data.booking.actual_start_time) {
      bookingDetails.push(['Actual Start', new Date(data.booking.actual_start_time).toLocaleString()]);
    }
    if (data.booking.actual_end_time) {
      bookingDetails.push(['Actual End', new Date(data.booking.actual_end_time).toLocaleString()]);
    }

    // Add payment information if available
    if (data.booking.total_amount !== undefined) {
      bookingDetails.push(['Total Amount', `$${data.booking.total_amount.toFixed(2)}`]);
    }
    if (data.booking.payment_status) {
      bookingDetails.push(['Payment Status', data.booking.payment_status]);
    }

    doc.autoTable({
      startY: yPosition,
      head: [['Field', 'Value']],
      body: bookingDetails,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 120 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Meeting Analytics Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Analytics', 20, yPosition);
    yPosition += 10;

    const analyticsData = [
      ['Total Invited', data.analytics.totalInvited.toString()],
      ['Accepted Invitations', data.analytics.totalAccepted.toString()],
      ['Declined Invitations', data.analytics.totalDeclined.toString()],
      ['Actually Attended', data.analytics.totalAttended.toString()],
      ['Check-in Rate', `${data.analytics.checkInRate.toFixed(1)}%`],
      ['Average Check-in Time', data.analytics.averageCheckInTime || 'N/A'],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: analyticsData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 100 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Attendee List Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendee Details', 20, yPosition);
    yPosition += 10;

    // Prepare attendee data
    const attendeeData = data.invitations.map(invitation => [
      invitation.invitee_name,
      invitation.invitee_email,
      invitation.invitation_status,
      invitation.attendance_status || 'Unknown',
      invitation.check_in_time ? new Date(invitation.check_in_time).toLocaleTimeString() : 'N/A',
      invitation.check_out_time ? new Date(invitation.check_out_time).toLocaleTimeString() : 'N/A'
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [['Name', 'Email', 'Invitation', 'Attendance', 'Check-in', 'Check-out']],
      body: attendeeData,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Summary Statistics
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 10;

    const presentAttendees = data.invitations.filter(inv => inv.attendance_status === 'present');
    const absentAttendees = data.invitations.filter(inv => inv.attendance_status === 'absent');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (presentAttendees.length > 0) {
      doc.text('Present Attendees:', 20, yPosition);
      yPosition += 5;
      presentAttendees.forEach(attendee => {
        doc.text(`• ${attendee.invitee_name} (${attendee.invitee_email})`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (absentAttendees.length > 0) {
      doc.text('Absent Attendees:', 20, yPosition);
      yPosition += 5;
      absentAttendees.forEach(attendee => {
        doc.text(`• ${attendee.invitee_name} (${attendee.invitee_email})`, 25, yPosition);
        yPosition += 5;
      });
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This report was generated by Conference Hub - Room Booking System', pageWidth / 2, footerY, { align: 'center' });

    // Generate filename
    const roomName = data.booking.room_name.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date(data.booking.start_time).toISOString().split('T')[0];
    const filename = `Meeting_Report_${roomName}_${date}_${data.booking.id.slice(0, 8)}.pdf`;

    // Save the PDF
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw new Error('Failed to generate PDF report. Please try again.');
  }
}

/**
 * Utility function to format duration in a human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
}

/**
 * Utility function to calculate check-in rate
 */
export function calculateCheckInRate(invitations: InvitationData[]): number {
  const totalInvited = invitations.length;
  if (totalInvited === 0) return 0;
  
  const attended = invitations.filter(inv => inv.attendance_status === 'present').length;
  return (attended / totalInvited) * 100;
}

/**
 * Utility function to calculate average check-in time
 */
export function calculateAverageCheckInTime(invitations: InvitationData[]): string {
  const checkInTimes = invitations
    .filter(inv => inv.check_in_time)
    .map(inv => new Date(inv.check_in_time!));

  if (checkInTimes.length === 0) return 'N/A';

  const totalMinutes = checkInTimes.reduce((sum, time) => {
    return sum + time.getHours() * 60 + time.getMinutes();
  }, 0);

  const averageMinutes = totalMinutes / checkInTimes.length;
  const hours = Math.floor(averageMinutes / 60);
  const minutes = Math.round(averageMinutes % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
