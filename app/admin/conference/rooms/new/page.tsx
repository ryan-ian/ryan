"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, X, ArrowLeft, Loader2, CheckSquare, Square } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import type { Room, Resource } from "@/types"

export default function NewRoomPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Omit<Room, "id">>({
    name: "",
    location: "",
    capacity: 0,
    features: [],
    status: "available",
    description: "",
    image: null,
    resources: []
  })
  const [newFeature, setNewFeature] = useState("")
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value as "available" | "maintenance" | "reserved" }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }))
  }

  const handleResourceChange = (resourceId: string, checked: boolean) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          resources: [...(prev.resources || []), resourceId]
        }
      } else {
        return {
          ...prev,
          resources: (prev.resources || []).filter(id => id !== resourceId)
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.location || formData.capacity <= 0) {
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
      
      <Card>
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
          <CardDescription>Enter information for the new conference room</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Room Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Executive Meeting Room"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Floor 3, East Wing"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity <span className="text-destructive">*</span></Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="12"
                  value={formData.capacity || ""}
                  onChange={handleNumberChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image URL (Optional)</Label>
                <Input
                  id="image"
                  name="image"
                  placeholder="https://example.com/room-image.jpg"
                  value={formData.image || ""}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="features">Features</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newFeature"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add feature (e.g., Projector)"
                  />
                  <Button type="button" onClick={addFeature} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="resources">Available Resources</Label>
                {isLoadingResources ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading resources...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border rounded-md p-4">
                    {resources.length > 0 ? (
                      resources.map((resource) => (
                        <div key={resource.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`resource-${resource.id}`}
                            checked={formData.resources?.includes(resource.id)}
                            onCheckedChange={(checked) => handleResourceChange(resource.id, !!checked)}
                          />
                          <label 
                            htmlFor={`resource-${resource.id}`} 
                            className="text-sm flex items-center cursor-pointer"
                          >
                            {resource.name} 
                            <Badge variant="outline" className="ml-2 text-xs">
                              {resource.type}
                            </Badge>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No resources available</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a description of the room..."
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/conference/rooms")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Room
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 