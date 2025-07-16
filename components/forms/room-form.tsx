"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Building, MapPin, Users, Ruler, Image as ImageIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Room, Resource } from "@/types"

// Define the form schema with Zod
const roomFormSchema = z.object({
  name: z.string().min(2, { message: "Room name must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  capacity: z.coerce.number().int().positive({ message: "Capacity must be a positive number." }),
  description: z.string().optional(),
  status: z.enum(["available", "occupied", "maintenance"]),
  image: z.string().optional(),
  resources: z.array(z.string()).optional(),
})

type RoomFormValues = z.infer<typeof roomFormSchema>

export interface RoomFormProps {
  initialData?: Partial<Room>
  resources?: Resource[]
  onSubmit: (data: RoomFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  cancelHref?: string
  onCancel?: () => void
}

export function RoomForm({
  initialData,
  resources = [],
  onSubmit,
  isLoading = false,
  submitLabel = "Save Room",
  cancelHref,
  onCancel,
}: RoomFormProps) {
  const [imageUploading, setImageUploading] = useState(false)
  // Use room_resources if available, otherwise fall back to resources
  const initialResources = initialData?.room_resources || initialData?.resources || []
  const [selectedResources, setSelectedResources] = useState<string[]>(initialResources)

  // Define the form
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      location: initialData?.location || "",
      capacity: initialData?.capacity || 0,
      description: initialData?.description || "",
      status: (initialData?.status as "available" | "occupied" | "maintenance") || "available",
      image: initialData?.image || "",
      resources: initialResources,
    },
  })

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      // Use room_resources if available, otherwise fall back to resources
      const resources = initialData.room_resources || initialData.resources || []
      
      form.reset({
        name: initialData.name || "",
        location: initialData.location || "",
        capacity: initialData.capacity || 0,
        description: initialData.description || "",
        status: (initialData.status as "available" | "occupied" | "maintenance") || "available",
        image: initialData.image || "",
        resources: resources,
      })
      setSelectedResources(resources)
    }
  }, [initialData, form])

  // Update form resources field when selectedResources changes
  useEffect(() => {
    form.setValue("resources", selectedResources);
  }, [selectedResources, form]);

  // Handle form submission
  const handleSubmit = async (values: RoomFormValues) => {
    await onSubmit(values)
  }

  // Handle resource selection
  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources((current) => {
      if (current.includes(resourceId)) {
        return current.filter(id => id !== resourceId)
      } else {
        return [...current, resourceId]
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Conference Room A" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="Floor 2, East Wing" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="pl-10" 
                          type="number" 
                          min={1} 
                          placeholder="10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of the room..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {field.value && (
                        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
                          <img 
                            src={field.value} 
                            alt="Room preview" 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-full max-w-md">
                          <ImageUpload
                            endpoint="roomImageUploader"
                            onChange={(url) => {
                              field.onChange(url)
                              setImageUploading(false)
                            }}
                            onUploadBegin={() => setImageUploading(true)}
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                              "cursor-pointer"
                            )}
                          />
                        </div>
                        {imageUploading && (
                          <div className="flex items-center mt-2 sm:mt-0">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Uploading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload an image of the room. Recommended size: 1280x720px.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Room Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-md border p-3",
                      selectedResources.includes(resource.id) 
                        ? "bg-primary/5 border-primary/30" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox 
                      checked={selectedResources.includes(resource.id)}
                      onCheckedChange={(checked) => {
                        if (checked !== "indeterminate") {
                          if (checked) {
                            setSelectedResources(prev => [...prev, resource.id]);
                          } else {
                            setSelectedResources(prev => prev.filter(id => id !== resource.id));
                          }
                        }
                      }}
                      id={`resource-${resource.id}`}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <label
                        htmlFor={`resource-${resource.id}`}
                        className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                      >
                        <ResourceIcon type={resource.type} name={resource.name} size="sm" />
                        {resource.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {resource.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <CardFooter className="flex justify-between px-0">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          ) : cancelHref ? (
            <Button type="button" variant="outline" asChild>
              <a href={cancelHref}>Cancel</a>
            </Button>
          ) : (
            <div></div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Form>
  )
} 