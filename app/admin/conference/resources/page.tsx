"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Package, Wrench, CheckCircle, Loader2, ArrowUpDown, Filter, Eye } from "lucide-react"
import Link from "next/link"
import type { Resource } from "@/types"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { useToast } from "@/components/ui/use-toast"

export default function ResourceManagement() {
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch("/api/resources", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        })
        const data = await response.json()
        setResources(data)
        setFilteredResources(data)
      } catch (error) {
        console.error("Failed to fetch resources:", error)
        toast({
          title: "Error",
          description: "Failed to fetch resources. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [toast])

  useEffect(() => {
    const filtered = resources.filter(
      (resource) =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.status.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredResources(filtered)
  }, [searchTerm, resources])

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <CheckCircle className="h-3 w-3" />
      case "in-use":
        return <Package className="h-3 w-3" />
      case "maintenance":
        return <Wrench className="h-3 w-3" />
      default:
        return null
    }
  }
  
  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/resources?id=${resourceToDelete.id}`, {
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
        description: `${resourceToDelete.name} has been deleted successfully.`,
      })
      
      // Refresh the resources list
      const updatedResources = resources.filter(r => r.id !== resourceToDelete.id);
      setResources(updatedResources);
      setFilteredResources(updatedResources);
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
      setResourceToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded-lg w-64 animate-pulse" />
            <div className="h-4 bg-muted rounded-lg w-48 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-muted rounded-md animate-pulse" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 bg-primary/10 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-12 animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="h-12 bg-muted rounded-lg w-full animate-pulse" />
        <div className="h-[400px] bg-muted rounded-lg w-full animate-pulse" />
      </div>
    )
  }

  const availableResources = resources.filter((r) => r.status === "available")
  const inUseResources = resources.filter((r) => r.status === "in-use")
  const maintenanceResources = resources.filter((r) => r.status === "maintenance")

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Resource Management</h2>
          <p className="text-muted-foreground">Manage conference room resources and equipment</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/conference/resources/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Resource
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="overflow-hidden bg-white dark:bg-slate-950">
          <div className="h-1.5 bg-blue-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Available resources</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white dark:bg-slate-950">
          <div className="h-1.5 bg-green-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableResources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for use</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white dark:bg-slate-950">
          <div className="h-1.5 bg-purple-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Use</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseResources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently allocated</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white dark:bg-slate-950">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceResources.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Under maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-slate-950 border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Resources</CardTitle>
              <CardDescription>Manage all conference room resources and equipment</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResources.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Resources Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No resources match your search criteria. Try adjusting your search."
                  : "No resources have been added yet. Create your first resource to get started."}
              </p>
              <Button asChild>
                <Link href="/admin/conference/resources/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Resource
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[250px]">Resource</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                              <ResourceIcon type={resource.type} className="h-4 w-4" />
                            </div>
                            {resource.name}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{resource.type}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(resource.status)} className="flex w-fit items-center gap-1">
                            {getStatusIcon(resource.status)}
                            <span className="capitalize">{resource.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {resource.description ? (
                            <span className="line-clamp-1">{resource.description}</span>
                          ) : (
                            <span className="text-muted-foreground/60 italic">No description</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link href={`/admin/conference/resources/${resource.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                              <Link href={`/admin/conference/resources/${resource.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => handleDeleteClick(resource)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this resource?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resource and remove it from any rooms it's assigned to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Resource"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
