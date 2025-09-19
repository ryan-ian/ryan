import nodemailer from 'nodemailer'
import { format } from 'date-fns'

// Email configuration
let transporter: nodemailer.Transporter | null = null

// Initialize email service
export async function initEmailService(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    // Don't initialize on client side
    return false
  }

  try {
    console.log('📧 Initializing email service...')
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ Missing required SMTP environment variables:')
      console.error(`   SMTP_HOST: ${process.env.SMTP_HOST ? 'SET' : 'MISSING'}`)
      console.error(`   SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'MISSING'}`)
      console.error(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'SET' : 'MISSING'}`)
      return false
    }

    // Log current configuration (without sensitive data)
    console.log('📧 SMTP Configuration:')
    console.log(`   Host: ${process.env.SMTP_HOST}`)
    console.log(`   Port: ${process.env.SMTP_PORT || '587'}`)
    console.log(`   Secure: ${process.env.SMTP_SECURE === 'true'}`)
    console.log(`   User: ${process.env.SMTP_USER}`)

    const config = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Add additional options for better reliability
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
      debug: true, // Enable debug output
      logger: true, // Enable logging
    }

    transporter = nodemailer.createTransport(config)

    // Verify the connection with timeout
    console.log('📧 Verifying SMTP connection...')
    const verifyPromise = transporter.verify()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SMTP verification timeout')), 30000)
    })
    
    await Promise.race([verifyPromise, timeoutPromise])
    
    console.log('✅ Email service initialized and verified successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error)

    // Provide specific troubleshooting based on error
    if (error && typeof error === 'object' && 'code' in error) {
      const errorWithCode = error as { code?: string; responseCode?: number }

      if (errorWithCode.code === 'ECONNREFUSED') {
        console.error('🔧 TROUBLESHOOTING: Connection refused - Check your SMTP_HOST and SMTP_PORT')
      } else if (errorWithCode.code === 'ENOTFOUND') {
        console.error('🔧 TROUBLESHOOTING: Host not found - Check your SMTP_HOST')
      } else if (errorWithCode.responseCode === 421) {
        console.error('🔧 TROUBLESHOOTING: Service not available - Try different port or check with email provider')
      } else if (errorWithCode.code === 'EAUTH') {
        console.error('🔧 TROUBLESHOOTING: Authentication failed - Check your SMTP_USER and SMTP_PASSWORD')
      }
    }
    
    transporter = null
    return false
  }
}

// Interface for email attachments
export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType: string
  encoding?: string
}

// Send basic email
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
  attachments?: EmailAttachment[]
): Promise<boolean> {
  try {
    console.log(`📧 ===== SEND EMAIL START =====`)
    console.log(`📧 To: ${to}`)
    console.log(`📧 Subject: ${subject}`)
    if (attachments && attachments.length > 0) {
      console.log(`📎 Attachments: ${attachments.map(a => a.filename).join(', ')}`)
    }
    
    if (!transporter) {
      console.log('📧 Transporter not initialized, initializing now...')
      const initResult = await initEmailService()
      
      if (!initResult || !transporter) {
        console.error('❌ Failed to initialize email transporter')
        return false
      }
    }

    const mailOptions: any = {
      from: `${process.env.EMAIL_FROM_NAME || 'Conference Hub'} <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(attachment => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        encoding: attachment.encoding || 'utf8'
      }))
    }

    console.log(`📧 Sending email...`)
    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully:`, result.messageId)
    console.log(`📧 ===== SEND EMAIL END =====`)
    
    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    console.log(`📧 ===== SEND EMAIL END (ERROR) =====`)
    return false
  }
}

// Send booking request submitted email
export async function sendBookingRequestSubmittedEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING REQUEST SUBMITTED EMAIL START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Start Time: ${startTime}`);
  console.log(`📧 End Time: ${endTime}`);

  // Validate input parameters with type checking
  if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail, typeof userEmail);
    return false;
  }

  if (!userName || typeof userName !== 'string') {
    console.error('❌ Invalid user name:', userName, typeof userName);
    return false;
  }

  if (!bookingTitle || typeof bookingTitle !== 'string') {
    console.error('❌ Invalid booking title:', bookingTitle, typeof bookingTitle);
    return false;
  }

  if (!roomName || typeof roomName !== 'string') {
    console.error('❌ Invalid room name:', roomName, typeof roomName);
    return false;
  }

  let formattedDate, formattedStartTime, formattedEndTime;

  try {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('❌ Invalid date format:', { startTime, endTime });
      return false;
    }

    formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
    formattedStartTime = format(startDate, 'h:mm a');
    formattedEndTime = format(endDate, 'h:mm a');

    console.log('✅ Date formatting successful:', {
      formattedDate,
      formattedStartTime,
      formattedEndTime
    });
  } catch (error) {
    console.error('❌ Error formatting dates:', error);
    return false;
  }

  const subject = `Booking Request Submitted: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Booking Request Received</h2>
      <p>Hello ${userName},</p>
      <p>Thank you for submitting your booking request. We have received your request and it is now pending approval from the facility manager.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        <p><strong>Status:</strong> <span style="color: #FF9800; font-weight: bold;">Pending Approval</span></p>
      </div>
      <p>You will receive another email notification once your booking has been reviewed. You can also check the status of your booking by logging into the Conference Hub application.</p>
      <p>If you have any questions or need to make changes to your request, please contact your facility manager.</p>
      <p>Thank you for using Conference Hub!</p>
    </div>
  `;

  const text = `
    Booking Request Received
    Hello ${userName},
    Thank you for submitting your booking request. We have received your request and it is now pending approval from the facility manager.
    
    Title: ${bookingTitle}
    Room: ${roomName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    Status: Pending Approval
    
    You will receive another email notification once your booking has been reviewed. You can also check the status of your booking by logging into the Conference Hub application.
    If you have any questions or need to make changes to your request, please contact your facility manager.
    Thank you for using Conference Hub!
  `;

  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING REQUEST SUBMITTED EMAIL END =====');
  
  return result;
}

