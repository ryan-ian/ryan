import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { EnhancedThemeProvider } from '@/components/enhanced-theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { RoleThemeProvider } from '@/contexts/theme-context'
import { DisplaysStyleHandler } from '@/components/displays-style-handler'
import { MainWrapper } from '@/components/main-wrapper'
import { EventSystemProtector } from '@/components/ui/event-system-protector'
import ReactQueryProvider from '@/lib/react-query-provider'
// Email service will initialize automatically when needed

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <EnhancedThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQueryProvider>
            <AuthProvider>
              <RoleThemeProvider>
                <NotificationsProvider>
                  <EventSystemProtector />
                  <DisplaysStyleHandler />
                  <MainWrapper>
                    {children}
                  </MainWrapper>
                  <Toaster />
                </NotificationsProvider>
              </RoleThemeProvider>
            </AuthProvider>
          </ReactQueryProvider>
        </EnhancedThemeProvider>
      </body>
    </html>
  )
}
