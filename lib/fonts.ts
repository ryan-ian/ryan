import { Inter } from 'next/font/google'

/**
 * Font configuration with robust error handling and fallbacks
 * This configuration ensures the application builds successfully even if Google Fonts is unavailable
 */

// Primary font configuration with comprehensive fallbacks
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Open Sans',
    'Helvetica Neue',
    'sans-serif'
  ],
  adjustFontFallback: false, // Disable to prevent build issues
  preload: true,
  variable: '--font-inter',
  // Add weight specifications for better loading
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
})

/**
 * Font class names for use in components
 */
export const fontClassNames = {
  inter: inter.className,
  variable: inter.variable,
  sans: 'font-sans',
  interVariable: 'font-inter',
} as const

/**
 * CSS variables for font families
 */
export const fontVariables = {
  inter: 'var(--font-inter)',
  fallback: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
} as const

/**
 * Get font class with fallback
 * @param fontType - The font type to use
 * @returns CSS class string with fallbacks
 */
export function getFontClass(fontType: keyof typeof fontClassNames = 'inter'): string {
  try {
    return `${inter.variable} ${fontClassNames[fontType]}`
  } catch (error) {
    console.warn('Font loading failed, using system fallback:', error)
    return 'font-sans'
  }
}

/**
 * Get font family CSS value with fallbacks
 * @returns CSS font-family value
 */
export function getFontFamily(): string {
  return `${fontVariables.inter}, ${fontVariables.fallback}`
}

/**
 * Font loading error handler
 * This function can be used to handle font loading errors gracefully
 */
export function handleFontError(error: Error): void {
  console.warn('Font loading error:', error.message)
  console.info('Falling back to system fonts')
  
  // Add error reporting if needed
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // You can add error reporting service here
    console.info('Font fallback activated in production')
  }
}

/**
 * Check if fonts are loaded
 * @returns Promise that resolves when fonts are loaded or times out
 */
export async function waitForFonts(timeout: number = 3000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true // Server-side, assume fonts will load
  }

  try {
    // Use the Font Loading API if available
    if ('fonts' in document) {
      const fontPromise = document.fonts.ready
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), timeout)
      })
      
      const result = await Promise.race([
        fontPromise.then(() => true),
        timeoutPromise
      ])
      
      return result
    }
    
    // Fallback for browsers without Font Loading API
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 100) // Assume loaded after short delay
    })
  } catch (error) {
    handleFontError(error as Error)
    return false
  }
}

/**
 * Initialize font loading with error handling
 * Call this in your app initialization if needed
 */
export function initializeFonts(): void {
  if (typeof window === 'undefined') return

  // Set up font loading error handling
  window.addEventListener('error', (event) => {
    if (event.message?.includes('font') || event.filename?.includes('fonts.googleapis.com')) {
      handleFontError(new Error(`Font loading failed: ${event.message}`))
    }
  })

  // Check font loading status
  waitForFonts().then((loaded) => {
    if (!loaded) {
      console.info('Fonts did not load within timeout, using fallbacks')
    }
  })
}

export default inter
