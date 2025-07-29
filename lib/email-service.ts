// import nodemailer from 'nodemailer';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Email transporter configuration
let transporter: nodemailer.Transporter;
let isEmailServiceReady = false;

/**
 * Test the email connection
 */
async function testEmailConnection(): Promise<boolean> {
  if (!transporter) {
    console.error('❌ Cannot test email connection - transporter not initialized');
    return false;
  }

  try {
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection test successful');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection test failed:', error);
    return false;
  }
}

/**
 * Initialize the email service with configuration
 * Should be called during app startup
 */
export async function initEmailService(): Promise<boolean> {
  console.log('🚀 ===== EMAIL SERVICE INITIALIZATION =====');
  console.log('📧 SMTP Configuration:');
  console.log('  - Host:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  - Port:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  - Secure:', process.env.SMTP_SECURE || 'NOT SET');
  console.log('  - User:', process.env.SMTP_USER || 'NOT SET');
  console.log('  - From Name:', process.env.EMAIL_FROM_NAME || 'NOT SET');
  console.log('  - From Address:', process.env.EMAIL_FROM_ADDRESS || 'NOT SET');
  console.log('  - Password:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
  
  // Check if all required environment variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM_NAME', 'EMAIL_FROM_ADDRESS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ MISSING EMAIL CONFIGURATION VARIABLES:', missingVars);
    console.error('❌ Email service will not work without these variables!');
    isEmailServiceReady = false;
    return false;
  }
  
  try {
    // Create a transporter object using SMTP transport
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    console.log('📧 Transporter created, testing connection...');
    
    // Test the connection
    const connectionSuccess = await testEmailConnection();
    isEmailServiceReady = connectionSuccess;
    
    if (connectionSuccess) {
      console.log('✅ Email service initialized and tested successfully');
    } else {
      console.error('❌ Email service initialized but connection test failed');
    }
    
    console.log('🚀 ===== EMAIL SERVICE INITIALIZATION END =====');
    return connectionSuccess;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    isEmailServiceReady = false;
    return false;
  }
}

/**
 * Check if email service is ready
 */
export function isEmailReady(): boolean {
  return isEmailServiceReady && !!transporter;
}

/**
 * Send an email
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML content of the email
 * @param text Plain text content of the email (fallback)
 * @returns Promise resolving to the send result
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    console.log('📧 ===== EMAIL SEND PROCESS START =====');
    console.log(`📧 RECIPIENT EMAIL ADDRESS: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 HTML length: ${html.length} characters`);
    console.log(`📧 Text length: ${text.length} characters`);
    console.log(`📧 Email service ready: ${isEmailServiceReady}`);
    
    if (!transporter) {
      console.error('❌ Email service not initialized - transporter is null');
      console.error('❌ Check if initEmailService() was called and environment variables are set');
      
      // Try to initialize the email service
      console.log('🔄 Attempting to initialize email service...');
      const initResult = await initEmailService();
      if (!initResult) {
        console.error('❌ Failed to initialize email service');
        return false;
      }
    }
    
    if (!isEmailServiceReady) {
      console.error('❌ Email service is not ready - connection test failed');
      return false;
    }
    
    // Validate email address
    if (!to || !to.includes('@')) {
      console.error('❌ Invalid email address:', to);
      return false;
    }
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: to,
      subject: subject,
      html: html,
      text: text,
    };
    
    console.log('📧 Mail options:');
    console.log('  - From:', mailOptions.from);
    console.log('  - To:', mailOptions.to);
    console.log('  - Subject:', mailOptions.subject);

    console.log('📧 Attempting to send email via SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('  - Message ID:', info.messageId);
    console.log('  - Response:', info.response);
    console.log('📧 ===== EMAIL SEND PROCESS END =====');
    return true;
  } catch (error) {
    console.error('❌ ===== EMAIL SEND ERROR =====');
    console.error('❌ Error sending email:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ ===== EMAIL SEND ERROR END =====');
    return false;
  }
}

/**
 * Send a booking confirmation email
 * @param userEmail User's email address
 * @param userName User's name
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param startTime Start time of the booking
 * @param endTime End time of the booking
 * @returns Promise resolving to the send result
 */
