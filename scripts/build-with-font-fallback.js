#!/usr/bin/env node

/**
 * Build script with font loading fallback
 * This script attempts to build the Next.js application with Google Fonts,
 * and falls back to local fonts if Google Fonts fails to load
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuration
const MAX_RETRIES = 3
const TIMEOUT_MS = 60000 // 60 seconds
const BACKUP_LAYOUT_PATH = path.join(__dirname, '..', 'app', 'layout-backup.tsx')
const LAYOUT_PATH = path.join(__dirname, '..', 'app', 'layout.tsx')

/**
 * Log with timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : '✅'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

/**
 * Create backup of current layout
 */
function createLayoutBackup() {
  try {
    if (fs.existsSync(LAYOUT_PATH)) {
      fs.copyFileSync(LAYOUT_PATH, BACKUP_LAYOUT_PATH)
      log('Created layout backup')
      return true
    }
  } catch (error) {
    log(`Failed to create layout backup: ${error.message}`, 'error')
    return false
  }
}

/**
 * Restore layout from backup
 */
function restoreLayoutBackup() {
  try {
    if (fs.existsSync(BACKUP_LAYOUT_PATH)) {
      fs.copyFileSync(BACKUP_LAYOUT_PATH, LAYOUT_PATH)
      fs.unlinkSync(BACKUP_LAYOUT_PATH)
      log('Restored layout from backup')
      return true
    }
  } catch (error) {
    log(`Failed to restore layout backup: ${error.message}`, 'error')
    return false
  }
}

/**
 * Create fallback layout without Google Fonts
 */
function createFallbackLayout() {
  const fallbackLayoutContent = `import './globals.css'
import type { Metadata } from 'next'
import { EnhancedThemeProvider } from '@/components/enhanced-theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { RoleThemeProvider } from '@/contexts/theme-context'
import { RealtimeProvider } from '@/contexts/realtime-context'
import { DisplaysStyleHandler } from '@/components/displays-style-handler'
import { MainWrapper } from '@/components/main-wrapper'
import { EventSystemProtector } from '@/components/ui/event-system-protector'
import { RealtimeNotifications } from '@/components/realtime-notifications'
import ReactQueryProvider from '@/lib/react-query-provider'

export const metadata: Metadata = {
  title: 'Conference Hub',
  description: 'Book conference rooms for your meetings',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <EnhancedThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <AuthProvider>
              <RealtimeProvider>
                <RoleThemeProvider>
                  <NotificationsProvider>
                    <EventSystemProtector />
                    <DisplaysStyleHandler />
                    <MainWrapper>
                      {children}
                    </MainWrapper>
                    <RealtimeNotifications />
                    <Toaster />
                  </NotificationsProvider>
                </RoleThemeProvider>
              </RealtimeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </EnhancedThemeProvider>
      </body>
    </html>
  )
}
`

  try {
    fs.writeFileSync(LAYOUT_PATH, fallbackLayoutContent)
    log('Created fallback layout without Google Fonts')
    return true
  } catch (error) {
    log(`Failed to create fallback layout: ${error.message}`, 'error')
    return false
  }
}

/**
 * Run build command with timeout
 */
function runBuild(usePackageManager = 'pnpm') {
  return new Promise((resolve, reject) => {
    log(`Starting build with ${usePackageManager}...`)
    
    const buildProcess = spawn(usePackageManager, ['run', 'build'], {
      stdio: 'inherit',
      shell: true
    })

    const timeout = setTimeout(() => {
      buildProcess.kill('SIGTERM')
      reject(new Error('Build timeout'))
    }, TIMEOUT_MS)

    buildProcess.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        log('Build completed successfully')
        resolve(true)
      } else {
        reject(new Error(`Build failed with exit code ${code}`))
      }
    })

    buildProcess.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}

/**
 * Main build function with retry logic
 */
async function buildWithFallback() {
  log('Starting Conference Hub build with font fallback...')
  
  // Create backup of current layout
  createLayoutBackup()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`Build attempt ${attempt}/${MAX_RETRIES}`)
      
      if (attempt === 1) {
        log('Attempting build with Google Fonts...')
      } else {
        log('Retrying build with Google Fonts...')
      }
      
      await runBuild()
      
      // Build succeeded
      log('Build completed successfully with Google Fonts!')
      
      // Clean up backup
      if (fs.existsSync(BACKUP_LAYOUT_PATH)) {
        fs.unlinkSync(BACKUP_LAYOUT_PATH)
      }
      
      process.exit(0)
      
    } catch (error) {
      log(`Build attempt ${attempt} failed: ${error.message}`, 'error')
      
      if (attempt === MAX_RETRIES) {
        log('All attempts with Google Fonts failed, trying fallback...', 'warn')
        
        // Try with fallback layout
        try {
          createFallbackLayout()
          await runBuild()
          
          log('Build completed successfully with fallback fonts!', 'warn')
          log('Note: Application is using system fonts instead of Google Fonts', 'warn')
          
          // Restore original layout for future builds
          restoreLayoutBackup()
          
          process.exit(0)
          
        } catch (fallbackError) {
          log(`Fallback build also failed: ${fallbackError.message}`, 'error')
          
          // Restore original layout
          restoreLayoutBackup()
          
          log('All build attempts failed. Please check your network connection and try again.', 'error')
          process.exit(1)
        }
      } else {
        // Wait before retry
        log(`Waiting 5 seconds before retry...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Build interrupted, cleaning up...', 'warn')
  restoreLayoutBackup()
  process.exit(1)
})

process.on('SIGTERM', () => {
  log('Build terminated, cleaning up...', 'warn')
  restoreLayoutBackup()
  process.exit(1)
})

// Run the build
buildWithFallback().catch((error) => {
  log(`Unexpected error: ${error.message}`, 'error')
  restoreLayoutBackup()
  process.exit(1)
})
