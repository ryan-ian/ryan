"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { slugify } from "@/lib/utils"

// This page will redirect to the new URL structure
export default function RedirectToNewRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  
  useEffect(() => {
    const fetchRoomName = async () => {
      try {
        // Fetch the room data to get its name
        const response = await fetch(`/api/rooms?id=${roomId}`)
        
        if (!response.ok) {
          // If room not found, redirect to main rooms page
          router.push('/conference-room-booking')
          return
        }
        
        const room = await response.json()
        const slug = slugify(room.name)
        
        // Redirect to the new URL structure
        router.replace(`/conference-room-booking/${slug}?id=${roomId}`)
      } catch (error) {
        console.error("Error redirecting:", error)
        // On error, redirect to main rooms page
        router.push('/conference-room-booking')
      }
    }
    
    fetchRoomName()
  }, [roomId, router])
  
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
