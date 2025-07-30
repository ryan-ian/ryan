import { NextRequest, NextResponse } from "next/server"
import { sendEmail, sendBookingConfirmationEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, testType } = body
    
    if (!to) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }
    
    console.log(`🧪 [TEST EMAIL] Testing email send to: ${to}, type: ${testType || 'basic'}`)
    
    let result = false
    
    if (testType === 'booking-confirmation') {
      // Test booking confirmation email
      console.log(`🧪 [TEST EMAIL] Sending booking confirmation test email`)
      result = await sendBookingConfirmationEmail(
        to,
        "Test User",
        "Test Meeting - Booking Confirmation",
        "Conference Room A",
        new Date().toISOString(),
        new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      )
    } else {
      // Basic test email
      console.log(`🧪 [TEST EMAIL] Sending basic test email`)
      const subject = "Test Email from Conference Hub"
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Test Email</h2>
          <p>This is a test email to verify that the email service is working correctly.</p>
          <p>If you receive this email, the configuration is working!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
      const text = "This is a test email to verify that the email service is working correctly. If you receive this email, the configuration is working!"
      
      result = await sendEmail(to, subject, html, text)
    }
    
    console.log(`🧪 [TEST EMAIL] Result: ${result}`)
    
    return NextResponse.json({ 
      success: result,
      message: result ? "Test email sent successfully" : "Failed to send test email",
      testType: testType || 'basic'
    })
  } catch (error) {
    console.error("❌ [TEST EMAIL] Error:", error)
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email test endpoint. Use POST with { to, testType } to test email sending.",
    testTypes: [
      "basic - Simple test email",
      "booking-confirmation - Test booking confirmation email template"
    ],
    environmentVariables: {
      SMTP_HOST: process.env.SMTP_HOST ? "✓ Set" : "✗ Missing",
      SMTP_PORT: process.env.SMTP_PORT ? "✓ Set" : "✗ Missing", 
      SMTP_USER: process.env.SMTP_USER ? "✓ Set" : "✗ Missing",
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "✓ Set" : "✗ Missing",
      EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS ? "✓ Set" : "✗ Missing",
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME ? "✓ Set" : "✗ Missing",
    }
  })
} 