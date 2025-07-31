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
  <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 overflow-hidden">
    <div className="h-1 bg-brand-navy-500 w-full"></div>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">{title}</CardTitle>
      <div className="h-8 w-8 rounded-full bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-400 flex items-center justify-center">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{value}</div>
      <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">{description}</p>
      {trend && (
        <div className="flex items-center mt-2">
          {trend.isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-success mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
          )}
          <span className={`text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
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
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
      <CardHeader>
        <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Recent Activity</CardTitle>
        <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Latest events in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">No recent activity to display.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="rounded-full bg-brand-navy-100 dark:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-400 p-2">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">{activity.title}</p>
                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">{activity.description}</p>
                  <p className="text-xs text-brand-navy-500 dark:text-brand-navy-400">{formatDate(activity.timestamp)}</p>
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
  <Card className="col-span-1 md:col-span-2 border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
    <CardHeader>
      <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Usage Analytics</CardTitle>
      <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Booking trends and user growth over time</CardDescription>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="bookings">
        <TabsList className="mb-4 bg-brand-navy-100 dark:bg-brand-navy-700">
          <TabsTrigger 
            value="bookings" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brand-navy-800 data-[state=active]:text-brand-navy-900 dark:data-[state=active]:text-brand-navy-50"
          >
            Booking Trends
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brand-navy-800 data-[state=active]:text-brand-navy-900 dark:data-[state=active]:text-brand-navy-50"
          >
            User Growth
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#0A2540"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        <TabsContent value="users" className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="users" fill="#0A2540" />
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-navy-500 mx-auto"></div>
          <p className="mt-4 text-brand-navy-700 dark:text-brand-navy-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md bg-destructive/10 border border-destructive/30 rounded-lg">
          <h2 className="text-xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-destructive-foreground">{error}</p>
          <Button 
            className="mt-4 bg-brand-navy-500 hover:bg-brand-navy-600 text-white"
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
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">Admin Dashboard</h1>
          <p className="text-brand-navy-700 dark:text-brand-navy-300">
            Overview of system statistics and recent activities.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          className="flex items-center gap-2 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
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