"use client"

import { UserLayout } from "@/components/user-layout"

export default function ConferenceRoomBookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserLayout requireAuth={true}>
      {children}
    </UserLayout>
  )
}
