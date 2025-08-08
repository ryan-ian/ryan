'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  Lock,
  User as UserIcon,
  Settings,
  History,
} from 'lucide-react';
import { getUserById, getUserAuditLogs, type User, type UserAuditLog } from '@/lib/admin-data';
import { UserStatusBadge } from '@/components/admin/user-status-badge';
import { UserSuspensionDialog } from '@/components/admin/user-suspension-dialog';
import { UserLockDialog } from '@/components/admin/user-lock-dialog';
import { AuditLogsViewer } from '@/components/admin/audit-logs-viewer';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuspensionDialogOpen, setIsSuspensionDialogOpen] = useState(false);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await getUserById(userId);
      if (!userData) {
        setError('User not found');
        return;
      }
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspensionSuccess = () => {
    fetchUser();
  };

  const handleLockSuccess = () => {
    fetchUser();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground">Detailed user information and management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSuspensionDialogOpen(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            {user.status === 'suspended' ? 'Manage Suspension' : 'Suspend User'}
          </Button>
          <Button variant="outline" onClick={() => setIsLockDialogOpen(true)}>
            <Lock className="h-4 w-4 mr-2" />
            {user.status === 'locked' ? 'Unlock Account' : 'Lock Account'}
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* User Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profile_image} />
              <AvatarFallback className="text-lg">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <UserStatusBadge 
                  status={user.status}
                  role={user.role}
                  suspendedUntil={user.suspended_until}
                  lockedUntil={user.locked_until}
                  suspensionReason={user.suspension_reason}
                  showRole={true}
                  size="lg"
                />
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(user.date_created), 'PPP')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="font-medium">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="font-medium">{user.department || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Position</label>
                    <p className="font-medium">{user.position || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <p className="font-mono text-sm">{user.id.slice(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="mt-1">
                      <Badge className={
                        user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        user.role === 'facility_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }>
                        {user.role === 'facility_manager' ? 'Facility Manager' : 
                          user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <UserStatusBadge 
                        status={user.status}
                        role={user.role}
                        suspendedUntil={user.suspended_until}
                        lockedUntil={user.locked_until}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="font-medium">{format(new Date(user.date_created), 'PPP')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="font-medium">
                      {user.last_login ? format(new Date(user.last_login), 'PPp') : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status-specific information */}
          {user.status === 'suspended' && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Suspension Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-orange-700 dark:text-orange-300">Reason</label>
                    <p className="text-orange-800 dark:text-orange-200">{user.suspension_reason || 'No reason provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-orange-700 dark:text-orange-300">Until</label>
                    <p className="text-orange-800 dark:text-orange-200">
                      {user.suspended_until ? format(new Date(user.suspended_until), 'PPp') : 'Indefinite'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {user.status === 'locked' && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-400 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Account Lock Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-red-700 dark:text-red-300">Failed Attempts</label>
                    <p className="text-red-800 dark:text-red-200">{user.failed_login_attempts || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-red-700 dark:text-red-300">Locked Until</label>
                    <p className="text-red-800 dark:text-red-200">
                      {user.locked_until ? format(new Date(user.locked_until), 'PPp') : 'Manual unlock required'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <AuditLogsViewer userId={userId} />
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Current security settings and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Account Status</span>
                  <UserStatusBadge 
                    status={user.status}
                    role={user.role}
                    size="sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Failed Login Attempts</span>
                  <Badge variant={user.failed_login_attempts && user.failed_login_attempts > 0 ? "destructive" : "outline"}>
                    {user.failed_login_attempts || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last Login</span>
                  <span className="text-sm text-muted-foreground">
                    {user.last_login ? format(new Date(user.last_login), 'PPp') : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Actions</CardTitle>
                <CardDescription>Administrative security controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="h-4 w-4 mr-2" />
                  Force Logout All Sessions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsSuspensionDialogOpen(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {user.status === 'suspended' ? 'Manage Suspension' : 'Suspend Account'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsLockDialogOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {user.status === 'locked' ? 'Unlock Account' : 'Lock Account'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage user account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive booking confirmations and updates</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Profile Visibility</h4>
                    <p className="text-sm text-muted-foreground">Control who can see your profile information</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Export</h4>
                    <p className="text-sm text-muted-foreground">Download user data and activity history</p>
                  </div>
                  <Button variant="outline" size="sm">Export</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <UserSuspensionDialog
        user={user}
        open={isSuspensionDialogOpen}
        onOpenChange={setIsSuspensionDialogOpen}
        onSuccess={handleSuspensionSuccess}
      />

      <UserLockDialog
        user={user}
        open={isLockDialogOpen}
        onOpenChange={setIsLockDialogOpen}
        onSuccess={handleLockSuccess}
      />
    </div>
  );
}