// Send booking confirmation email
export async function sendBookingConfirmationEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING CONFIRMATION EMAIL START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');

  const subject = `Booking Confirmed: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Booking Confirmed!</h2>
      <p>Hello ${userName},</p>
      <p>Great news! Your booking request has been approved and confirmed.</p>
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">✅ Confirmed</span></p>
      </div>
      <p>Your room is now reserved for the specified time. Please arrive on time and ensure you have everything needed for your meeting.</p>
      <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
        <h4 style="margin-top: 0; color: #2196F3;">Important Reminders:</h4>
        <ul style="margin-bottom: 0;">
          <li>Please arrive on time for your meeting</li>
          <li>Ensure you have all necessary materials and equipment</li>
          <li>If you need to make changes or cancel, contact your facility manager as soon as possible</li>
          <li>Please leave the room clean and ready for the next user</li>
        </ul>
      </div>
      <p>Thank you for using Conference Hub!</p>
      <p>Best regards,<br>Conference Hub Team</p>
    </div>
  `;

  const text = `
    Booking Confirmed!
    Hello ${userName},
    Great news! Your booking request has been approved and confirmed.

    Title: ${bookingTitle}
    Room: ${roomName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    Status: ✅ Confirmed

    Your room is now reserved for the specified time.

    Important Reminders:
    - Please arrive on time for your meeting
    - Ensure you have all necessary materials and equipment
    - If you need to make changes or cancel, contact your facility manager as soon as possible
    - Please leave the room clean and ready for the next user

    Thank you for using Conference Hub!

    Best regards,
    Conference Hub Team
  `;

  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING CONFIRMATION EMAIL END =====');
  
  return result;
}

