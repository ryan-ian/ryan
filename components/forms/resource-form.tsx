"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Package, Tag, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { ResourceIcon } from "@/components/ui/resource-icon"
import { cn } from "@/lib/utils"
import type { Resource } from "@/types"

// Define the form schema with Zod
const resourceFormSchema = z.object({
  name: z.string().min(2, { message: "Resource name must be at least 2 characters." }),
  type: z.string().min(1, { message: "Please select a resource type." }),
  description: z.string().optional(),
  status: z.enum(["available", "in-use", "maintenance"]),
  facility_id: z.string().optional(),
})

type ResourceFormValues = z.infer<typeof resourceFormSchema>

export interface ResourceFormProps {
  initialData?: Partial<Resource>
  onSubmit: (data: ResourceFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  cancelHref?: string
  onCancel?: () => void
}

export function ResourceForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = "Save Resource",
  cancelHref,
  onCancel,
}: ResourceFormProps) {
  // Resource types
  const resourceTypes = [
    "projector",
    "whiteboard",
    "screen",
    "tv",
    "microphone",
    "speaker",
    "camera",
    "videoconference",
    "wifi",
    "phone",
    "table",
    "refreshment",
    "catering",
    "ac",
    "heating",
    "lighting",
    "power",
    "adapter",
    "computer",
    "printer",
    "scanner",
  ]

  // Define the form
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "",
      description: initialData?.description || "",
      status: (initialData?.status as "available" | "in-use" | "maintenance") || "available",
    },
  })

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        type: initialData.type || "",
        description: initialData.description || "",
        status: (initialData.status as "available" | "in-use" | "maintenance") || "available",
      })
    }
  }, [initialData, form])

  // Handle form submission
  const handleSubmit = async (values: ResourceFormValues) => {
    await onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resource Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" placeholder="HDMI Projector" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Select resource type" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            <div className="flex items-center">
                              <ResourceIcon type={type} name={type} size="sm" />
                              <span className="ml-2 capitalize">{type}</span>
                            </div>
                          </SelectItem>
                        ))}
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of the resource..." 
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
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
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