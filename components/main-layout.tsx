"use client"

import React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

interface MainLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  fullWidth?: boolean
  className?: string
}

export function MainLayout({
  children,
  showFooter = true,
  fullWidth = false,
  className,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className={`flex-1 ${className || ""}`}>
        {fullWidth ? (
          children
        ) : (
          <div className="container mx-auto px-4 py-8 md:py-12">
            {children}
          </div>
        )}
      </main>
      
      {showFooter && <Footer />}
    </div>
  )
} 