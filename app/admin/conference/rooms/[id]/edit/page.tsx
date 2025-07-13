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
import { Building, Plus, X, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import type { Room, Resource } from "@/types"

export default function EditRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<Room>({
    id: params.id,
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

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/rooms?id=${params.id}`)
        
        if (!response.ok) {
          throw new Error("Room not found")
        }
        
        const room = await response.json()
        setFormData({
          ...room,
          image: room.image || "",
          resources: room.resources || []
        })
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
  }, [params.id, router, toast])

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
    setFormData(prev => ({ ...prev, status: value }))
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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update room")
      }
      
      toast({
        title: "Room Updated",
        description: `${formData.name} has been updated successfully.`
      })
      
      router.push("/admin/conference/rooms")
    } catch (error) {
      console.error("Error updating room:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update room. Please try again.",
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
        <p className="text-muted-foreground">Loading room details...</p>
      </div>
    )
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
          <h2 className="text-3xl font-bold tracking-tight">Edit Room</h2>
          <p className="text-muted-foreground">Update conference room details</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Room Details</CardTitle>
          <CardDescription>Update the information for this conference room</CardDescription>
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
                  {formData.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="rounded-full hover:bg-muted p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {formData.features.length === 0 && (
                    <span className="text-sm text-muted-foreground">No features added</span>
                  )}
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
            </div>
            
            <div className="space-y-2">
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
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/conference/rooms">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Building className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Building className="mr-2 h-4 w-4" />
                    Update Room
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 