// Send booking rejection email
export async function sendBookingRejectionEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  rejectionReason: string,
  startTime?: string,
  endTime?: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING REJECTION EMAIL START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Rejection Reason: ${rejectionReason}`);
  console.log(`📧 Start Time: ${startTime || 'N/A'}`);
  console.log(`📧 End Time: ${endTime || 'N/A'}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  // Format date and time if provided
  let formattedDate = '';
  let formattedStartTime = '';
  let formattedEndTime = '';
  let dateTimeSection = '';

  if (startTime && endTime) {
    try {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);

      formattedDate = startDateTime.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      formattedStartTime = startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      formattedEndTime = endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      dateTimeSection = `
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>`;
    } catch (error) {
      console.warn('📧 Could not format date/time for rejection email:', error);
    }
  }

  const subject = `Booking Request Update: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">Booking Request Update</h2>
      <p>Hello ${userName},</p>
      <p>We regret to inform you that your booking request could not be approved at this time.</p>
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>${dateTimeSection}
        <p><strong>Status:</strong> <span style="color: #f44336; font-weight: bold;">❌ Not Approved</span></p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
      </div>
      <p>Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.</p>
      <p>Thank you for your understanding.</p>
      <p>Best regards,<br>Conference Hub Team</p>
    </div>
  `;

  const textDateTimeSection = startTime && endTime ? `
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}` : '';

  const text = `
    Booking Request Update
    Hello ${userName},
    We regret to inform you that your booking request could not be approved at this time.

    Title: ${bookingTitle}
    Room: ${roomName}${textDateTimeSection}
    Status: ❌ Not Approved
    Reason: ${rejectionReason}

    Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.
    Thank you for your understanding.

    Best regards,
    Conference Hub Team
  `;

  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING REJECTION EMAIL END =====');

  return result;
}

// Send user booking cancellation email
export async function sendUserBookingCancellationEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  console.log('📧 ===== USER BOOKING CANCELLATION EMAIL START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');

  const subject = `Booking Cancelled: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">Booking Cancelled</h2>
      <p>Hello ${userName},</p>
      <p>This email confirms that you have successfully cancelled your booking.</p>
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        <p><strong>Status:</strong> <span style="color: #f44336; font-weight: bold;">❌ Cancelled</span></p>
      </div>
      <p>If you need to book another room or time slot, please visit the Conference Hub application to make a new reservation.</p>
      <p>Thank you for using Conference Hub!</p>
    </div>
  `;

  const text = `
    Booking Cancelled
    Hello ${userName},
    This email confirms that you have successfully cancelled your booking.
    
    Title: ${bookingTitle}
    Room: ${roomName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    Status: ❌ Cancelled
    
    If you need to book another room or time slot, please visit the Conference Hub application to make a new reservation.
    Thank you for using Conference Hub!
  `;

  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== USER BOOKING CANCELLATION EMAIL END =====');
  
  return result;
}

