"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"

export default function ConferenceRoomBookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <Header />
      <main className="flex-1 container py-6">{children}</main>
    </ProtectedRoute>
  )
}
