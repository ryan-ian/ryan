'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFacilities } from '@/hooks/use-facilities';
import { apiClient, Facility, Room, Resource } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { FacilityForm } from '@/components/forms/facility-form';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  MapPin, 
  User, 
  Calendar, 
  ArrowLeft, 
  Pencil, 
  Users, 
  DoorClosed,
  Projector,
  Loader2,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

export default function FacilityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const facilityId = params.id as string;
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    fetchAvailableManagers, 
    availableManagers, 
    isLoadingManagers,
    updateFacility,
    deleteFacility,
    checkFacilityDependencies
  } = useFacilities();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  
  // Fetch facility details
  useEffect(() => {
    const fetchFacilityDetails = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch facility details
        const facilityResponse = await apiClient.getFacilityById(facilityId);
        
        if (facilityResponse.error) {
          setError(facilityResponse.error);
          return;
        }
        
        if (!facilityResponse.data) {
          setError('Facility not found');
          return;
        }
        
        setFacility(facilityResponse.data);
        
        // Fetch rooms for this facility
        const roomsResponse = await apiClient.getRooms({ 
          facility_id: facilityId,
          sortBy: 'name',
          sortOrder: 'asc'
        });
        
        if (!roomsResponse.error && roomsResponse.data) {
          setRooms(roomsResponse.data.rooms);
        }
        
        // Fetch resources for this facility
        const resourcesResponse = await apiClient.getResources({ 
          facility_id: facilityId,
          sortBy: 'name',
          sortOrder: 'asc'
        });
        
        if (!resourcesResponse.error && resourcesResponse.data) {
          setResources(resourcesResponse.data.resources);
        }
      } catch (err) {
        console.error('Error fetching facility details:', err);
        setError('Failed to load facility details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFacilityDetails();
  }, [facilityId]);
  
  // Handle edit facility
  const handleEditClick = () => {
    fetchAvailableManagers(facilityId);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSubmit = async (data: any) => {
    if (!facility) return;
    
    setIsSubmitting(true);
    
    const result = await updateFacility(facility.id, data);
    
    setIsSubmitting(false);
    
    if (result) {
      setFacility(result);
      toast({
        title: 'Facility updated',
        description: `${result.name} has been updated successfully.`,
      });
      setIsEditDialogOpen(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update facility. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle delete facility
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!facility) return;
    
    setIsSubmittingDelete(true);
    
    const result = await deleteFacility(facility.id);
    
    setIsSubmittingDelete(false);
    
    if (result) {
      toast({
        title: 'Facility deleted',
        description: `${facility.name} has been deleted successfully.`,
      });
      router.push('/admin/conference/facilities');
    } else {
      toast({
        title: 'Error',
        description: 'Failed to delete facility. Please try again.',
        variant: 'destructive',
      });
      setIsDeleteDialogOpen(false);
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/conference/facilities')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Facilities
          </Button>
        </div>
        
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push('/admin/conference/facilities')}
              variant="outline"
            >
              Return to Facilities
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (isLoading || !facility) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/conference/facilities')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Facilities
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid gap-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/conference/facilities')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <Building className="h-6 w-6 mr-2 text-primary" />
              {facility.name}
            </h1>
            <p className="text-muted-foreground">
              Facility Details and Management
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleEditClick}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Facility
          </Button>
          <Button variant="destructive" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="rooms">
            Rooms ({rooms.length})
          </TabsTrigger>
          <TabsTrigger value="resources">
            Resources ({resources.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
              <CardDescription>
                Basic information about this facility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                  <p className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-primary" />
                    {facility.name}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    {facility.location || 'No location specified'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Facility Manager</h3>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-primary" />
                    {facility.manager ? (
                      <div>
                        <p className="font-medium">{facility.manager.name}</p>
                        <p className="text-sm text-muted-foreground">{facility.manager.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No manager assigned</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {formatDate(facility.updated_at)}
                  </p>
                </div>
              </div>
              
              {facility.description && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                  <p>{facility.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <DoorClosed className="h-4 w-4 mr-2" />
                  Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{rooms.length}</div>
                <p className="text-sm text-muted-foreground">Total rooms in this facility</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-primary"
                  onClick={() => setActiveTab('rooms')}
                >
                  View all rooms
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Projector className="h-4 w-4 mr-2" />
                  Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{resources.length}</div>
                <p className="text-sm text-muted-foreground">Total resources in this facility</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-primary"
                  onClick={() => setActiveTab('resources')}
                >
                  View all resources
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Capacity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {rooms.reduce((sum, room) => sum + (room.capacity || 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total capacity across all rooms</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Rooms in {facility.name}</CardTitle>
              <CardDescription>
                All rooms associated with this facility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <DoorClosed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No rooms found</p>
                  <p className="text-muted-foreground">This facility doesn't have any rooms yet.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <DoorClosed className="h-4 w-4 mr-2 text-primary" />
                              {room.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                              {room.capacity || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                room.status === 'available' ? 'default' : 
                                room.status === 'maintenance' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {room.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {room.location || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resources in {facility.name}</CardTitle>
              <CardDescription>
                All resources associated with this facility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <div className="text-center py-8">
                  <Projector className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No resources found</p>
                  <p className="text-muted-foreground">This facility doesn't have any resources yet.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Projector className="h-4 w-4 mr-2 text-primary" />
                              {resource.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {resource.type || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                resource.status === 'available' ? 'default' : 
                                resource.status === 'maintenance' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {resource.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {resource.description || 'No description'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Facility Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Facility</DialogTitle>
            <DialogDescription>
              Update the facility details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <FacilityForm
            defaultValues={{
              id: facility.id,
              name: facility.name,
              location: facility.location || '',
              description: facility.description || '',
              manager_id: facility.manager_id || '',
            }}
            currentManagerId={facility.manager_id}
            availableManagers={availableManagers}
            onSubmit={handleEditSubmit}
            isSubmitting={isSubmitting}
            isLoadingManagers={isLoadingManagers}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Facility</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <span className="font-medium">{facility.name}</span>?
                This action cannot be undone.
              </p>
              
              <div className="border rounded-md p-4 bg-muted/50 space-y-2">
                <p className="font-medium">This facility has the following dependencies:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li className="flex items-center">
                    <DoorClosed className="h-4 w-4 mr-2" />
                    <span>{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span>
                  </li>
                  <li className="flex items-center">
                    <Projector className="h-4 w-4 mr-2" />
                    <span>{resources.length} {resources.length === 1 ? 'resource' : 'resources'}</span>
                  </li>
                </ul>
                {(rooms.length > 0 || resources.length > 0) && (
                  <p className="text-destructive font-medium">
                    Deleting this facility will affect all associated rooms and resources.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmittingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-destructive text-destructive-foreground"
              disabled={isSubmittingDelete}
            >
              {isSubmittingDelete ? (
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