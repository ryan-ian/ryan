"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { Resource } from "@/types"

export default function EditResourcePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<Resource>({
    id: params.id,
    name: "",
    type: "",
    status: "available",
    description: ""
  })

  const resourceTypes = [
    "Projector",
    "Whiteboard",
    "Laptop",
    "Microphone",
    "Speaker",
    "Camera",
    "Display Screen",
    "Videoconference System",
    "Other"
  ]

  useEffect(() => {
    const fetchResource = async () => {
      try {
        const token = localStorage.getItem("auth-token")
        const response = await fetch(`/api/resources?id=${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!response.ok) {
          throw new Error("Resource not found")
        }
        
        const resource = await response.json()
        setFormData({
          ...resource,
          description: resource.description || ""
        })
      } catch (error) {
        console.error("Failed to fetch resource:", error)
        toast({
          title: "Error",
          description: "Failed to load resource data. Please try again.",
          variant: "destructive"
        })
        router.push("/admin/conference/resources")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchResource()
  }, [params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as "available" | "in-use" | "maintenance" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/resources", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update resource")
      }
      
      toast({
        title: "Resource Updated",
        description: `${formData.name} has been updated successfully.`
      })
      
      router.push("/admin/conference/resources")
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update resource. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading resource details...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="mr-2" asChild>
          <Link href="/admin/conference/resources">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Resources
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Resource</h2>
          <p className="text-muted-foreground">Update resource details</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
          <CardDescription>Update the information for this resource</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Resource Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="4K Projector"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Resource Type <span className="text-destructive">*</span></Label>
                <Select value={formData.type} onValueChange={handleTypeChange} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in-use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a description of the resource..."
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => router.push(`/admin/conference/resources/${params.id}`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Resource
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 