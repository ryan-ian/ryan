import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationsProvider } from '@/contexts/notifications-context'
import { DisplaysStyleHandler } from '@/components/displays-style-handler'
import { MainWrapper } from '@/components/main-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Conference Room Booking',
  description: 'Book conference rooms for your meetings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <NotificationsProvider>
              <DisplaysStyleHandler />
              <MainWrapper>
                {children}
              </MainWrapper>
              <Toaster />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
