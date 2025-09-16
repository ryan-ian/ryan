"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Building, MapPin, Users, Tag, Info, Package, Image as ImageIcon, Loader2, DollarSign } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ImageUpload } from "@/components/ui/image-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { cn, validatePricing, formatCurrency } from "@/lib/utils"
import type { Room, Resource } from "@/types"

const roomFormSchema = z.object({
  name: z.string().min(2, { message: "Room name must be at least 2 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  capacity: z.coerce.number().int().positive({ message: "Capacity must be a positive number." }),
  status: z.enum(["available", "maintenance", "reserved"]),
  description: z.string().optional(),
  resources: z.array(z.string()).optional(),
  image_url: z.string().optional(),
  // Pricing fields
  hourly_rate: z.coerce.number().min(0, { message: "Hourly rate must be positive." }).max(10000, { message: "Hourly rate cannot exceed ₵10,000/hr." }),
  currency: z.string().default("GHS"),
})

type RoomFormValues = z.infer<typeof roomFormSchema>

export interface RoomFormProps {
  initialData?: Partial<Room>
  resources: Resource[]
  onSubmit: (data: RoomFormValues) => void
  onCancel: () => void
  isLoading?: boolean
}

export function RoomForm({ initialData, resources, onSubmit, onCancel, isLoading = false }: RoomFormProps) {
  const [isUploading, setIsUploading] = useState(false)
  
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      location: initialData?.location || "",
      capacity: initialData?.capacity || 1,
      status: initialData?.status || "available",
      description: initialData?.description || "",
      resources: initialData?.room_resources || [],
      image_url: initialData?.image || "",
      // Pricing defaults
      hourly_rate: initialData?.hourly_rate || 0,
      currency: initialData?.currency || "GHS",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] p-4 border rounded-md">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="e.g., Conference Room A" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-10" placeholder="e.g., 1st Floor" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" min={1} className="pl-10" placeholder="e.g., 10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select status" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Info className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea className="pl-10" placeholder="A brief description of the room..." {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Image</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {field.value && <img src={field.value} alt="Room" className="w-20 h-20 rounded-md object-cover"/>}
                      <ImageUpload
                        endpoint="roomImageUploader"
                        onChange={(url) => { field.onChange(url); setIsUploading(false); }}
                        onUploadBegin={() => setIsUploading(true)}
                      />
                      {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing Section */}
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="text-base font-semibold">Pricing Information</FormLabel>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">₵</span>
                          <Input 
                            type="number" 
                            step="0.01"
                            min={0}
                            max={10000}
                            className="pl-8" 
                            placeholder="0.00" 
                            {...field} 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">/hr</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GHS">Ghana Cedi (₵)</SelectItem>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              
              {/* Pricing Preview */}
              {(() => {
                const hourlyRate = Number(form.watch("hourly_rate")) || 0;
                
                return hourlyRate > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-md">
                    <p className="text-sm font-medium text-primary">
                      Pricing Preview: {formatCurrency(hourlyRate)} per hour
                    </p>
                  </div>
                );
              })()}
            </div>

            <div>
              <FormLabel>Resources</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 p-4 border rounded-md">
                {resources.map((resource) => (
                  <FormField
                    key={resource.id}
                    control={form.control}
                    name="resources"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={resource.id}
                          className="flex flex-row items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox 
                              checked={field.value?.includes(resource.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), resource.id])
                                  : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== resource.id
                                    )
                                  )
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-2">
                            <ResourceIcon type={resource.type} name={resource.name} />
                            {resource.name}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Saving..." : "Save Room"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 