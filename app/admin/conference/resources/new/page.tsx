"use client"

import { useState } from "react"
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

export default function NewResourcePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Omit<Resource, "id">>({
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create resource")
      }
      
      toast({
        title: "Resource Created",
        description: `${formData.name} has been created successfully.`
      })
      
      router.push("/admin/conference/resources")
    } catch (error) {
      console.error("Error creating resource:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create resource. Please try again.",
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
          <Link href="/admin/conference/resources">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Resources
          </Link>
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Resource</h2>
          <p className="text-muted-foreground">Create a new conference room resource</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
          <CardDescription>Enter information for the new resource</CardDescription>
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
              <Button variant="outline" type="button" onClick={() => router.push("/admin/conference/resources")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Resource
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 