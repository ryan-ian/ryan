"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { Room, Resource } from "@/types"
import { RoomForm } from "@/components/forms/room-form"
import { LoadingAnimation } from "@/components/ui/loading-animation"
import { StatusAnimation } from "@/components/ui/status-animation"
import { PageHeader } from "@/components/ui/page-transition"

export default function EditRoomPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const roomId = unwrappedParams.id;
  
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [room, setRoom] = useState<Room | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning" | "info" | null;
    message: string;
  }>({ type: null, message: "" })

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms?id=${roomId}`)
        
        if (!response.ok) {
          throw new Error("Room not found")
        }
        
        const roomData = await response.json()
        setRoom(roomData)
      } catch (error) {
        console.error("Failed to fetch room:", error)
        toast({
          title: "Error",
          description: "Failed to load room data. Please try again.",
          variant: "destructive"
        })
        router.push("/admin/conference/rooms")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRoom()
  }, [roomId, router, toast])

  // Fetch available resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = localStorage.getItem("auth-token")
        const response = await fetch("/api/resources", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error("Failed to fetch resources")
        }
        
        const data = await response.json()
        setResources(data)
      } catch (error) {
        console.error("Error fetching resources:", error)
        toast({
          title: "Error",
          description: "Failed to load resources. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    fetchResources()
  }, [toast])

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    setStatus({ type: null, message: "" })
    
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/rooms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          id: roomId
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update room")
      }
      
      setStatus({
        type: "success",
        message: `${formData.name} has been updated successfully.`
      })
      
      // Delay redirect to show success message
      setTimeout(() => {
        router.push("/admin/conference/rooms")
      }, 1500)
    } catch (error) {
      console.error("Error updating room:", error)
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update room. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingAnimation 
          variant="spinner" 
          size="lg"
          text="Loading room details..." 
        />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2 hover-lift" asChild>
          <Link href={`/admin/conference/rooms/${roomId}`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Room Details
          </Link>
        </Button>
      </div>
      
      <PageHeader
        heading="Edit Room"
        text="Update the information for this conference room"
      />
      
      {status.type && (
        <StatusAnimation
          status={status.type}
          message={status.message}
          autoHide={status.type === "success"}
          className="animate-slideInFromBottom"
        />
      )}
      
      <RoomForm
        initialData={room}
        resources={resources}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        submitLabel="Update Room"
        cancelHref={`/admin/conference/rooms/${roomId}`}
      />
    </div>
  )
} 