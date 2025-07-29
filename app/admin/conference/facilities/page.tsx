'use client';

import { useState, useEffect } from 'react';
import { useFacilities } from '@/hooks/use-facilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FacilityForm } from '@/components/forms/facility-form';
import { Facility, FacilityCreateRequest, FacilityUpdateRequest } from '@/lib/api-client';
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Building, 
  Search, 
  ArrowUpDown,
  Loader2,
  MapPin,
  User,
  Calendar,
  Info,
  DoorClosed,
  Projector
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Pagination } from '@/components/ui/pagination';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function FacilitiesPage() {
  const {
    facilities,
    totalCount,
    isLoading,
    error,
    page,
    pageSize,
    searchQuery,
    sortField,
    sortOrder,
    setPage,
    setPageSize,
    setSearchQuery,
    setSortField,
    setSortOrder,
    fetchFacilities,
    createFacility,
    updateFacility,
    deleteFacility,
    checkFacilityDependencies,
    availableManagers,
    fetchAvailableManagers,
    isLoadingManagers,
  } = useFacilities();

  const router = useRouter();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dependencies, setDependencies] = useState<{ rooms: number, resources: number } | null>(null);
  const [isCheckingDependencies, setIsCheckingDependencies] = useState(false);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFacilities();
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Update facilities when sort changes
  useEffect(() => {
    fetchFacilities();
  }, [sortField, sortOrder]);

  // Handle create facility
  const handleCreateClick = () => {
    fetchAvailableManagers();
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async (data: FacilityCreateRequest) => {
    setIsSubmitting(true);
    
    const result = await createFacility(data);
    
    setIsSubmitting(false);
    
    if (result) {
      toast({
        title: 'Facility created',
        description: `${data.name} has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      fetchFacilities();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create facility. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle edit facility
  const handleEditClick = (facility: Facility) => {
    setSelectedFacility(facility);
    fetchAvailableManagers(facility.id);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: FacilityUpdateRequest) => {
    if (!selectedFacility) return;
    
    setIsSubmitting(true);
    
    const result = await updateFacility(selectedFacility.id, data);
    
    setIsSubmitting(false);
    
    if (result) {
      toast({
        title: 'Facility updated',
        description: `${data.name || selectedFacility.name} has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
      fetchFacilities();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update facility. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete facility
  const handleDeleteClick = async (facility: Facility) => {
    setSelectedFacility(facility);
    setIsCheckingDependencies(true);
    
    const deps = await checkFacilityDependencies(facility.id);
    
    setDependencies(deps);
    setIsCheckingDependencies(false);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFacility) return;
    
    setIsSubmitting(true);
    
    const result = await deleteFacility(selectedFacility.id);
    
    setIsSubmitting(false);
    
    if (result) {
      toast({
        title: 'Facility deleted',
        description: `${selectedFacility.name} has been deleted successfully.`,
      });
      setIsDeleteDialogOpen(false);
      fetchFacilities();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete facility. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facility Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage facilities and assign facility managers
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" /> Add Facility
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Facilities</CardTitle>
          <CardDescription>
            {totalCount} total {totalCount === 1 ? 'facility' : 'facilities'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, location, or description..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4">
              Error: {error}
            </div>
          )}

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('location')}>
                    <div className="flex items-center">
                      Location
                      {sortField === 'location' && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('manager_id')}>
                    <div className="flex items-center">
                      Manager
                      {sortField === 'manager_id' && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('updated_at')}>
                    <div className="flex items-center">
                      Last Updated
                      {sortField === 'updated_at' && (
                        <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                        <p>Loading facilities...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : facilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center">
                        <Building className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-lg font-medium">No facilities found</p>
                        <p className="text-muted-foreground">
                          {searchQuery
                            ? 'No facilities match your search criteria'
                            : 'Click "Add Facility" to create your first facility'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  facilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-primary" />
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-medium"
                            onClick={() => router.push(`/admin/conference/facilities/${facility.id}`)}
                          >
                            {facility.name}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {facility.location ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            {facility.location}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No location specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {facility.manager ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center">
                                  <Badge variant="outline" className="flex items-center gap-1 hover:bg-secondary">
                                    <User className="h-3 w-3" />
                                    {facility.manager.name}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{facility.manager.email}</p>
                                <p className="text-xs text-muted-foreground">{facility.manager.role}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                {formatDate(facility.updated_at)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Created: {new Date(facility.created_at).toLocaleDateString()}</p>
                              <p>Updated: {new Date(facility.updated_at).toLocaleDateString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => router.push(`/admin/conference/facilities/${facility.id}`)}
                            >
                              <Info className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditClick(facility)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(facility)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, totalCount)} of {totalCount} facilities
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardFooter>
        )}
      </Card>

      {/* Create Facility Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Facility</DialogTitle>
            <DialogDescription>
              Add a new facility to the system. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <FacilityForm
            availableManagers={availableManagers}
            onSubmit={handleCreateSubmit}
            isSubmitting={isSubmitting}
            isLoadingManagers={isLoadingManagers}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Facility Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Facility</DialogTitle>
            <DialogDescription>
              Update the facility details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedFacility && (
            <FacilityForm
              defaultValues={{
                id: selectedFacility.id,
                name: selectedFacility.name,
                location: selectedFacility.location || '',
                description: selectedFacility.description || '',
                manager_id: selectedFacility.manager_id || '',
              }}
              currentManagerId={selectedFacility.manager_id}
              availableManagers={availableManagers}
              onSubmit={handleEditSubmit}
              isSubmitting={isSubmitting}
              isLoadingManagers={isLoadingManagers}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete the facility
                {selectedFacility ? ` "${selectedFacility.name}"` : ''} and cannot be
                undone.
              </p>
              
              {isCheckingDependencies ? (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking dependencies...</span>
                </div>
              ) : dependencies ? (
                <div className="border rounded-md p-4 bg-muted/50 space-y-2">
                  <p className="font-medium">This facility has the following dependencies:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li className="flex items-center">
                      <DoorClosed className="h-4 w-4 mr-2" />
                      <span>{dependencies.rooms} {dependencies.rooms === 1 ? 'room' : 'rooms'}</span>
                    </li>
                    <li className="flex items-center">
                      <Projector className="h-4 w-4 mr-2" />
                      <span>{dependencies.resources} {dependencies.resources === 1 ? 'resource' : 'resources'}</span>
                    </li>
                  </ul>
                  {(dependencies.rooms > 0 || dependencies.resources > 0) && (
                    <p className="text-destructive font-medium">
                      Deleting this facility will affect all associated rooms and resources.
                    </p>
                  )}
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting || isCheckingDependencies}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmitting || isCheckingDependencies}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 