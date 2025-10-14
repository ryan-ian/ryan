"use client"

import { useState, useEffect } from "react"
import { Package, PlusCircle, AlertCircle, Building, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ResourceForm } from "@/components/forms/resource-form"
import { ResourceCard } from "@/components/cards/resource-card"
import { getResourcesByFacility, createResource, updateResource, deleteResource, getFacilitiesByManager, getRoomsWithResource } from "@/lib/supabase-data"
import type { Resource, Room } from "@/types"
import { useToast } from "@/components/ui/use-toast"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"

export default function ResourceManagementPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [resources, setResources] = useState<Resource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [facilityId, setFacilityId] = useState<string | null>(null)
  const [roomsForResource, setRoomsForResource] = useState<Room[]>([])
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const loadFacilityAndResources = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const facilities = await getFacilitiesByManager(user.id)
      
      if (facilities.length > 0) {
        const currentFacilityId = facilities[0].id
        setFacilityId(currentFacilityId)
        const resourcesData = await getResourcesByFacility(currentFacilityId)
        setResources(resourcesData)
      } else {
        setError("no_facility")
      }
    } catch (err) {
      console.error("Failed to load resources", err)
      setError("Failed to load resources.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFacilityAndResources()
  }, [user])

  const handleViewDetails = async (resource: Resource) => {
    setSelectedResource(resource)
    try {
      const rooms = await getRoomsWithResource(resource.id)
      setRoomsForResource(rooms)
      setIsDetailsModalOpen(true)
    } catch (err) {
      console.error("Failed to fetch rooms for resource", err)
      toast({ title: "Error", description: "Could not fetch room details.", variant: "destructive" })
    }
  }

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    if (!facilityId) {
      toast({
        title: "Cannot Add Resource",
        description: "You must be assigned to a facility to add a new resource.",
        variant: "destructive"
      })
      return
    }
    setSelectedResource(null)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setSelectedResource(null)
  }

  const handleFormSubmit = async (formData: any) => {
    if (!facilityId) return
    
    setIsSubmitting(true)
    const resourceData = { ...formData, facility_id: facilityId }
    
    try {
      if (selectedResource) {
        await updateResource(selectedResource.id, resourceData)
        toast({ title: "Success", description: "Resource updated successfully." })
      } else {
        await createResource(resourceData)
        toast({ title: "Success", description: "Resource created successfully." })
      }
      loadFacilityAndResources()
      handleFormClose()
    } catch (err) {
      console.error("Failed to save resource", err)
      toast({ title: "Error", description: "Failed to save the resource.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (resource: Resource) => {
    setSelectedResource(resource);
    setIsDeleteDialogOpen(true);
  }

  const handleDelete = async () => {
    if (!selectedResource) return;
    
    setIsSubmitting(true)
    try {
      await deleteResource(selectedResource.id)
      toast({ title: "Success", description: "Resource deleted successfully." })
      loadFacilityAndResources()
      setIsDeleteDialogOpen(false)
      setSelectedResource(null)
    } catch (err) {
      console.error("Failed to delete resource", err)
      toast({ 
        title: "Error Deleting Resource", 
        description: "Failed to delete resource. Make sure it's not assigned to any rooms or used in bookings.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <FacilityManagerSkeleton />
  if (error) {
    if (error === "no_facility") {
      return (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-1">No Facility Assigned</h3>
          <p className="text-muted-foreground mb-4">
            You need to create a facility before you can manage resources.
          </p>
          <Link href="/facility-manager/facilities">
            <Button className="gap-2">
              <Building className="h-4 w-4" />
              Create Facility
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
    
    return (
      <div className="text-center py-10 text-destructive flex flex-col items-center gap-4">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Resource Management</h1>
        <Button 
          onClick={handleAddNew}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px] active:scale-[0.98] transition-all duration-150"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
        </Button>
      </div>

      {resources.length > 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              variant="dashboard"
              onView={() => handleViewDetails(resource)}
              onEdit={() => handleEdit(resource)}
              onDelete={() => openDeleteDialog(resource)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Resources Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new resource to your facility.</p>
        </div>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          </DialogHeader>
          <ResourceForm 
            initialData={selectedResource || {}}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      
      {/* View Details Dialog */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resource Details: {selectedResource?.name}</DialogTitle>
          </DialogHeader>
          <div>
            <h3 className="font-semibold mb-2">Assigned to Rooms:</h3>
            {roomsForResource.length > 0 ? (
              <ul className="space-y-2">
                {roomsForResource.map(room => (
                  <li key={room.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{room.name} ({room.location})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">This resource is not currently assigned to any rooms.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the <strong>{selectedResource?.name}</strong> resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
