'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Users, 
  Building2, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAdminStats } from '@/hooks/use-admin-stats';
import type { ActivityItem, BookingTrend, UserGrowth } from '@/lib/admin-data';

// Types
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Components
const StatsCard = ({ title, value, description, icon, trend }: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <div className="flex items-center mt-2">
          {trend.isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.value}% {trend.isPositive ? 'increase' : 'decrease'}
          </span>
        </div>
      )}
    </CardContent>
  </Card>
);

const RecentActivityFeed = ({ activities }: { activities: ActivityItem[] }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_signup':
        return <Users className="h-4 w-4" />;
      case 'facility_added':
        return <Building2 className="h-4 w-4" />;
      case 'booking_created':
        return <Calendar className="h-4 w-4" />;
      case 'system_alert':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity to display.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="rounded-full bg-muted p-2">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UsageCharts = ({ bookingTrends, userGrowth }: { bookingTrends: BookingTrend[], userGrowth: UserGrowth[] }) => (
  <Card className="col-span-1 md:col-span-2">
    <CardHeader>
      <CardTitle>Usage Analytics</CardTitle>
      <CardDescription>Booking trends and user growth over time</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="bookings">
        <TabsList className="mb-4">
          <TabsTrigger value="bookings">Booking Trends</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#8884d8"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="users" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const { stats, activities, bookingTrends, userGrowth, isLoading, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => refetch()}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of system statistics and recent activities.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered users in the system"
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Facilities"
          value={stats.totalFacilities}
          description="Managed facilities"
          icon={<Building2 className="h-4 w-4" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Bookings"
          value={stats.activeBookings}
          description="Current active bookings"
          icon={<Calendar className="h-4 w-4" />}
          trend={{ value: 8, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentActivityFeed activities={activities} />
        <UsageCharts bookingTrends={bookingTrends} userGrowth={userGrowth} />
      </div>
    </div>
  );
} 