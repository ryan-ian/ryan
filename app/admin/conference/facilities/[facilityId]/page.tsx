'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  MapPin, 
  User, 
  Calendar, 
  ArrowLeft, 
  Pencil, 
  Users, 
  DoorClosed,
  Activity,
  BarChart3,
  Settings,
  Download,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { Facility, Room, User as UserType } from '@/types';

// Import data functions
import {
  getRoomsByFacilityId
} from '@/lib/supabase-data';

// Import additional admin facility data functions
import {
  getFacilityBookingStats,
  getFacilityRecentActivity
} from '@/lib/admin-facility-data';

interface FacilityStats {
  totalBookings: number;
  currentMonthBookings: number;
  activeBookings: number;
  totalRooms: number;
  utilizationRate: number;
  popularTimes: Array<{ hour: number; count: number }>;
}

interface ActivityLog {
  id: string;
  type: 'booking_created' | 'booking_cancelled' | 'room_added' | 'room_updated' | 'manager_changed';
  title: string;
  description: string;
  timestamp: string;
  user?: { name: string; email: string };
}

export default function AdminFacilityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const facilityId = params.facilityId as string;

  // State
  const [facility, setFacility] = useState<Facility | null>(null);
  const [manager, setManager] = useState<UserType | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<FacilityStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load facility data
  useEffect(() => {
    if (facilityId) {
      loadFacilityData();
    }
  }, [facilityId]);

  const loadFacilityData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load facility details from API
      const response = await fetch(`/api/facilities/${facilityId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Facility not found');
          return;
        }
        throw new Error('Failed to fetch facility data');
      }

      const data = await response.json();
      setFacility(data.facility);
      setRooms(data.rooms || []);
      setStats(data.stats);
      setRecentActivity(data.recentActivity || []);

      // Set manager if available
      if (data.facility.facility_manager) {
        setManager(data.facility.facility_manager);
      }

      // Load booking trends data
      loadBookingTrends();

    } catch (err) {
      console.error('Error loading facility data:', err);
      setError('Failed to load facility details. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load facility details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingTrends = async () => {
    try {
      const response = await fetch(`/api/facilities/${facilityId}/booking-trends`);
      if (response.ok) {
        const data = await response.json();
        setBookingTrends(data.trends || []);
      }
    } catch (error) {
      console.error('Error loading booking trends:', error);
      // Don't fail the whole page if trends can't be loaded
    }
  };

  const handleBackToFacilities = () => {
    router.push('/admin/conference/facilities');
  };

  const handleEditFacility = () => {
    // TODO: Implement edit facility modal
    toast({
      title: 'Coming Soon',
      description: 'Edit facility functionality will be implemented soon.',
    });
  };

  const handleExportData = () => {
    // TODO: Implement export functionality
    toast({
      title: 'Coming Soon',
      description: 'Export functionality will be implemented soon.',
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredRoles={['admin']}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-brand-navy-950 dark:via-brand-navy-900 dark:to-emerald-950">
          <div className="p-6 space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !facility) {
    return (
      <ProtectedRoute requiredRoles={['admin']}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-brand-navy-950 dark:via-brand-navy-900 dark:to-emerald-950">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={handleBackToFacilities}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Facilities
              </Button>
            </div>
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-200">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <Button 
                  onClick={loadFacilityData} 
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-brand-navy-950 dark:via-brand-navy-900 dark:to-emerald-950">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={handleBackToFacilities}
                className="mr-4 hover:bg-white/80 dark:hover:bg-brand-navy-800/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Facilities
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Building className="h-8 w-8 text-emerald-600" />
                  <h1 className="text-4xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
                    {facility.name}
                  </h1>
                  <Badge 
                    variant={facility.status === 'active' ? 'default' : 'secondary'}
                    className={facility.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }
                  >
                    {facility.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <nav className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                  Admin → Facilities → {facility.name}
                </nav>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={handleExportData}
                variant="outline"
                className="bg-white/80 dark:bg-brand-navy-800/80 border-brand-navy-200 dark:border-brand-navy-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button 
                onClick={handleEditFacility}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Facility
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    Total Rooms
                  </CardTitle>
                  <DoorClosed className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                  {rooms.length}
                </div>
                <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                  Active rooms in facility
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    Total Bookings
                  </CardTitle>
                  <Calendar className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                  {stats?.totalBookings || 0}
                </div>
                <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                  All-time bookings
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    Active Bookings
                  </CardTitle>
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                  {stats?.activeBookings || 0}
                </div>
                <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                    Utilization Rate
                  </CardTitle>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                  {stats?.utilizationRate ? `${stats.utilizationRate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                  Average utilization
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md">
              <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900">
                <Building className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="rooms" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900">
                <DoorClosed className="h-4 w-4 mr-2" />
                Rooms
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-emerald-100 dark:data-[state=active]:bg-emerald-900">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facility Information */}
                <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                  <CardHeader>
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                      <Building className="h-5 w-5 text-emerald-600" />
                      Facility Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Name</label>
                      <p className="text-brand-navy-900 dark:text-brand-navy-50 font-medium">{facility.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Location</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-brand-navy-500" />
                        <p className="text-brand-navy-900 dark:text-brand-navy-50">
                          {facility.location || 'No location specified'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Description</label>
                      <p className="text-brand-navy-900 dark:text-brand-navy-50 mt-1">
                        {facility.description || 'No description provided'}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {facility.status === 'active' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          facility.status === 'active'
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}>
                          {facility.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Created</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-brand-navy-500" />
                        <p className="text-brand-navy-900 dark:text-brand-navy-50">
                          {format(new Date(facility.created_at), 'PPP')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Manager Information */}
                <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                  <CardHeader>
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                      Facility Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {manager ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <User className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                              {manager.name}
                            </p>
                            <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                              {manager.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-navy-200 dark:border-brand-navy-700">
                          <div>
                            <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Role</label>
                            <p className="text-brand-navy-900 dark:text-brand-navy-50 capitalize">
                              {manager.role}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Status</label>
                            <Badge
                              variant={manager.status === 'active' ? 'default' : 'secondary'}
                              className={manager.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }
                            >
                              {manager.status}
                            </Badge>
                          </div>
                        </div>

                        {manager.last_login && (
                          <div>
                            <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Last Login</label>
                            <p className="text-brand-navy-900 dark:text-brand-navy-50">
                              {formatDistanceToNow(new Date(manager.last_login), { addSuffix: true })}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 mx-auto text-brand-navy-400 mb-3" />
                        <p className="text-brand-navy-600 dark:text-brand-navy-400">
                          No manager assigned to this facility
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={handleEditFacility}
                        >
                          Assign Manager
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                <CardHeader>
                  <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-emerald-600" />
                    Administrative Actions
                  </CardTitle>
                  <CardDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                    Quick actions for managing this facility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={handleEditFacility}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab('rooms')}
                      className="border-brand-navy-200 dark:border-brand-navy-700"
                    >
                      <DoorClosed className="h-4 w-4 mr-2" />
                      Manage Rooms
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      className="border-brand-navy-200 dark:border-brand-navy-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rooms Tab */}
            <TabsContent value="rooms" className="space-y-6">
              <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                <CardHeader>
                  <div>
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                      <DoorClosed className="h-5 w-5 text-emerald-600" />
                      Rooms ({rooms.length})
                    </CardTitle>
                    <CardDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                      All rooms in this facility (room management is handled by facility managers)
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rooms.map((room) => (
                        <Card key={room.id} className="border-brand-navy-200 dark:border-brand-navy-700 hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg font-medium text-brand-navy-900 dark:text-brand-navy-50">
                                {room.name}
                              </CardTitle>
                              <Badge
                                variant={room.status === 'available' ? 'default' : 'secondary'}
                                className={room.status === 'available'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }
                              >
                                {room.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-brand-navy-600 dark:text-brand-navy-400">
                              <Users className="h-4 w-4" />
                              <span>Capacity: {room.capacity}</span>
                            </div>

                            {room.description && (
                              <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 truncate">
                                {room.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/admin/conference/rooms/${room.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toast({ title: 'Coming Soon', description: 'Room management will be implemented soon.' })}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DoorClosed className="h-12 w-12 mx-auto text-brand-navy-400 mb-4" />
                      <h3 className="text-lg font-medium text-brand-navy-900 dark:text-brand-navy-50 mb-2">
                        No Rooms Found
                      </h3>
                      <p className="text-brand-navy-600 dark:text-brand-navy-400">
                        This facility doesn't have any rooms yet. Room management is handled by the facility manager.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {/* Booking Trends Chart */}
              <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                <CardHeader>
                  <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Booking Trends (Last 30 Days)
                  </CardTitle>
                  <CardDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                    Daily booking activity for this facility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingTrends.length > 0 ? (
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={bookingTrends}
                          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            opacity={0.6}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                            allowDecimals={false}
                            domain={[0, 'dataMax + 1']}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              padding: '12px 16px'
                            }}
                            labelStyle={{
                              color: '#1e293b',
                              fontWeight: '600',
                              marginBottom: '4px'
                            }}
                            formatter={(value: any, name: string) => [
                              `${value} booking${value !== 1 ? 's' : ''}`,
                              'Bookings'
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="bookings"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{
                              fill: '#10b981',
                              strokeWidth: 2,
                              r: 3,
                              stroke: '#ffffff'
                            }}
                            activeDot={{
                              r: 5,
                              stroke: '#10b981',
                              strokeWidth: 2,
                              fill: '#ffffff'
                            }}
                            connectNulls={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 mx-auto text-brand-navy-400 mb-4" />
                      <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mb-2">
                        No booking trends data available yet
                      </p>
                      <p className="text-xs text-brand-navy-500 dark:text-brand-navy-500">
                        Data will appear once bookings are made for this facility
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                  <CardHeader>
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                      Booking Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">
                          {stats?.totalBookings || 0}
                        </div>
                        <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          Total Bookings
                        </div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats?.currentMonthBookings || 0}
                        </div>
                        <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          This Month
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-brand-navy-200 dark:border-brand-navy-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">
                          Utilization Rate
                        </span>
                        <span className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          {stats?.utilizationRate ? `${stats.utilizationRate.toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats?.utilizationRate || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                  <CardHeader>
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-emerald-600" />
                      Popular Booking Times
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.popularTimes && stats.popularTimes.length > 0 ? (
                      <div className="space-y-3">
                        {stats.popularTimes.slice(0, 5).map((time, index) => (
                          <div key={time.hour} className="flex items-center justify-between">
                            <span className="text-sm text-brand-navy-700 dark:text-brand-navy-300">
                              {time.hour}:00 - {time.hour + 1}:00
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-brand-navy-200 dark:bg-brand-navy-700 rounded-full h-2">
                                <div
                                  className="bg-emerald-600 h-2 rounded-full"
                                  style={{
                                    width: `${(time.count / Math.max(...stats.popularTimes.map(t => t.count))) * 100}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm text-brand-navy-600 dark:text-brand-navy-400 w-8">
                                {time.count}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 mx-auto text-brand-navy-400 mb-2" />
                        <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
                          No booking data available yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md border-brand-navy-200 dark:border-brand-navy-700">
                <CardHeader>
                  <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-brand-navy-600 dark:text-brand-navy-400">
                    Latest events and changes in this facility (last 30 days)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-4 border border-brand-navy-200 dark:border-brand-navy-700 rounded-lg hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700/50 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {activity.type === 'booking_created' && (
                              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-emerald-600" />
                              </div>
                            )}
                            {activity.type === 'booking_cancelled' && (
                              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </div>
                            )}
                            {activity.type === 'room_added' && (
                              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <DoorClosed className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                            {activity.type === 'room_updated' && (
                              <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                                <Pencil className="h-4 w-4 text-yellow-600" />
                              </div>
                            )}
                            {activity.type === 'manager_changed' && (
                              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-purple-600" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">
                                {activity.title}
                              </h4>
                              <span className="text-xs text-brand-navy-500 dark:text-brand-navy-400">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400 mt-1">
                              {activity.description}
                            </p>
                            {activity.user && (
                              <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400 mt-2">
                                by {activity.user.name} ({activity.user.email})
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto text-brand-navy-400 mb-4" />
                      <h3 className="text-lg font-medium text-brand-navy-900 dark:text-brand-navy-50 mb-2">
                        No Recent Activity
                      </h3>
                      <p className="text-brand-navy-600 dark:text-brand-navy-400">
                        No activity has been recorded for this facility in the last 30 days.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
