import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to } = body
    
    if (!to) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }
    
    console.log(`Testing email send to: ${to}`)
    
    const subject = "Test Email from Conference Hub"
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Test Email</h2>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p>If you receive this email, the configuration is working!</p>
      </div>
    `
    const text = "This is a test email to verify that the email service is working correctly. If you receive this email, the configuration is working!"
    
    const result = await sendEmail(to, subject, html, text)
    
    return NextResponse.json({ 
      success: result,
      message: result ? "Test email sent successfully" : "Failed to send test email"
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    )
  }
} 