export async function sendBookingConfirmationEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING CONFIRMATION EMAIL START =====');
  console.log(`📧 USER EMAIL ADDRESS: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Start Time: ${startTime}`);
  console.log(`📧 End Time: ${endTime}`);
  
  // Validate email address
  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    console.log('📧 ===== BOOKING CONFIRMATION EMAIL END (INVALID EMAIL) =====');
    return false;
  }
  
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');
  
  const subject = `Booking Confirmed: ${bookingTitle}`;
 
  console.log(`📧 Formatted Date: ${formattedDate}`);
  console.log(`📧 Formatted Time: ${formattedStartTime} - ${formattedEndTime}`);
  console.log(`📧 Email Subject: ${subject}`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">Booking Confirmed</h2>
      <p>Hello ${userName},</p>
      <p>Your booking has been confirmed:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedStartTime} - ${formattedEndTime}</p>
      </div>
      
      <p>You can view or manage your booking through the Conference Hub application.</p>
      <p>Thank you for using Conference Hub!</p>
    </div>
  `;
  
  const text = `
    Booking Confirmed
    
    Hello ${userName},
    
    Your booking has been confirmed:
    
    Title: ${bookingTitle}
    Room: ${roomName}
    Date: ${formattedDate}
    Time: ${formattedStartTime} - ${formattedEndTime}
    
    You can view or manage your booking through the Conference Hub application.
    
    Thank you for using Conference Hub!
  `;
  
  console.log('📧 Calling sendEmail function...');
  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING CONFIRMATION EMAIL END =====');
  return result;
}

/**
 * Send a booking rejection email
 * @param userEmail User's email address
 * @param userName User's name
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param reason Optional reason for rejection
 * @returns Promise resolving to the send result
 */
export async function sendBookingRejectionEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  reason?: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING REJECTION EMAIL START =====');
  console.log(`📧 USER EMAIL ADDRESS: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Rejection Reason: ${reason || 'No reason provided'}`);
  
  // Validate email address
  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    console.log('📧 ===== BOOKING REJECTION EMAIL END (INVALID EMAIL) =====');
    return false;
  }
  
  // Validate email address
  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    console.log('📧 ===== BOOKING REJECTION EMAIL END (INVALID EMAIL) =====');
    return false;
  }
  
  const subject = `Booking Rejected: ${bookingTitle}`;
  console.log(`📧 Email Subject: ${subject}`);
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #F44336;">Booking Rejected</h2>
      <p>Hello ${userName},</p>
      <p>Unfortunately, your booking request has been rejected:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      
      <p>If you have any questions, please contact your facility manager.</p>
      <p>Thank you for using Conference Hub!</p>
    </div>
  `;
  
  const text = `
    Booking Rejected
    
    Hello ${userName},
    
    Unfortunately, your booking request has been rejected:
    
    Title: ${bookingTitle}
    Room: ${roomName}
    ${reason ? `Reason: ${reason}` : ''}
    
    If you have any questions, please contact your facility manager.
    
    Thank you for using Conference Hub!
  `;
  
  console.log('📧 Calling sendEmail function...');
  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING REJECTION EMAIL END =====');
  return result;
}

/**
 * Send a booking reminder email
 * @param userEmail User's email address
 * @param userName User's name
 * @param bookingTitle Title of the booking
 * @param roomName Name of the room
 * @param startTime Start time of the booking
 * @returns Promise resolving to the send result
 */
export async function sendBookingReminderEmail(
  userEmail: string,
  userName: string,
  bookingTitle: string,
  roomName: string,
  startTime: string
): Promise<boolean> {
  console.log('📧 ===== BOOKING REMINDER EMAIL START =====');
  console.log(`📧 USER EMAIL ADDRESS: ${userEmail}`);
  console.log(`📧 User Name: ${userName}`);
  console.log(`📧 Booking Title: ${bookingTitle}`);
  console.log(`📧 Room Name: ${roomName}`);
  console.log(`📧 Start Time: ${startTime}`);
  
  // Validate email address
  if (!userEmail || !userEmail.includes('@')) {
    console.error('❌ Invalid user email address:', userEmail);
    console.log('📧 ===== BOOKING REMINDER EMAIL END (INVALID EMAIL) =====');
    return false;
  }
  
  const startDate = new Date(startTime);
  
  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(startDate, 'h:mm a');
  
  const subject = `Reminder: ${bookingTitle} starts soon`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2196F3;">Meeting Reminder</h2>
      <p>Hello ${userName},</p>
      <p>This is a reminder about your upcoming meeting:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Title:</strong> ${bookingTitle}</p>
        <p><strong>Room:</strong> ${roomName}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>
      
      <p>We look forward to seeing you there!</p>
      <p>Thank you for using Conference Hub!</p>
    </div>
  `;
  
  const text = `
    Meeting Reminder
    
    Hello ${userName},
    
    This is a reminder about your upcoming meeting:
    
    Title: ${bookingTitle}
    Room: ${roomName}
    Date: ${formattedDate}
    Time: ${formattedTime}
    
    We look forward to seeing you there!
    
    Thank you for using Conference Hub!
  `;
  
  console.log('📧 Calling sendEmail function...');
  const result = await sendEmail(userEmail, subject, html, text);
  console.log(`📧 sendEmail result: ${result}`);
  console.log('📧 ===== BOOKING REMINDER EMAIL END =====');
  return result;
} 