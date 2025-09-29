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
  attendance_status: 'present' | 'not_present' | null;
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
    // Validate input data
    if (!data || !data.booking || !data.analytics) {
      throw new Error('Invalid data provided for PDF generation');
    }

    // Validate required booking fields
    if (!data.booking.id || !data.booking.room_name || !data.booking.start_time || !data.booking.end_time) {
      throw new Error('Missing required booking information');
    }

    console.log('Starting PDF generation with data:', {
      bookingId: data.booking.id,
      roomName: data.booking.room_name,
      invitationsCount: data.invitations?.length || 0,
      analyticsPresent: !!data.analytics
    });

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

    // Safely format dates and handle potential null/undefined values
    const formatDate = (dateString: string | null | undefined): string => {
      if (!dateString) return 'Not available';
      try {
        return new Date(dateString).toLocaleString();
      } catch (error) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid date';
      }
    };

    const bookingDetails = [
      ['Booking ID', data.booking.id || 'Unknown'],
      ['Room', data.booking.room_name || 'Unknown Room'],
      ['Organizer', `${data.booking.organizer_name || 'Unknown'} (${data.booking.organizer_email || 'Unknown'})`],
      ['Purpose', data.booking.purpose || 'Not specified'],
      ['Scheduled Start', formatDate(data.booking.start_time)],
      ['Scheduled End', formatDate(data.booking.end_time)],
      ['Duration', `${data.booking.duration || 0} minutes`],
      ['Status', data.booking.status || 'Unknown'],
      ['Created', formatDate(data.booking.created_at)],
    ];

    // Add actual times if available
    if (data.booking.actual_start_time) {
      bookingDetails.push(['Actual Start', formatDate(data.booking.actual_start_time)]);
    }
    if (data.booking.actual_end_time) {
      bookingDetails.push(['Actual End', formatDate(data.booking.actual_end_time)]);
    }

    // Add payment information if available
    if (data.booking.total_amount !== undefined && data.booking.total_amount !== null) {
      bookingDetails.push(['Total Amount', `$${Number(data.booking.total_amount).toFixed(2)}`]);
    }
    if (data.booking.payment_status) {
      bookingDetails.push(['Payment Status', data.booking.payment_status]);
    }

    try {
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
    } catch (tableError) {
      console.error('Error creating booking details table:', tableError);
      throw new Error('Failed to create booking details table in PDF');
    }

    yPosition = (doc as any).lastAutoTable.finalY + 20;

    // Meeting Analytics Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Meeting Analytics', 20, yPosition);
    yPosition += 10;

    // Safely handle analytics data with defaults
    const safeAnalytics = {
      totalInvited: data.analytics.totalInvited || 0,
      totalAccepted: data.analytics.totalAccepted || 0,
      totalDeclined: data.analytics.totalDeclined || 0,
      totalAttended: data.analytics.totalAttended || 0,
      checkInRate: data.analytics.checkInRate || 0,
      averageCheckInTime: data.analytics.averageCheckInTime || 'N/A'
    };

    const analyticsData = [
      ['Total Invited', safeAnalytics.totalInvited.toString()],
      ['Accepted Invitations', safeAnalytics.totalAccepted.toString()],
      ['Declined Invitations', safeAnalytics.totalDeclined.toString()],
      ['Actually Attended', safeAnalytics.totalAttended.toString()],
      ['Check-in Rate', `${Number(safeAnalytics.checkInRate).toFixed(1)}%`],
      ['Average Check-in Time', safeAnalytics.averageCheckInTime],
    ];

    try {
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
    } catch (tableError) {
      console.error('Error creating analytics table:', tableError);
      throw new Error('Failed to create analytics table in PDF');
    }

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

    // Safely handle invitations data
    const safeInvitations = data.invitations || [];

    // Prepare attendee data with safe formatting
    const attendeeData = safeInvitations.map(invitation => {
      const formatTime = (timeString: string | null | undefined): string => {
        if (!timeString) return 'N/A';
        try {
          return new Date(timeString).toLocaleTimeString();
        } catch (error) {
          console.warn('Invalid time format:', timeString);
          return 'Invalid time';
        }
      };

      return [
        invitation.invitee_name || 'Unknown',
        invitation.invitee_email || 'Unknown',
        invitation.invitation_status || 'Unknown',
        invitation.attendance_status || 'Unknown',
        formatTime(invitation.check_in_time),
        formatTime(invitation.check_out_time)
      ];
    });

    try {
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
    } catch (tableError) {
      console.error('Error creating attendee table:', tableError);
      throw new Error('Failed to create attendee table in PDF');
    }

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

    // Safely filter attendees
    const presentAttendees = safeInvitations.filter(inv => inv.attendance_status === 'present');
    const absentAttendees = safeInvitations.filter(inv => inv.attendance_status === 'not_present' || (inv.attendance_status !== 'present' && inv.attendance_status !== null));

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (presentAttendees.length > 0) {
      doc.text('Present Attendees:', 20, yPosition);
      yPosition += 5;
      presentAttendees.forEach(attendee => {
        const name = attendee.invitee_name || 'Unknown';
        const email = attendee.invitee_email || 'Unknown';
        doc.text(`• ${name} (${email})`, 25, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (absentAttendees.length > 0) {
      doc.text('Absent Attendees:', 20, yPosition);
      yPosition += 5;
      absentAttendees.forEach(attendee => {
        const name = attendee.invitee_name || 'Unknown';
        const email = attendee.invitee_email || 'Unknown';
        doc.text(`• ${name} (${email})`, 25, yPosition);
        yPosition += 5;
      });
    }

    // Footer
    const footerY = pageHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This report was generated by Conference Hub - Room Booking System', pageWidth / 2, footerY, { align: 'center' });

    // Generate filename with safe formatting
    const safeRoomName = (data.booking.room_name || 'Unknown_Room').replace(/[^a-zA-Z0-9]/g, '_');
    const safeDate = (() => {
      try {
        return new Date(data.booking.start_time).toISOString().split('T')[0];
      } catch (error) {
        console.warn('Invalid start_time for filename:', data.booking.start_time);
        return new Date().toISOString().split('T')[0];
      }
    })();
    const safeBookingId = (data.booking.id || 'unknown').slice(0, 8);
    const filename = `Meeting_Report_${safeRoomName}_${safeDate}_${safeBookingId}.pdf`;

    console.log('PDF generation completed successfully, saving as:', filename);

    // Save the PDF
    try {
      doc.save(filename);
      console.log('PDF saved successfully');
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      throw new Error('Failed to save PDF file. Please check your browser settings.');
    }
  } catch (error) {
    console.error('Error generating PDF report:', error);
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      throw error; // Re-throw specific errors with their messages
    } else {
      throw new Error('Failed to generate PDF report. Please try again.');
    }
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
