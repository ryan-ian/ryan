import nodemailer from 'nodemailer'

// Fallback email configurations for common providers
export const EMAIL_CONFIGS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requiresAppPassword: true,
    instructions: 'Use app-specific password, not regular password'
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    requiresAppPassword: false,
    instructions: 'Use regular password'
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    requiresAppPassword: true,
    instructions: 'Use app-specific password'
  },
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    user: 'apikey',
    instructions: 'Use "apikey" as username and API key as password'
  }
}

// Test email configuration without sending
export async function testEmailConfig(config: any): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔍 Testing email configuration...')
    console.log(`   Host: ${config.host}`)
    console.log(`   Port: ${config.port}`)
    console.log(`   Secure: ${config.secure}`)
    console.log(`   User: ${config.auth?.user}`)

    const transporter = nodemailer.createTransporter({
      ...config,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })

    await transporter.verify()
    console.log('✅ Configuration test successful')
    return { success: true }
  } catch (error) {
    console.error('❌ Configuration test failed:', error)
    return { success: false, error: error.message }
  }
}

// Auto-detect email provider and suggest configuration
export function detectEmailProvider(email: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  
  if (domain?.includes('gmail')) {
    return 'gmail'
  } else if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
    return 'outlook'
  } else if (domain?.includes('yahoo')) {
    return 'yahoo'
  }
  
  return null
}

// Get suggested configuration for email
export function getSuggestedConfig(email: string) {
  const provider = detectEmailProvider(email)
  return provider ? EMAIL_CONFIGS[provider] : null
}

// Try multiple configurations
export async function tryEmailConfigurations(user: string, password: string): Promise<{ config?: any; error?: string }> {
  const provider = detectEmailProvider(user)
  
  if (provider) {
    console.log(`🔄 Trying configuration for detected provider: ${provider}`)
    const config = {
      ...EMAIL_CONFIGS[provider],
      auth: { user, pass: password }
    }
    
    const result = await testEmailConfig(config)
    if (result.success) {
      return { config }
    }
  }

  // Try common configurations
  const commonConfigs = [
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass: password }
    },
    {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: password }
    },
    {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: { user, pass: password }
    }
  ]

  for (const config of commonConfigs) {
    console.log(`🔄 Trying configuration: ${config.host}:${config.port}`)
    const result = await testEmailConfig(config)
    if (result.success) {
      return { config }
    }
  }

  return { error: 'No working configuration found' }
}