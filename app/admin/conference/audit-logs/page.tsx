'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogsViewer } from '@/components/admin/audit-logs-viewer';
import { getUserStatistics } from '@/lib/admin-data';
import { useEffect } from 'react';
import {
  Activity,
  Users,
  Shield,
  AlertTriangle,
  Lock,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  lockedUsers: number;
  adminUsers: number;
  facilityManagers: number;
  regularUsers: number;
}

export default function AuditLogsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const userStats = await getUserStatistics();
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    color = "text-blue-600" 
  }: {
    title: string;
    value: number;
    icon: any;
    description: string;
    color?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs & Analytics</h1>
          <p className="text-muted-foreground">
            Monitor user management activities and system security events.
          </p>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            description="All registered users"
            color="text-blue-600"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={TrendingUp}
            description="Currently active accounts"
            color="text-green-600"
          />
          <StatCard
            title="Security Issues"
            value={stats.suspendedUsers + stats.lockedUsers}
            icon={AlertTriangle}
            description="Suspended or locked accounts"
            color="text-orange-600"
          />
          <StatCard
            title="Admin Users"
            value={stats.adminUsers}
            icon={Shield}
            description="Users with admin privileges"
            color="text-red-600"
          />
        </div>
      )}

      <Tabs defaultValue="all-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-logs">All Audit Logs</TabsTrigger>
          <TabsTrigger value="security-events">Security Events</TabsTrigger>
          <TabsTrigger value="user-stats">User Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="all-logs">
          <AuditLogsViewer />
        </TabsContent>

        <TabsContent value="security-events">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Suspension Events
                </CardTitle>
                <CardDescription>Recent user suspensions</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogsViewer className="border-0 shadow-none" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Account Lockouts
                </CardTitle>
                <CardDescription>Recent account lockouts</CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogsViewer className="border-0 shadow-none" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user-stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  User Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of user account statuses</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Users</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.activeUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Inactive Users</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full" 
                            style={{ width: `${(stats.inactiveUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.inactiveUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Suspended Users</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${(stats.suspendedUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.suspendedUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Locked Users</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(stats.lockedUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.lockedUsers}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Distribution
                </CardTitle>
                <CardDescription>Breakdown of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Regular Users</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(stats.regularUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.regularUsers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Facility Managers</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(stats.facilityManagers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.facilityManagers}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Administrators</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(stats.adminUsers / stats.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">{stats.adminUsers}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
