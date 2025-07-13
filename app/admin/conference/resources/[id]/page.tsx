"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import type { Resource } from "@/types"
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

export default function ResourceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [resource, setResource] = useState<Resource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        
        const resourceData = await response.json()
        setResource(resourceData)
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "in-use":
        return "secondary"
      case "maintenance":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resource) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/resources?id=${resource.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete resource")
      }

      toast({
        title: "Resource Deleted",
        description: `${resource.name} has been deleted successfully.`,
      })
      
      router.push("/admin/conference/resources")
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete resource. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
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

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Resource not found</p>
        <Button variant="link" asChild className="mt-4">
          <Link href="/admin/conference/resources">Back to Resources</Link>
        </Button>
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
          <h2 className="text-3xl font-bold tracking-tight">{resource.name}</h2>
          <div className="flex items-center text-muted-foreground">
            <Badge variant="outline" className="mr-2">{resource.type}</Badge>
          </div>
        </div>
        <Badge variant={getStatusBadgeVariant(resource.status)} className="text-sm">
          {resource.status}
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{resource.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{resource.type}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusBadgeVariant(resource.status)}>
                {resource.status}
              </Badge>
            </div>
          </div>
          
          {resource.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{resource.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage this resource</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link href={`/admin/conference/resources/${resource.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Resource
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Resource
          </Button>
        </CardContent>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource
              {resource.name && ` "${resource.name}"`} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 