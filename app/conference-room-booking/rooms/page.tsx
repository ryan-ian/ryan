"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect from old rooms listing page to the main conference-room-booking page
export default function RoomsRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the main page
    router.replace('/conference-room-booking')
  }, [router])
  
  // Show a loading message while redirecting
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h2 className="text-lg font-medium">Redirecting...</h2>
        <p className="text-muted-foreground">Please wait</p>
      </div>
    </div>
  )
}