// Send booking creation notification to facility manager
export async function sendBookingCreationNotificationToManager(
  managerEmail: string,
  managerName: string,
  userName: string,
  userEmail: string,
  bookingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING CREATION NOTIFICATION TO MANAGER START =====');
  console.log(`📧 Manager Email: ${managerEmail}`);
  console.log(`📧 Manager Name: ${managerName}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Facility Name: ${facilityName}`);
  console.log(`📧 Start Time: ${startTime}`);
  console.log(`📧 End Time: ${endTime}`);

  if (!managerEmail || !managerEmail.includes('@')) {
    console.error('❌ Invalid manager email address:', managerEmail);
    return false;
  }

  const formattedDate = format(new Date(startTime), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(startTime), 'h:mm a');
  const formattedEndTime = format(new Date(endTime), 'h:mm a');

  const subject = `New Booking Request: ${bookingTitle} - ${roomName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">📅 New Booking Request</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Conference Hub - ${facilityName}</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hello ${managerName},</p>
        <p>A new booking request has been submitted for your facility and requires your review.</p>

        <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
          <h3 style="margin-top: 0; color: #0284c7;">📋 Booking Details</h3>
          <p><strong>Title:</strong> ${bookingTitle}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Facility:</strong> ${facilityName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">⏳ Pending Approval</span></p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">👤 Requested By</h4>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h4 style="margin-top: 0; color: #16a34a;">🎯 Next Steps</h4>
          <p>Please log into the Conference Hub facility manager dashboard to review and approve or reject this booking request.</p>
          <p>The user will be notified automatically once you make a decision.</p>
        </div>

        <p>Thank you for managing your facility efficiently!</p>
        <p>Best regards,<br>Conference Hub Team</p>
      </div>
    </div>
  `;

  const text = `
    New Booking Request - Conference Hub

    Hello ${managerName},
    A new booking request has been submitted for your facility and requires your review.

    Booking Details:
    Title: ${bookingTitle}
    Room: ${roomName}
    Facility: ${facilityName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    Status: ⏳ Pending Approval

    Requested By:
    Name: ${userName}
    Email: ${userEmail}

    Next Steps:
    Please log into the Conference Hub facility manager dashboard to review and approve or reject this booking request.
    The user will be notified automatically once you make a decision.

    Thank you for managing your facility efficiently!

    Best regards,
    Conference Hub Team
  `;

  const result = await sendEmail(managerEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING CREATION NOTIFICATION TO MANAGER END =====');

  return result;
}

// Send booking modification confirmation to user
export async function sendBookingModificationConfirmationToUser(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  changes: string[]
): Promise<boolean> {
  console.log('📧 ===== BOOKING MODIFICATION CONFIRMATION TO USER START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Changes: ${changes.join(', ')}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  const formattedDate = format(new Date(startTime), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(startTime), 'h:mm a');
  const formattedEndTime = format(new Date(endTime), 'h:mm a');

  const subject = `Booking Updated: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">✅ Booking Updated Successfully</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Conference Hub</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hello ${userName},</p>
        <p>Your booking has been successfully updated. Here are the current details:</p>

        <div style="background-color: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">📋 Updated Booking Details</h3>
          <p><strong>Title:</strong> ${bookingTitle}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Facility:</strong> ${facilityName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
        </div>

        ${changes.length > 0 ? `
        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">📝 Changes Made</h4>
          <ul style="margin-bottom: 0;">
            ${changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
          <h4 style="margin-top: 0; color: #0284c7;">ℹ️ Important Notes</h4>
          <ul style="margin-bottom: 0;">
            <li>Your booking is confirmed and the room is reserved</li>
            <li>Please arrive on time for your meeting</li>
            <li>If you need to make further changes, please contact your facility manager</li>
          </ul>
        </div>

        <p>Thank you for using Conference Hub!</p>
        <p>Best regards,<br>Conference Hub Team</p>
      </div>
    </div>
  `;

  const text = `
    Booking Updated Successfully - Conference Hub

    Hello ${userName},
    Your booking has been successfully updated. Here are the current details:

    Updated Booking Details:
    Title: ${bookingTitle}
    Room: ${roomName}
    Facility: ${facilityName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}

    ${changes.length > 0 ? `
    Changes Made:
    ${changes.map(change => `- ${change}`).join('\n')}
    ` : ''}

    Important Notes:
    - Your booking is confirmed and the room is reserved
    - Please arrive on time for your meeting
    - If you need to make further changes, please contact your facility manager

    Thank you for using Conference Hub!

    Best regards,
    Conference Hub Team
  `;

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for user confirmation');
  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 [EMAIL DEBUG] sendEmail result for user: ${result}`);
  console.log('📧 ===== BOOKING MODIFICATION CONFIRMATION TO USER END =====');

  return result;
}

// Send booking modification notification to facility manager
export async function sendBookingModificationNotificationToManager(
  managerEmail: string,
  managerName: string,
  userName: string,
  userEmail: string,
  bookingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  changes: string[]
): Promise<boolean> {
  console.log('📧 ===== BOOKING MODIFICATION NOTIFICATION TO MANAGER START =====');
  console.log(`📧 Manager Email: ${managerEmail}`);
  console.log(`📧 Manager Name: ${managerName}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Changes: ${changes.join(', ')}`);

  if (!managerEmail || !managerEmail.includes('@')) {
    console.error('❌ Invalid manager email address:', managerEmail);
    return false;
  }

  const formattedDate = format(new Date(startTime), 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(new Date(startTime), 'h:mm a');
  const formattedEndTime = format(new Date(endTime), 'h:mm a');

  const subject = `Booking Modified: ${bookingTitle} - ${roomName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 24px;">📝 Booking Modified</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Conference Hub - ${facilityName}</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hello ${managerName},</p>
        <p>A booking in your facility has been modified by the user. Here are the updated details:</p>

        <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
          <h3 style="margin-top: 0; color: #0284c7;">📋 Current Booking Details</h3>
          <p><strong>Title:</strong> ${bookingTitle}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Facility:</strong> ${facilityName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
          <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">✅ Confirmed</span></p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">📝 Changes Made</h4>
          <ul style="margin-bottom: 0;">
            ${changes.map(change => `<li>${change}</li>`).join('')}
          </ul>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h4 style="margin-top: 0; color: #92400e;">👤 Modified By</h4>
          <p><strong>Name:</strong> ${userName}</p>
          <p><strong>Email:</strong> ${userEmail}</p>
        </div>

        <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
          <h4 style="margin-top: 0; color: #0284c7;">ℹ️ Information</h4>
          <p>This is a notification for your records. The booking has been automatically updated and no action is required from you unless there are any conflicts or concerns.</p>
          <p>You can view all bookings in your facility manager dashboard.</p>
        </div>

        <p>Thank you for managing your facility!</p>
        <p>Best regards,<br>Conference Hub Team</p>
      </div>
    </div>
  `;

  const text = `
    Booking Modified - Conference Hub

    Hello ${managerName},
    A booking in your facility has been modified by the user. Here are the updated details:

    Current Booking Details:
    Title: ${bookingTitle}
    Room: ${roomName}
    Facility: ${facilityName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    Status: ✅ Confirmed

    Changes Made:
    ${changes.map(change => `- ${change}`).join('\n')}

    Modified By:
    Name: ${userName}
    Email: ${userEmail}

    Information:
    This is a notification for your records. The booking has been automatically updated and no action is required from you unless there are any conflicts or concerns.
    You can view all bookings in your facility manager dashboard.

    Thank you for managing your facility!

    Best regards,
    Conference Hub Team
  `;

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for facility manager notification');
  const result = await sendEmail(managerEmail, subject, html, text);
  console.log(`📧 [EMAIL DEBUG] sendEmail result for manager: ${result}`);
  console.log('📧 ===== BOOKING MODIFICATION NOTIFICATION TO MANAGER END =====');

  return result;
}

// Send meeting invitation email
export async function sendMeetingInvitationEmail(
  inviteeEmail: string,
  inviteeName: string,
  organizerName: string,
  organizerEmail: string,
  meetingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  meetingDescription?: string
): Promise<boolean> {
  console.log('📧 ===== MEETING INVITATION EMAIL START =====');
  console.log(`📧 Invitee: ${inviteeEmail}${inviteeName ? ` (${inviteeName})` : ''}`);
  console.log(`📧 Organizer: ${organizerName} (${organizerEmail})`);
  console.log(`📧 Meeting: ${meetingTitle}`);
  console.log(`📧 Room: ${roomName} at ${facilityName}`);

  const subject = `Meeting Invitation: ${meetingTitle}`;

  // Format dates
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`;

  // Create personalized greeting
  const greeting = inviteeName ? `Dear ${inviteeName},` : `Hello,`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .meeting-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 12px; }
        .detail-label { font-weight: bold; min-width: 120px; color: #374151; }
        .detail-value { color: #1f2937; }
        .invitation-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .btn { display: inline-block; background: #0f766e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        .btn:hover { background: #0d5d56; }
        .btn-secondary { background: #6b7280; }
        .btn-secondary:hover { background: #4b5563; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Meeting Invitation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You're invited to join a meeting</p>
        </div>

        <div class="content">
          <p>${greeting}</p>

          <p><strong>${organizerName}</strong> has invited you to join the following meeting:</p>

          <div class="meeting-details">
            <h3 style="margin-top: 0; color: #1e3a8a;">${meetingTitle}</h3>

            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${dateStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">🕒 Time:</span>
              <span class="detail-value">${timeStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${roomName}, ${facilityName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">👤 Organizer:</span>
              <span class="detail-value">${organizerName} (${organizerEmail})</span>
            </div>

            ${meetingDescription ? `
            <div class="detail-row">
              <span class="detail-label">📝 Description:</span>
              <span class="detail-value">${meetingDescription}</span>
            </div>
            ` : ''}
          </div>

          <div class="invitation-note">
            <p style="margin: 0;"><strong>📌 Important:</strong> Please confirm your attendance by contacting the organizer directly. This invitation is for informational purposes.</p>
          </div>

          <p>If you have any questions about this meeting, please contact <strong>${organizerName}</strong> at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>

          <p>We look forward to seeing you there!</p>
        </div>

        <div class="footer">
          <p>This invitation was sent through Conference Hub</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            If you believe you received this email in error, please contact the organizer directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Meeting Invitation: ${meetingTitle}

    ${greeting}

    ${organizerName} has invited you to join the following meeting:

    Meeting: ${meetingTitle}
    Date: ${dateStr}
    Time: ${timeStr}
    Location: ${roomName}, ${facilityName}
    Organizer: ${organizerName} (${organizerEmail})
    ${meetingDescription ? `Description: ${meetingDescription}` : ''}

    Important: Please confirm your attendance by contacting the organizer directly.

    If you have any questions about this meeting, please contact ${organizerName} at ${organizerEmail}.

    We look forward to seeing you there!

    ---
    This invitation was sent through Conference Hub
  `;

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for meeting invitation');
  const result = await sendEmail(inviteeEmail, subject, html, text);
  console.log(`📧 [EMAIL DEBUG] sendEmail result for invitation: ${result}`);
  console.log('📧 ===== MEETING INVITATION EMAIL END =====');

  return result;
}

// Send booking confirmation email with ICS attachment
export async function sendBookingConfirmationEmailWithICS(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  description?: string,
  icsContent?: string
): Promise<boolean> {
  const subject = `Booking Approved: ${bookingTitle}`
  
  // Format dates
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .booking-details { background: #e8f5e9; border: 1px solid #4CAF50; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 12px; }
        .detail-label { font-weight: bold; min-width: 120px; color: #2E7D32; }
        .detail-value { color: #1f2937; }
        .success-note { background: #d4edda; border: 1px solid #4CAF50; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .calendar-note { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎉 Booking Approved!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your room reservation has been confirmed</p>
        </div>

        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>

          <div class="success-note">
            <p style="margin: 0;"><strong>✅ Great news!</strong> Your booking request has been approved and confirmed.</p>
          </div>

          <div class="booking-details">
            <h3 style="margin-top: 0; color: #2E7D32;">${bookingTitle}</h3>

            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${dateStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">🕒 Time:</span>
              <span class="detail-value">${timeStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${roomName}, ${facilityName}</span>
            </div>

            ${description ? `
            <div class="detail-row">
              <span class="detail-label">📝 Description:</span>
              <span class="detail-value">${description}</span>
            </div>` : ''}
          </div>

          ${icsContent ? `
          <div class="calendar-note">
            <p style="margin: 0;"><strong>📅 Calendar Integration:</strong> An invitation file has been attached to this email. Opening it will add this meeting to your calendar with automatic reminders.</p>
          </div>` : ''}

          <p>Your room is now reserved and ready for your meeting. Please arrive on time and ensure you have everything you need for a successful session.</p>

          <p>If you need to make any changes or have questions, please contact the facility manager.</p>

          <p>Thank you for using Conference Hub!</p>
        </div>

        <div class="footer">
          <p>This confirmation was sent through Conference Hub</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            Please save this email for your records.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Booking Approved: ${bookingTitle}

    Hello ${userName},

    Great news! Your booking request has been approved and confirmed.

    Booking Details:
    - Title: ${bookingTitle}
    - Date: ${dateStr}
    - Time: ${timeStr}
    - Location: ${roomName}, ${facilityName}
    ${description ? `- Description: ${description}` : ''}

    ${icsContent ? 'A calendar invitation file has been attached to this email. Opening it will add this meeting to your calendar with automatic reminders.' : ''}

    Your room is now reserved and ready for your meeting. Please arrive on time and ensure you have everything you need for a successful session.

    If you need to make any changes or have questions, please contact the facility manager.

    Thank you for using Conference Hub!

    ---
    This confirmation was sent through Conference Hub
  `

  // Prepare attachments
  const attachments: EmailAttachment[] = []
  if (icsContent) {
    attachments.push({
      filename: 'meeting-invitation.ics',
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    })
  }

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for booking confirmation with ICS')
  const result = await sendEmail(userEmail, subject, html, text, attachments)
  console.log(`📧 [EMAIL DEBUG] sendEmail result for confirmation: ${result}`)

  return result
}

// Send meeting invitation email with ICS attachment  
export async function sendMeetingInvitationEmailWithICS(
  inviteeEmail: string,
  inviteeName: string,
  organizerName: string,
  organizerEmail: string,
  meetingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  meetingDescription?: string,
  icsContent?: string
): Promise<boolean> {
  const subject = `Meeting Invitation: ${meetingTitle}`

  // Format dates
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`

  const greeting = inviteeName ? `Hello ${inviteeName}` : 'Hello'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .meeting-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 12px; }
        .detail-label { font-weight: bold; min-width: 120px; color: #374151; }
        .detail-value { color: #1f2937; }
        .invitation-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .calendar-note { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">Meeting Invitation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">You're invited to join a meeting</p>
        </div>

        <div class="content">
          <p>${greeting},</p>

          <p><strong>${organizerName}</strong> has invited you to join the following meeting:</p>

          <div class="meeting-details">
            <h3 style="margin-top: 0; color: #1e3a8a;">${meetingTitle}</h3>

            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${dateStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">🕒 Time:</span>
              <span class="detail-value">${timeStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${roomName}, ${facilityName}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">👤 Organizer:</span>
              <span class="detail-value">${organizerName} (${organizerEmail})</span>
            </div>

            ${meetingDescription ? `
            <div class="detail-row">
              <span class="detail-label">📝 Description:</span>
              <span class="detail-value">${meetingDescription}</span>
            </div>` : ''}
          </div>

          ${icsContent ? `
          <div class="calendar-note">
            <p style="margin: 0;"><strong>📅 Calendar Integration:</strong> An invitation file has been attached to this email. Opening it will add this meeting to your calendar with automatic reminders.</p>
          </div>` : ''}

          <div class="invitation-note">
            <p style="margin: 0;"><strong>📌 Important:</strong> Please confirm your attendance by contacting the organizer directly. This invitation is for informational purposes.</p>
          </div>

          <p>If you have any questions about this meeting, please contact <strong>${organizerName}</strong> at <a href="mailto:${organizerEmail}">${organizerEmail}</a>.</p>

          <p>We look forward to seeing you there!</p>
        </div>

        <div class="footer">
          <p>This invitation was sent through Conference Hub</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            If you believe you received this email in error, please contact the organizer directly.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Meeting Invitation: ${meetingTitle}

    ${greeting},

    ${organizerName} has invited you to join the following meeting:

    Meeting: ${meetingTitle}
    Date: ${dateStr}
    Time: ${timeStr}
    Location: ${roomName}, ${facilityName}
    Organizer: ${organizerName} (${organizerEmail})
    ${meetingDescription ? `Description: ${meetingDescription}` : ''}

    ${icsContent ? 'A calendar invitation file has been attached to this email. Opening it will add this meeting to your calendar with automatic reminders.' : ''}

    Important: Please confirm your attendance by contacting the organizer directly.

    If you have any questions about this meeting, please contact ${organizerName} at ${organizerEmail}.

    We look forward to seeing you there!

    ---
    This invitation was sent through Conference Hub
  `

  // Prepare attachments
  const attachments: EmailAttachment[] = []
  if (icsContent) {
    attachments.push({
      filename: 'meeting-invitation.ics',
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    })
  }

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for meeting invitation with ICS')
  const result = await sendEmail(inviteeEmail, subject, html, text, attachments)
  console.log(`📧 [EMAIL DEBUG] sendEmail result for invitation: ${result}`)

  return result
}

// Send booking cancellation email with ICS attachment
export async function sendBookingCancellationEmailWithICS(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  facilityName: string,
  startTime: string,
  endTime: string,
  cancellationReason?: string,
  icsContent?: string
): Promise<boolean> {
  const subject = `Booking Cancelled: ${bookingTitle}`
  
  // Format dates
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const timeStr = `${startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })} - ${endDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Cancelled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .booking-details { background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 12px; }
        .detail-label { font-weight: bold; min-width: 120px; color: #d32f2f; }
        .detail-value { color: #1f2937; }
        .cancel-note { background: #ffcdd2; border: 1px solid #f44336; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
        .calendar-note { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">❌ Booking Cancelled</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your room reservation has been cancelled</p>
        </div>

        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>

          <div class="cancel-note">
            <p style="margin: 0;"><strong>📋 Notice:</strong> Your booking has been cancelled and is no longer active.</p>
          </div>

          <div class="booking-details">
            <h3 style="margin-top: 0; color: #d32f2f;">${bookingTitle}</h3>

            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span class="detail-value">${dateStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">🕒 Time:</span>
              <span class="detail-value">${timeStr}</span>
            </div>

            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span class="detail-value">${roomName}, ${facilityName}</span>
            </div>

            ${cancellationReason ? `
            <div class="detail-row">
              <span class="detail-label">📝 Reason:</span>
              <span class="detail-value">${cancellationReason}</span>
            </div>` : ''}
          </div>

          ${icsContent ? `
          <div class="calendar-note">
            <p style="margin: 0;"><strong>📅 Calendar Update:</strong> A cancellation file has been attached to this email. Opening it will remove this meeting from your calendar.</p>
          </div>` : ''}

          <p>The room is now available for other bookings. If you need to make a new reservation, please visit the Conference Hub booking system.</p>

          <p>If you have any questions about this cancellation, please contact the facility manager.</p>

          <p>Thank you for using Conference Hub!</p>
        </div>

        <div class="footer">
          <p>This cancellation notice was sent through Conference Hub</p>
          <p style="margin: 5px 0 0 0; font-size: 12px;">
            Please save this email for your records.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Booking Cancelled: ${bookingTitle}

    Hello ${userName},

    Your booking has been cancelled and is no longer active.

    Cancelled Booking Details:
    - Title: ${bookingTitle}
    - Date: ${dateStr}
    - Time: ${timeStr}
    - Location: ${roomName}, ${facilityName}
    ${cancellationReason ? `- Reason: ${cancellationReason}` : ''}

    ${icsContent ? 'A cancellation file has been attached to this email. Opening it will remove this meeting from your calendar.' : ''}

    The room is now available for other bookings. If you need to make a new reservation, please visit the Conference Hub booking system.

    If you have any questions about this cancellation, please contact the facility manager.

    Thank you for using Conference Hub!

    ---
    This cancellation notice was sent through Conference Hub
  `

  // Prepare attachments
  const attachments: EmailAttachment[] = []
  if (icsContent) {
    attachments.push({
      filename: 'meeting-cancellation.ics',
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=CANCEL'
    })
  }

  console.log('📧 [EMAIL DEBUG] About to call sendEmail for booking cancellation with ICS')
  const result = await sendEmail(userEmail, subject, html, text, attachments)
  console.log(`📧 [EMAIL DEBUG] sendEmail result for cancellation: ${result}`)

  return result
}

// Check if email service is ready
export function isEmailReady(): boolean {
  return transporter !== null
}

// Ensure email service is ready (for deployment environments)
export async function ensureEmailReady(): Promise<boolean> {
  if (isEmailReady()) {
    return true
  }

  console.log('📧 Email service not ready, initializing...')
  return await initEmailService()
}

// Initialize email service when module loads (server-side only)
if (typeof window === 'undefined') {
  // Don't await here to avoid blocking module loading
  initEmailService().catch(error => {
    console.error('❌ Failed to initialize email service on module load:', error)
  })
}