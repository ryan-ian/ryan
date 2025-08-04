"use client"

import { useState, useEffect } from "react"
import { Building, PlusCircle, Pencil } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { getFacilitiesByManager, updateFacility, createFacility } from "@/lib/supabase-data"
import type { Facility } from "@/types"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"

// Simple facility form component
function FacilityForm({ facility, onSubmit, onCancel, isCreate = false }: { 
  facility?: Facility | null, 
  onSubmit: (data: any) => Promise<void>, 
  onCancel: () => void,
  isCreate?: boolean
}) {
  const [formData, setFormData] = useState({
    name: facility?.name || "",
    location: facility?.location || "",
    description: facility?.description || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Facility Name</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium">Location</label>
        <input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded-md h-24 resize-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isCreate ? "Creating..." : "Saving...") : (isCreate ? "Create Facility" : "Save Changes")}
        </Button>
      </div>
    </form>
  )
}

export default function FacilityManagementPage() {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadFacilities() {
      if (!user) return

      try {
        setIsLoading(true)
        const facilitiesData = await getFacilitiesByManager(user.id)
        setFacilities(facilitiesData)
        
        // If there's a facility, pre-select it for editing
        if (facilitiesData.length > 0) {
          setSelectedFacility(facilitiesData[0])
        }
      } catch (err) {
        console.error("Failed to load facilities", err)
        setError("Failed to load facilities.")
      } finally {
        setIsLoading(false)
      }
    }
    loadFacilities()
  }, [user])

  const handleEdit = (facility: Facility) => {
    setSelectedFacility(facility)
    setIsCreateMode(false)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedFacility(null)
    setIsCreateMode(true)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setIsCreateMode(false)
    setSelectedFacility(null)
  }

  const handleFormSubmit = async (formData: any) => {
    if (!user) return
    
    try {
      if (isCreateMode) {
        // Create new facility with current user as manager
        const facilityInput = {
          name: formData.name,
          location: formData.location || "",
          description: formData.description || "",
          manager_id: user.id
        }
        
        const newFacility = await createFacility(facilityInput)
        
        // Update the facilities state
        setFacilities([newFacility])
        
        toast({
          title: "Facility Created",
          description: "Your facility has been created successfully.",
        })
      } else {
        if (!selectedFacility) return
        
        const updatedFacility = await updateFacility(selectedFacility.id, formData)
        
        // Update the facilities state
        setFacilities(facilities.map(facility => 
          facility.id === updatedFacility.id ? updatedFacility : facility
        ))
        
        toast({
          title: "Facility Updated",
          description: "The facility has been updated successfully.",
        })
      }
      
      handleFormClose()
    } catch (err) {
      console.error("Failed to process facility", err)
      toast({
        title: "Error",
        description: `Failed to ${isCreateMode ? 'create' : 'update'} facility. Please try again.`,
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <FacilityManagerSkeleton />
  if (error) return <div>{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Facility Management</h1>
      </div>

      {facilities.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Facility Assigned</h3>
          <p className="text-muted-foreground mb-4">
            You are not currently managing any facility. You can create a new facility to get started.
          </p>
          <Button onClick={handleCreate} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create New Facility
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1">
          {facilities.map((facility) => (
            <Card key={facility.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {facility.name}
                    </CardTitle>
                    <CardDescription>{facility.location}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(facility)}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit Facility
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {facility.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCreateMode ? "Create New Facility" : "Edit Facility"}</DialogTitle>
          </DialogHeader>
          <FacilityForm
            facility={selectedFacility}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isCreate={isCreateMode}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
