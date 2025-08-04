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
    if (error.code === 'ECONNREFUSED') {
      console.error('🔧 TROUBLESHOOTING: Connection refused - Check your SMTP_HOST and SMTP_PORT')
    } else if (error.code === 'ENOTFOUND') {
      console.error('🔧 TROUBLESHOOTING: Host not found - Check your SMTP_HOST')
    } else if (error.responseCode === 421) {
      console.error('🔧 TROUBLESHOOTING: Service not available - Try different port or check with email provider')
    } else if (error.code === 'EAUTH') {
      console.error('🔧 TROUBLESHOOTING: Authentication failed - Check your SMTP_USER and SMTP_PASSWORD')
    }
    
    transporter = null
    return false
  }
}

// Send basic email
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    console.log(`📧 ===== SEND EMAIL START =====`)
    console.log(`📧 To: ${to}`)
    console.log(`📧 Subject: ${subject}`)
    
    if (!transporter) {
      console.log('📧 Transporter not initialized, initializing now...')
      const initResult = await initEmailService()
      
      if (!initResult || !transporter) {
        console.error('❌ Failed to initialize email transporter')
        return false
      }
    }

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Conference Hub'} <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
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

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');

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
      <p>If you need to make any changes or cancel this booking, please contact your facility manager as soon as possible.</p>
      <p>Thank you for using Conference Hub!</p>
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
    
    Your room is now reserved for the specified time. Please arrive on time and ensure you have everything needed for your meeting.
    If you need to make any changes or cancel this booking, please contact your facility manager as soon as possible.
    Thank you for using Conference Hub!
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
  rejectionReason: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING REJECTION EMAIL START =====');
  console.log(`📧 User Email: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Rejection Reason: ${rejectionReason}`);

  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    return false;
  }

  const subject = `Booking Request Update: ${bookingTitle}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f44336;">Booking Request Update</h2>
      <p>Hello ${userName},</p>
      <p>We regret to inform you that your booking request could not be approved at this time.</p>
      <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Status:</strong> <span style="color: #f44336; font-weight: bold;">❌ Not Approved</span></p>
        <p><strong>Reason:</strong> ${rejectionReason}</p>
      </div>
      <p>Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.</p>
      <p>Thank you for your understanding.</p>
    </div>
  `;

  const text = `
    Booking Request Update
    Hello ${userName},
    We regret to inform you that your booking request could not be approved at this time.
    
    Title: ${bookingTitle}
    Room: ${roomName}
    Status: ❌ Not Approved
    Reason: ${rejectionReason}
    
    Please feel free to submit a new booking request for a different time or room, or contact your facility manager for assistance in finding an alternative solution.
    Thank you for your understanding.
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