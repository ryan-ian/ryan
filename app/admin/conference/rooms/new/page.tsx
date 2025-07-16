"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { Resource } from "@/types"
import { RoomForm } from "@/components/forms/room-form"

export default function NewRoomPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)

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
      } finally {
        setIsLoadingResources(false)
      }
    }
    
    fetchResources()
  }, [toast])

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create room")
      }
      
      toast({
        title: "Room Created",
        description: `${formData.name} has been created successfully.`
      })
      
      router.push("/admin/conference/rooms")
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create room. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/admin/conference/rooms">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Rooms
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Room</h2>
          <p className="text-muted-foreground">Create a new conference room</p>
        </div>
      </div>
      
      {isLoadingResources ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      ) : (
        <RoomForm
          resources={resources}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel="Create Room"
          cancelHref="/admin/conference/rooms"
        />
      )}
    </div>
  )
} 