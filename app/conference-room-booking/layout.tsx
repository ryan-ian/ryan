"use client"

import { UnifiedLayout } from "@/components/unified-layout"

export default function ConferenceRoomBookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UnifiedLayout requireAuth={true}>
      {children}
    </UnifiedLayout>
  )
}
