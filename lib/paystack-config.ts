// Paystack Configuration for Conference Hub
// This file contains all Paystack-related configuration and constants

// Environment variables validation
const requiredEnvVars = {
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
} as const

// Validate environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.warn(`⚠️ Missing environment variable: ${key}`)
  }
}

// Paystack Configuration Object
export const PAYSTACK_CONFIG = {
  // API Keys
  PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || '',
  
  // API URLs
  BASE_URL: 'https://api.paystack.co',
  INITIALIZE_URL: 'https://api.paystack.co/transaction/initialize',
  VERIFY_URL: 'https://api.paystack.co/transaction/verify',
  
  // Paystack Inline Script URL
  INLINE_SCRIPT_URL: 'https://js.paystack.co/v1/inline.js',
  
  // Payment Configuration
  CURRENCY: 'GHS',
  TIMEOUT_MINUTES: 15,
  MIN_AMOUNT: 5.00, // Minimum amount in GHS
  MAX_AMOUNT: 5000.00, // Maximum amount in GHS
  
  // Supported Payment Channels
  CHANNELS: {
    MOBILE_MONEY: 'mobile_money',
    CARD: 'card',
    USSD: 'ussd',
    BANK_TRANSFER: 'bank_transfer',
  },
  
  // Payment Status
  STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    ABANDONED: 'abandoned',
    CANCELLED: 'cancelled',
  },
  
  // Callback URLs
  CALLBACK_URL: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`
    : 'http://localhost:3000/payment/callback',
} as const

// Currency conversion utilities
export function convertToKobo(amount: number): number {
  // Convert GHS to pesewas (GHS * 100)
  return Math.round(amount * 100)
}

export function convertFromKobo(amount: number): number {
  // Convert pesewas to GHS (pesewas / 100)
  return amount / 100
}

// Validation functions
export function isValidAmount(amount: number): boolean {
  return amount >= PAYSTACK_CONFIG.MIN_AMOUNT && amount <= PAYSTACK_CONFIG.MAX_AMOUNT
}

export function isValidCurrency(currency: string): boolean {
  return currency === PAYSTACK_CONFIG.CURRENCY
}

// Payment reference validation
export function isValidPaymentReference(reference: string): boolean {
  // Conference Hub payment references follow pattern: CHB_timestamp_random
  const pattern = /^CHB_\d+_[A-Z0-9]{6}$/
  return pattern.test(reference)
}

// Environment check
export function isPaystackConfigured(): boolean {
  return !!(
    PAYSTACK_CONFIG.PUBLIC_KEY && 
    PAYSTACK_CONFIG.SECRET_KEY
  )
}

// Development mode check
export function isTestMode(): boolean {
  return PAYSTACK_CONFIG.PUBLIC_KEY.startsWith('pk_test_') || 
         PAYSTACK_CONFIG.SECRET_KEY.startsWith('sk_test_')
}

// Paystack script loading utility
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Paystack is already loaded
    if (typeof window !== 'undefined' && window.PaystackPop) {
      console.log("✅ Paystack already loaded")
      resolve()
      return
    }

    console.log("📜 Loading Paystack script from CDN...")

    // Create script element
    const script = document.createElement('script')
    script.src = PAYSTACK_CONFIG.INLINE_SCRIPT_URL
    script.async = true
    
    script.onload = () => {
      console.log("✅ Paystack script loaded successfully")
      // Double check that PaystackPop is available
      if (window.PaystackPop) {
        resolve()
      } else {
        console.error("❌ Paystack script loaded but PaystackPop not available")
        reject(new Error('Paystack script loaded but PaystackPop not available'))
      }
    }
    
    script.onerror = (error) => {
      console.error("❌ Failed to load Paystack script:", error)
      reject(new Error('Failed to load Paystack script'))
    }
    
    document.head.appendChild(script)
  })
}

// Global type declaration for PaystackPop
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        currency: string
        ref: string
        callback: (response: any) => void
        onClose: () => void
        metadata?: any
        channels?: string[]
      }) => {
        openIframe: () => void
      }
    }
  }
}

// Export configuration for use in other files
export default PAYSTACK_CONFIG
