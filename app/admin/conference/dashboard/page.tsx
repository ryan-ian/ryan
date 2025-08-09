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
  RefreshCcw,
  BarChart3 as BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
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
  <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
    <div className="h-1 bg-gradient-to-r from-brand-navy-500 to-emerald-500 w-full"></div>
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">{title}</CardTitle>
      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-navy-100 to-emerald-100 dark:from-brand-navy-700 dark:to-emerald-900 text-brand-navy-600 dark:text-brand-navy-400 flex items-center justify-center shadow-sm">
        {icon}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-1">{value}</div>
      <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mb-3">{description}</p>
      {trend && (
        <div className="flex items-center">
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {trend.value}% {trend.isPositive ? 'increase' : 'decrease'}
          </div>
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
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-brand-navy-200 dark:border-brand-navy-700 bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Latest events in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-brand-navy-400 dark:text-brand-navy-600 mb-3" />
              <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">No recent activity to display.</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-brand-navy-100 dark:border-brand-navy-700 hover:bg-brand-navy-50 dark:hover:bg-brand-navy-700/50 transition-colors">
                <div className="rounded-lg bg-gradient-to-br from-brand-navy-100 to-emerald-100 dark:from-brand-navy-700 dark:to-emerald-900 text-brand-navy-600 dark:text-brand-navy-400 p-2 shadow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">{activity.title}</p>
                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300 truncate">{activity.description}</p>
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
  <Card className="col-span-1 md:col-span-2 border-brand-navy-200 dark:border-brand-navy-700 bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md">
    <CardHeader>
      <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 flex items-center gap-2">
        <BarChart className="h-5 w-5" />
        Usage Analytics
      </CardTitle>
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
            <RechartsBarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="users" fill="#0A2540" />
            </RechartsBarChart>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 dark:from-brand-navy-950 dark:via-brand-navy-900 dark:to-emerald-950">
      <div className="p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50 mb-2">Admin Dashboard</h1>
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300">
              Overview of system statistics and recent activities.
            </p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => refetch()}
            className="flex items-center gap-2 border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 backdrop-blur-sm bg-white/80 dark:bg-brand-navy-800/80"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RecentActivityFeed activities={activities} />
          <UsageCharts bookingTrends={bookingTrends} userGrowth={userGrowth} />
        </div>
      </div>
    </div>
  );
} 