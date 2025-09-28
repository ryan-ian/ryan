import './globals.css'
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
// Email service will initialize automatically when needed

// Font configuration: Using system fonts for reliable builds
// Google Fonts can be re-enabled when network connectivity is stable

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
      <body className="font-sans antialiased">
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
