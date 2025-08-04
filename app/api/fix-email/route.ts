import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfig, tryEmailConfigurations, detectEmailProvider, EMAIL_CONFIGS } from '@/lib/email-fallback'
import { initEmailService, sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, testEmail } = body

    if (action === 'diagnose') {
      return await diagnoseEmailIssue()
    } else if (action === 'test') {
      return await testCurrentConfig(testEmail)
    } else if (action === 'auto-fix') {
      return await autoFixConfiguration()
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Email fix error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function diagnoseEmailIssue() {
  const diagnosis = {
    env_variables: {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_PORT: !!process.env.SMTP_PORT,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_SECURE: process.env.SMTP_SECURE,
    },
    current_config: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || '587',
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER
    },
    provider_detection: null as any,
    suggestions: [] as string[]
  }

  // Detect provider
  if (process.env.SMTP_USER) {
    const provider = detectEmailProvider(process.env.SMTP_USER)
    if (provider) {
      diagnosis.provider_detection = {
        detected: provider,
        recommended_config: EMAIL_CONFIGS[provider]
      }
    }
  }

  // Generate suggestions
  if (!process.env.SMTP_HOST) {
    diagnosis.suggestions.push('SMTP_HOST is missing - set it to your email provider\'s SMTP server')
  }
  if (!process.env.SMTP_USER) {
    diagnosis.suggestions.push('SMTP_USER is missing - set it to your email address')
  }
  if (!process.env.SMTP_PASSWORD) {
    diagnosis.suggestions.push('SMTP_PASSWORD is missing - set it to your email password or app password')
  }

  // Provider-specific suggestions
  if (process.env.SMTP_HOST?.includes('gmail')) {
    diagnosis.suggestions.push('For Gmail: Use app-specific password, not regular password')
    diagnosis.suggestions.push('Enable 2-factor authentication and generate app password')
  }

  if (process.env.SMTP_PORT === '465' && process.env.SMTP_SECURE !== 'true') {
    diagnosis.suggestions.push('Port 465 requires SMTP_SECURE=true')
  }

  if (process.env.SMTP_PORT === '587' && process.env.SMTP_SECURE === 'true') {
    diagnosis.suggestions.push('Port 587 should use SMTP_SECURE=false')
  }

  return NextResponse.json({ diagnosis })
}

async function testCurrentConfig(testEmail: string) {
  console.log('🧪 Testing current email configuration...')
  
  const result = {
    initialization: false,
    connection: false,
    sending: false,
    errors: [] as string[]
  }

  try {
    // Test initialization
    result.initialization = await initEmailService()
    if (!result.initialization) {
      result.errors.push('Failed to initialize email service')
      return NextResponse.json({ result })
    }

    // Test connection (already done in initEmailService, but explicit here)
    result.connection = true

    // Test sending
    if (testEmail) {
      console.log(`📧 Testing email send to: ${testEmail}`)
      result.sending = await sendEmail(
        testEmail,
        'Test Email - Conference Hub',
        '<h2>Email Test Successful!</h2><p>Your email configuration is working correctly.</p>',
        'Email Test Successful! Your email configuration is working correctly.'
      )
      
      if (!result.sending) {
        result.errors.push('Failed to send test email')
      }
    }

  } catch (error) {
    result.errors.push(`Test error: ${error.message}`)
  }

  return NextResponse.json({ result })
}

async function autoFixConfiguration() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return NextResponse.json({ 
      error: 'Cannot auto-fix: SMTP_USER and SMTP_PASSWORD are required' 
    }, { status: 400 })
  }

  console.log('🔧 Attempting to auto-fix email configuration...')
  
  const fixResult = await tryEmailConfigurations(
    process.env.SMTP_USER,
    process.env.SMTP_PASSWORD
  )

  if (fixResult.config) {
    return NextResponse.json({
      success: true,
      recommended_config: {
        SMTP_HOST: fixResult.config.host,
        SMTP_PORT: fixResult.config.port.toString(),
        SMTP_SECURE: fixResult.config.secure.toString(),
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASSWORD: '[CURRENT_PASSWORD]'
      },
      message: 'Found working configuration! Update your environment variables with the recommended settings.'
    })
  } else {
    return NextResponse.json({
      success: false,
      error: fixResult.error,
      suggestions: [
        'Check your email credentials',
        'Ensure you\'re using app-specific passwords for Gmail',
        'Verify your email provider\'s SMTP settings',
        'Check if 2-factor authentication is properly configured'
      ]
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Fix Tool',
    actions: {
      diagnose: 'POST /api/fix-email with { "action": "diagnose" }',
      test: 'POST /api/fix-email with { "action": "test", "testEmail": "your@email.com" }',
      autoFix: 'POST /api/fix-email with { "action": "auto-fix" }'
    }
  })
}