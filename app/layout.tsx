import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { setupStorage } from "@/lib/setup-storage"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Conference Hub - Room Booking System",
  description: "Professional conference room booking and management system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize storage bucket on app load
  if (typeof window !== 'undefined') {
    setupStorage().catch(console.error)
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
